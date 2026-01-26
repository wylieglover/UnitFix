// src/components/ui/BackButton.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
}

export const BackButton = ({ fallbackPath, label = "Back" }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // window.history.state.idx > 0 means there is a previous page in this tab's history
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      // Default fallback: Try to go up one level in the URL path
      const pathSegments = location.pathname.split('/').filter(Boolean);
      pathSegments.pop();
      navigate('/' + pathSegments.join('/'));
    }
  };

  return (
    <button 
      onClick={handleBack}
      className="group flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-all duration-200"
    >
      <div className="p-1.5 rounded-lg group-hover:bg-indigo-50 transition-colors">
        <ArrowLeft size={18} />
      </div>
      <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
};