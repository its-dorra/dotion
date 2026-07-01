import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Light", icon: <Sun className="h-3.75 w-3.75" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-3.75 w-3.75" /> },
  {
    value: "system",
    label: "System",
    icon: <Laptop className="h-3.75 w-3.75" />,
  },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const icon =
    theme === "dark" ? (
      <Moon className="h-3.75 w-3.75" />
    ) : theme === "system" ? (
      <Laptop className="h-3.75 w-3.75" />
    ) : (
      <Sun className="h-3.75 w-3.75" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={cn(
              "gap-2 text-[13px]",
              theme === themeOption.value && "font-medium bg-accent text-accent-foreground",
            )}
          >
            {themeOption.icon}
            {themeOption.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
