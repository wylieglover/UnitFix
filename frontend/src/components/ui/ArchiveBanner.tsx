import { AlertCircle } from "lucide-react";

interface ArchiveBannerProps {
  isArchived: boolean;
  message?: string;
  className?: string;
}

export const ArchiveBanner = ({ 
  isArchived, 
  message = "This item is archived and no longer accessible.", 
  className = "" 
}: ArchiveBannerProps) => {
  if (!isArchived) return null;

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 ${className}`}>
      <AlertCircle size={20} className="shrink-0" />
      <span className="text-sm font-medium">
        {message}
      </span>
    </div>
  );
};