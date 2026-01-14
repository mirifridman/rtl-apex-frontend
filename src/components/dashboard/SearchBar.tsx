import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "חיפוש משימות...", className }: SearchBarProps) {
  return (
    <div className={cn("relative group", className)}>
      {/* Glow effect on focus */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
      
      <div className="relative flex items-center glass-card rounded-2xl border border-white/10 group-focus-within:border-primary/50 transition-all duration-300">
        <Search className="w-5 h-5 text-muted-foreground mr-4 ml-1 group-focus-within:text-primary transition-colors" />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-3 pl-4 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        />
        
        {value && (
          <button
            onClick={() => onChange("")}
            className="p-2 ml-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
