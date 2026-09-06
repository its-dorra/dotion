import * as Y from "yjs";

export interface BlockNoteInlineContent {
  type: string;
  text?: string;
  href?: string;
  content?: BlockNoteInlineContent[] | string;
  styles?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BlockNoteTableCell {
  text?: string;
  content?: BlockNoteInlineContent[] | string;
  [key: string]: unknown;
}

export interface BlockNoteBlock {
  id?: string;
  type?: string;
  props?: {
    level?: number;
    checked?: boolean | string;
    language?: string;
    icon?: string;
    textAlignment?: string;
    textColor?: string;
    backgroundColor?: string;
    [key: string]: unknown;
  };
  content?:
    | BlockNoteInlineContent[]
    | string
    | { type: string; rows: { cells: BlockNoteTableCell[] }[] };
  children?: BlockNoteBlock[];
  [key: string]: unknown;
}

export interface ParsedSection {
  sectionIndex: number;
  sectionTitle: string;
  headingBlockId: string;
  blockIds: string[];
  content: string;
  contentHash: string;
}

const MEDIA_BLOCK_TYPES = new Set(["image", "video", "audio", "file", "embed"]);

export class ChunkingService {
  /**
   * Helper to extract plain text with inline links from inline content structures
   */
  private extractInlineText(content: BlockNoteBlock["content"]): string {
    if (!content) return "";
    if (typeof content === "string") return content.trim();

    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === "string") return item;
          if (!item) return "";

          // Inline link support: [text](href)
          if (
            item.type === "link" &&
            item.href &&
            typeof item.href === "string"
          ) {
            const linkText = Array.isArray(item.content)
              ? this.extractInlineText(item.content)
              : typeof item.text === "string" && item.text.length > 0
                ? item.text
                : item.href;
            return `[${linkText}](${item.href})`;
          }

          return item.text ?? "";
        })
        .join("")
        .trim();
    }

    // Table block support
    if (
      typeof content === "object" &&
      "rows" in content &&
      Array.isArray(content.rows)
    ) {
      return content.rows
        .map((row) =>
          row.cells
            .map((cell) => {
              if (typeof cell === "string") return cell;
              if (Array.isArray(cell.content)) {
                return cell.content
                  .map((c) => (typeof c === "string" ? c : (c.text ?? "")))
                  .join("");
              }
              return cell.text ?? "";
            })
            .join(" | "),
        )
        .join("\n");
    }

    return "";
  }

  /**
   * Formats a single BlockNote block into Markdown representation (e.g. [ ] / [x] checklists,
   * headings, code fences, blockquotes, callouts, and indented lists).
   */
  private formatBlockToMarkdown(block: BlockNoteBlock, depth = 0): string {
    const indent = "  ".repeat(depth);
    const text = this.extractInlineText(block.content);
    const blockType = (block.type ?? "paragraph").toLowerCase();

    switch (blockType) {
      case "heading": {
        const level = Number(block.props?.level) || 1;
        const boundedLevel = Math.min(Math.max(level, 1), 6);
        return `${"#".repeat(boundedLevel)} ${text}`;
      }
      case "checklistitem":
      case "check_list_item": {
        const isChecked =
          block.props?.checked === true || block.props?.checked === "true";
        const checkMark = isChecked ? "[x]" : "[ ]";
        return `${indent}- ${checkMark} ${text}`;
      }
      case "bulletlistitem":
      case "bullet_list_item":
        return `${indent}- ${text}`;
      case "numberedlistitem":
      case "numbered_list_item":
        return `${indent}1. ${text}`;
      case "codeblock":
      case "code": {
        const lang = (block.props?.language as string) || "";
        return `${indent}\`\`\`${lang}\n${text}\n${indent}\`\`\``;
      }
      case "quote":
      case "blockquote":
        return `${indent}> ${text}`;
      case "callout": {
        const icon = (block.props?.icon as string) || "💡";
        return `${indent}> [!NOTE] ${icon} ${text}`;
      }
      default:
        return `${indent}${text}`;
    }
  }

  /**
   * Helper to compute SHA-256 hash string for delta comparisons
   */
  private async computeHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Extract blocks directly from a Yjs document update binary
   */
  parseYDocBlocks(ydoc: Y.Doc): BlockNoteBlock[] {
    const fragment = ydoc.getXmlFragment("document-store");
    const blocks: BlockNoteBlock[] = [];

    const extractAttributes = (el: Y.XmlElement): Record<string, unknown> => {
      let extracted: Record<string, unknown> = {};
      const propsAttr = el.getAttribute("props");
      if (typeof propsAttr === "string") {
        try {
          extracted = JSON.parse(propsAttr);
        } catch {}
      } else if (typeof propsAttr === "object" && propsAttr !== null) {
        extracted = { ...(propsAttr as Record<string, unknown>) };
      }

      for (const attr of [
        "checked",
        "level",
        "language",
        "icon",
        "textAlignment",
        "textColor",
        "backgroundColor",
      ]) {
        const val = el.getAttribute(attr);
        if (val !== undefined && val !== null && !(attr in extracted)) {
          if (typeof val === "boolean" || typeof val === "number") {
            extracted[attr] = val;
          } else if (typeof val === "string") {
            const trimmed = val.trim();
            if (trimmed === "true") extracted[attr] = true;
            else if (trimmed === "false") extracted[attr] = false;
            else if (!isNaN(Number(trimmed)) && trimmed !== "")
              extracted[attr] = Number(trimmed);
            else extracted[attr] = val;
          } else {
            extracted[attr] = val;
          }
        }
      }
      return extracted;
    };

    const parseNode = (
      node: Y.XmlElement | Y.XmlText | Y.XmlHook,
    ): BlockNoteBlock | null => {
      if (!(node instanceof Y.XmlElement)) return null;

      const nodeName = node.nodeName;

      // Handle standard BlockNote blockContainer
      if (nodeName === "blockContainer") {
        const id = node.getAttribute("id") ?? undefined;
        let type = "paragraph";
        let contentStr = "";
        let props: Record<string, unknown> = extractAttributes(node);
        const childBlocks: BlockNoteBlock[] = [];

        node.forEach((child) => {
          if (child instanceof Y.XmlElement) {
            const childName = child.nodeName;
            if (childName === "blockGroup") {
              child.forEach((nested) => {
                const parsed = parseNode(nested);
                if (parsed) {
                  if (parsed.type) childBlocks.push(parsed);
                  else if (parsed.children)
                    childBlocks.push(...parsed.children);
                }
              });
            } else {
              type = child.getAttribute("type") ?? childName;
              props = { ...props, ...extractAttributes(child) };
              child.forEach((c) => {
                if (c instanceof Y.XmlText) {
                  contentStr += c.toString();
                } else if (c instanceof Y.XmlElement) {
                  if (c.nodeName === "link") {
                    const href = c.getAttribute("href");
                    const linkText = c.toString();
                    contentStr += href ? `[${linkText}](${href})` : linkText;
                  } else {
                    contentStr += c.toString();
                  }
                }
              });
            }
          } else if (child instanceof Y.XmlText) {
            contentStr += child.toString();
          }
        });

        return {
          id,
          type,
          props,
          content: contentStr,
          children: childBlocks.length > 0 ? childBlocks : undefined,
        };
      }

      // Handle direct <block> element
      if (nodeName === "block") {
        const id = node.getAttribute("id") ?? undefined;
        const type = node.getAttribute("type") ?? "paragraph";
        const props: Record<string, unknown> = extractAttributes(node);
        let contentStr = "";
        const childBlocks: BlockNoteBlock[] = [];

        node.forEach((child) => {
          if (child instanceof Y.XmlText) {
            contentStr += child.toString();
          } else if (child instanceof Y.XmlElement) {
            if (child.nodeName === "content") {
              contentStr += child.toString();
            } else if (child.nodeName === "link") {
              const href = child.getAttribute("href");
              const linkText = child.toString();
              contentStr += href ? `[${linkText}](${href})` : linkText;
            } else {
              const parsedChild = parseNode(child);
              if (parsedChild) {
                if (parsedChild.type) childBlocks.push(parsedChild);
                else if (parsedChild.children)
                  childBlocks.push(...parsedChild.children);
              }
            }
          }
        });

        return {
          id,
          type,
          props,
          content: contentStr,
          children: childBlocks.length > 0 ? childBlocks : undefined,
        };
      }

      // Generic container node (blockGroup or fragment root)
      const children: BlockNoteBlock[] = [];
      node.forEach((child) => {
        const parsed = parseNode(child);
        if (parsed) {
          if (parsed.type) {
            children.push(parsed);
          } else if (parsed.children) {
            children.push(...parsed.children);
          }
        }
      });
      return children.length > 0 ? { children } : null;
    };

    fragment.forEach((child) => {
      const parsed = parseNode(child);
      if (parsed) {
        if (parsed.type) {
          blocks.push(parsed);
        } else if (parsed.children) {
          blocks.push(...parsed.children);
        }
      }
    });

    return blocks;
  }

  /**
   * Parses a BlockNote document block array into semantic sections by heading boundaries.
   * Strictly filters out and ignores any file or media blocks.
   */
  async parseDocumentSections(
    pageTitle: string,
    blocks: BlockNoteBlock[],
  ): Promise<ParsedSection[]> {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      const defaultContent = pageTitle.trim();
      const defaultHash = await this.computeHash(
        `${pageTitle}\n${defaultContent}`,
      );
      return [
        {
          sectionIndex: 0,
          sectionTitle: pageTitle,
          headingBlockId: "root",
          blockIds: ["root"],
          content: defaultContent,
          contentHash: defaultHash,
        },
      ];
    }

    const sections: Array<{
      sectionTitle: string;
      headingBlockId: string;
      blockIds: string[];
      lines: string[];
    }> = [];

    let currentSection = {
      sectionTitle: pageTitle,
      headingBlockId: "root",
      blockIds: [] as string[],
      lines: [] as string[],
    };

    const traverse = (nodeList: BlockNoteBlock[], depth = 0) => {
      for (const block of nodeList) {
        const blockType = (block.type ?? "paragraph").toLowerCase();
        const blockId = block.id ?? crypto.randomUUID();

        // Strictly skip all media/file blocks
        if (MEDIA_BLOCK_TYPES.has(blockType)) {
          continue;
        }

        const rawText = this.extractInlineText(block.content);

        // Heading marks a new section boundary
        if (blockType === "heading" && rawText.length > 0) {
          // If previous section had accumulated text, push it
          if (
            currentSection.lines.length > 0 ||
            currentSection.blockIds.length > 0
          ) {
            sections.push(currentSection);
          }

          currentSection = {
            sectionTitle: rawText,
            headingBlockId: blockId,
            blockIds: [blockId],
            lines: [this.formatBlockToMarkdown(block, 0)],
          };
        } else if (rawText.length > 0) {
          const formattedLine = this.formatBlockToMarkdown(block, depth);
          currentSection.blockIds.push(blockId);
          currentSection.lines.push(formattedLine);
        }

        // Recursively traverse child blocks if present with incremented depth
        if (Array.isArray(block.children) && block.children.length > 0) {
          traverse(block.children, depth + 1);
        }
      }
    };

    traverse(blocks);

    if (currentSection.lines.length > 0 || currentSection.blockIds.length > 0) {
      sections.push(currentSection);
    }

    // If all blocks were media or empty, provide fallback section
    if (sections.length === 0) {
      const fallbackHash = await this.computeHash(`${pageTitle}\n${pageTitle}`);
      return [
        {
          sectionIndex: 0,
          sectionTitle: pageTitle,
          headingBlockId: "root",
          blockIds: ["root"],
          content: pageTitle,
          contentHash: fallbackHash,
        },
      ];
    }

    // Format final sections with sectionIndex and contentHash
    const result: ParsedSection[] = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!s) continue;
      const content = s.lines.join("\n").trim();
      const contentHash = await this.computeHash(
        `${s.sectionTitle}\n${content}`,
      );

      result.push({
        sectionIndex: i,
        sectionTitle: s.sectionTitle,
        headingBlockId: s.headingBlockId,
        blockIds: s.blockIds,
        content: content || s.sectionTitle,
        contentHash,
      });
    }

    return result;
  }
}
