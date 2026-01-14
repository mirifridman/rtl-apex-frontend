import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "w-10 h-10 rounded-xl",
        "hover:bg-secondary transition-all duration-300",
        className
      )}
      title={theme === 'dark' ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-warning" />
      ) : (
        <Moon className="w-5 h-5 text-primary" />
      )}
    </Button>
  );
}
