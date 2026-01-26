import { AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) => {
  
  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
  };

  const iconStyles = {
    danger: "text-red-600 bg-red-50",
    primary: "text-indigo-600 bg-indigo-50",
    warning: "text-amber-600 bg-amber-50",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 p-3 rounded-xl ${iconStyles[variant]}`}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-gray-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm} 
            loading={loading}
            className={variantStyles[variant]}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};