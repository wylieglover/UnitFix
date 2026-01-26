// src/components/ui/SearchInput.tsx
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "indigo" | "blue";
}

export const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "",
  variant = "indigo"
}: SearchInputProps) => {
  const activeColor = variant === "indigo" ? "focus:ring-indigo-500/20 focus:border-indigo-500" : "focus:ring-blue-500/20 focus:border-blue-500";
  const iconColor = variant === "indigo" ? "group-focus-within:text-indigo-500" : "group-focus-within:text-blue-500";

  return (
    <div className={`relative group ${className}`}>
      <Search 
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors ${iconColor}`} 
        size={18} 
      />
      <input
        type="text"
        placeholder={placeholder}
        // Added 'text-gray-900' explicitly here
        className={`w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all shadow-sm ${activeColor}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};