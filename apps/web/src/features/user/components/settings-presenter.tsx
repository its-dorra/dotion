import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/theme-provider";

const themeOptions = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

export function SettingsPresenter() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Appearance</p>
          <p className="text-sm text-muted-foreground">
            Choose how Jotion looks on this device.
          </p>
        </div>
        <div className="flex gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => setTheme(value)}
              className={cn(
                "flex-1 gap-1.5",
                theme === value && "border-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
