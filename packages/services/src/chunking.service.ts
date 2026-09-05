import * as Y from "yjs";

export interface BlockNoteInlineContent {
  type: string;
  text?: string;
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
   * Helper to extract plain text from inline content structures
   */
  private extractInlineText(content: BlockNoteBlock["content"]): string {
    if (!content) return "";
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
      return content
        .map((item) => (typeof item === "string" ? item : (item.text ?? "")))
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

    const parseNode = (
      node: Y.XmlElement | Y.XmlText | Y.XmlHook,
    ): BlockNoteBlock | null => {
      if (!(node instanceof Y.XmlElement)) return null;

      const nodeName = node.nodeName;
      if (nodeName !== "block") {
        const children: BlockNoteBlock[] = [];
        node.forEach((child) => {
          const parsed = parseNode(child);
          if (parsed) children.push(parsed);
        });
        return children.length > 0 ? { children } : null;
      }

      const id = node.getAttribute("id") ?? undefined;
      const type = node.getAttribute("type") ?? "paragraph";
      const propsStr = node.getAttribute("props");
      let props: Record<string, unknown> = {};
      if (propsStr) {
        try {
          props = JSON.parse(propsStr);
        } catch {}
      }

      let contentStr = "";
      const childBlocks: BlockNoteBlock[] = [];

      node.forEach((child) => {
        if (child instanceof Y.XmlText) {
          contentStr += child.toString();
        } else if (child instanceof Y.XmlElement) {
          if (child.nodeName === "content") {
            contentStr += child.toString();
          } else {
            const parsedChild = parseNode(child);
            if (parsedChild) childBlocks.push(parsedChild);
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

    const traverse = (nodeList: BlockNoteBlock[]) => {
      for (const block of nodeList) {
        const blockType = block.type ?? "paragraph";
        const blockId = block.id ?? crypto.randomUUID();

        // Strictly skip all media/file blocks
        if (MEDIA_BLOCK_TYPES.has(blockType)) {
          continue;
        }

        const text = this.extractInlineText(block.content);

        // Heading marks a new section boundary
        if (blockType === "heading" && text.length > 0) {
          // If previous section had accumulated text, push it
          if (
            currentSection.lines.length > 0 ||
            currentSection.blockIds.length > 0
          ) {
            sections.push(currentSection);
          }

          currentSection = {
            sectionTitle: text,
            headingBlockId: blockId,
            blockIds: [blockId],
            lines: [text],
          };
        } else if (text.length > 0) {
          currentSection.blockIds.push(blockId);
          currentSection.lines.push(text);
        }

        // Recursively traverse child blocks if present
        if (Array.isArray(block.children) && block.children.length > 0) {
          traverse(block.children);
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
