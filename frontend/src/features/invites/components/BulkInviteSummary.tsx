import { Check, AlertCircle, Mail, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { BulkInviteResponse } from "../../invites/types/invite.types";

export const BulkInviteSummary = ({ 
  results, 
  onClose 
}: { 
  results: BulkInviteResponse; 
  onClose: () => void;
}) => {
  const hasErrors = results.failed > 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl text-center">
          <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Check size={18} className="text-white" />
          </div>
          <p className="text-2xl font-black text-green-700">{results.successful}</p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-green-600">Invites Sent</p>
        </div>

        <div className={`p-4 rounded-2xl text-center border ${
          hasErrors ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100 opacity-50'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm ${
            hasErrors ? 'bg-red-500' : 'bg-gray-300'
          }`}>
            <XCircle size={18} className="text-white" />
          </div>
          <p className={`text-2xl font-black ${hasErrors ? 'text-red-700' : 'text-gray-500'}`}>
            {results.failed}
          </p>
          <p className={`text-[10px] uppercase tracking-widest font-bold ${
            hasErrors ? 'text-red-600' : 'text-gray-400'
          }`}>Failed</p>
        </div>
      </div>

      {/* Error Details Section */}
      {hasErrors && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm font-bold">Issues to Resolve</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto border border-red-50 rounded-xl bg-red-50/30 divide-y divide-red-100">
            {results.errors.map((err, i) => (
              <div key={i} className="p-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={14} className="text-red-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700 truncate">{err.email}</span>
                </div>
                <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded uppercase flex-shrink-0">
                  {err.error.includes("duplicate") ? "Already Invited" : "Error"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center italic">
            Hint: You can fix these emails in your CSV and re-upload just the failures.
          </p>
        </div>
      )}

      {/* Success Message for perfect batches */}
      {!hasErrors && (
        <div className="py-8 text-center space-y-2">
          <div className="text-4xl">🎉</div>
          <h3 className="font-bold text-gray-900">Perfect Batch!</h3>
          <p className="text-sm text-gray-500">All staff members were invited successfully.</p>
        </div>
      )}

      <Button variant="primary" size="lg" className="w-full shadow-lg" onClick={onClose}>
        Continue
      </Button>
    </div>
  );
};