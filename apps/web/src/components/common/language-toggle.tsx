import { useState } from "react";
import { Button } from "../ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "AR", label: "العربية" },
];

export default function LanguageToggle() {
  const [language, setLanguage] = useState(LANGUAGES[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-3.75 w-3.75" />
          <span className="text-[13px]">{language.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang)}
            className="justify-between text-[13px]"
          >
            {lang.label}
            {lang.code === language.code && (
              <span className="text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
