// src/components/ui/FilterBar.tsx
import { SearchInput } from "./SearchInput";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface DropdownFilter {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface FilterBarProps {
  // Search Props
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  
  // Tab Props (optional now)
  activeTab?: string;
  onTabChange?: (val: string) => void;
  tabs?: FilterOption[];
  
  // Dropdown filters (new)
  dropdowns?: DropdownFilter[];
  
  // Theme
  variant?: "indigo" | "blue";
  resultsCount?: number;
}

const Dropdown = ({ filter, variant = "indigo" }: { filter: DropdownFilter; variant?: "indigo" | "blue" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeColor = variant === "indigo" ? "text-indigo-600" : "text-blue-600";
  const hoverColor = variant === "indigo" ? "hover:bg-indigo-50" : "hover:bg-blue-50";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = filter.options.find(opt => opt.value === filter.value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
          {filter.label}:
        </span>
        <span className={`font-semibold ${activeColor}`}>
          {selectedOption?.label || "All"}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {filter.options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                filter.onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                option.value === filter.value
                  ? `${activeColor} bg-gray-50 font-semibold`
                  : `text-gray-700 ${hoverColor}`
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const FilterBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  activeTab,
  onTabChange,
  tabs,
  dropdowns,
  variant = "indigo",
  resultsCount
}: FilterBarProps) => {
  const activeBg = variant === "indigo" ? "bg-indigo-600 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm";
  const inactiveText = "text-gray-500 hover:text-gray-700 hover:bg-gray-50";

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
      {/* Tabs Section (if provided) */}
      {tabs && tabs.length > 0 && onTabChange && activeTab && (
        <>
          <div className="flex p-1 bg-gray-50 rounded-xl w-full lg:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`flex-1 lg:flex-none px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === tab.value ? activeBg : inactiveText
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {dropdowns && dropdowns.length > 0 && (
            <div className="hidden lg:block h-8 w-px bg-gray-200 mx-1" />
          )}
        </>
      )}

      {/* Dropdown Filters Section (if provided) */}
      {dropdowns && dropdowns.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {dropdowns.map((filter, idx) => (
              <Dropdown key={idx} filter={filter} variant={variant} />
            ))}
          </div>
          <div className="hidden lg:block h-8 w-px bg-gray-200 mx-1" />
        </>
      )}

      {/* Search Section */}
      <div className="flex-1 w-full">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          variant={variant}
          className="border-none shadow-none"
        />
      </div>

      {/* Results Count */}
      {typeof resultsCount === "number" && (
        <div className="hidden sm:block text-[10px] font-black text-gray-400 uppercase tracking-widest pr-4">
          {resultsCount} {resultsCount === 1 ? "Record" : "Records"}
        </div>
      )}
    </div>
  );
};