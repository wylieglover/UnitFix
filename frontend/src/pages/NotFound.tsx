import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-indigo-50 p-6 rounded-full mb-6">
        <FileQuestion size={64} className="text-indigo-600" />
      </div>
      
      <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
      
      <p className="text-gray-500 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved. 
        Please check the URL or return back.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Go Back
        </Button>
        
        <Button 
          variant="primary" 
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <Home size={18} />
          Return Home
        </Button>
      </div>
    </div>
  );
};