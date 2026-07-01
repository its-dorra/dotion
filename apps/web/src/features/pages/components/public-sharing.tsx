import { useState } from "react";
import { Globe, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicSharingProps {
  isPublic: boolean;
  publicUrl?: string;
  onTogglePublic: (isPublic: boolean) => void;
  isUpdating: boolean;
}

export function PublicSharing({
  isPublic,
  publicUrl,
  onTogglePublic,
  isUpdating,
}: PublicSharingProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-2 rounded-md border p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Share to web
        </span>
        <Button
          variant={isPublic ? "default" : "outline"}
          size="sm"
          className="h-7"
          disabled={isUpdating}
          onClick={() => onTogglePublic(!isPublic)}
        >
          {isPublic ? "Public" : "Private"}
        </Button>
      </div>
      {isPublic && publicUrl ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full justify-start gap-2 px-2 text-muted-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <LinkIcon className="h-3.5 w-3.5" />
          )}
          <span className="truncate">{copied ? "Copied" : publicUrl}</span>
        </Button>
      ) : null}
    </div>
  );
}
