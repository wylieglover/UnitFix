// src/components/ui/ArchiveButton.tsx
import { useState } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { Button, type ButtonVariant } from "./Button"; // Import the type
import { ConfirmModal } from "./ConfirmModal";

interface ArchiveButtonProps {
  isArchived: boolean;
  entityName: string;
  onConfirm: () => Promise<void>;
  variant?: ButtonVariant; // Use the same type here!
  className?: string;
  showIcon?: boolean;
}

export const ArchiveButton = ({
  isArchived,
  entityName,
  onConfirm,
  variant = "outline",
  className = "",
  showIcon = true,
}: ArchiveButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsModalOpen(false);
    } catch (error) {
      console.error(`Failed to toggle archive for ${entityName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = isArchived ? `Restore ${entityName}` : `Archive ${entityName}`;
  
  // LOGIC FIX: If we are restoring, we want it to look "Positive" (Emerald/Green)
  // If we are archiving, we use the passed variant (usually outline or danger)
  const colorClass = isArchived 
    ? "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 shadow-none" 
    : className;

  return (
    <>
      <Button
        variant={isArchived ? "outline" : variant} // Fallback to outline if archived to let colorClass shine
        onClick={() => setIsModalOpen(true)}
        className={`${colorClass}`}
      >
        <span className="flex items-center gap-2">
          {showIcon && (isArchived ? <RotateCcw size={16} /> : <Archive size={16} />)}
          {buttonLabel}
        </span>
      </Button>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAction}
        loading={isLoading}
        variant={isArchived ? "primary" : "danger"}
        title={isArchived ? `Restore ${entityName}` : `Archive ${entityName}`}
        description={
          isArchived
            ? `Are you sure you want to restore this ${entityName.toLowerCase()}? It will be visible and active again.`
            : `Are you sure you want to archive this ${entityName.toLowerCase()}? This will hide it from active lists.`
        }
        confirmText={isArchived ? "Restore" : "Archive"}
      />
    </>
  );
};