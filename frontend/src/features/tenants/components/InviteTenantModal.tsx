import { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Table } from "../../../components/ui/Table";
import { SearchInput } from "../../../components/ui/SearchInput";
import { BulkInviteSummary } from "../../invites/components/BulkInviteSummary";
import { inviteService } from "../../invites/services/inviteService";
import { api } from "../../../api/api";
import { 
  UserPlus, 
  Users, 
  FileText, 
  Building2, 
  ArrowRight,
  Loader2,
  ClipboardList
} from "lucide-react";
import { type BulkInviteItem, type BulkInviteResponse } from "../../invites/types/invite.types";

interface Property {
  id: string;
  name: string;
}

interface InviteTenantModalProps {
  organizationId: string;
  propertyId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = "single" | "bulk";

export const InviteTenantModal = ({ 
  organizationId,
  propertyId: initialPropertyId, 
  isOpen, 
  onClose, 
  onSuccess 
}: InviteTenantModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("single");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchProperty, setSearchProperty] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId || "");

  const [formData, setFormData] = useState({ email: "", unitNumber: "" });
  const [rawText, setRawText] = useState("");
  const [batchResults, setBatchResults] = useState<BulkInviteResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialPropertyId && isOpen && organizationId) {
      const loadProperties = async () => {
        setFetchingData(true);
        try {
          const res = await api.get(`/organizations/${organizationId}/properties`);
          setProperties(res.data.properties || []);
        } catch (err) {
          console.error("Failed to load properties", err);
        } finally {
          setFetchingData(false);
        }
      };
      loadProperties();
    }
  }, [initialPropertyId, isOpen, organizationId]);

  const filteredProperties = useMemo(() => {
    const filtered = properties.filter(p => 
      p.name.toLowerCase().includes(searchProperty.toLowerCase())
    );

    // If search is empty, show top 5. If searching, show up to 15.
    return searchProperty === "" ? filtered.slice(0, 5) : filtered.slice(0, 15);
  }, [properties, searchProperty]);

  const propertyColumns = [
    {
      key: 'name',
      header: 'Property Name',
      render: (p: Property) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
            <Building2 size={14} />
          </div>
          <span className="font-medium text-gray-900">{p.name}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: '',
      className: 'w-10',
      render: () => <ArrowRight size={16} className="text-gray-300" />
    }
  ];

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return;
    
    setLoading(true);
    setErrors({});
    try {
      await inviteService.send({
        role: "tenant",
        email: formData.email,
        propertyId: selectedPropertyId,
        unitNumber: formData.unitNumber,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors({ email: err.response?.data?.error || "Failed to send invite" });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (invites: BulkInviteItem[]) => {
    if (invites.length === 0) {
      setErrors({ bulk: "No valid data found. Ensure format is: email, unitNumber" });
      return;
    }
    setLoading(true);
    try {
      const res = await inviteService.sendBulk({
        role: "tenant",
        propertyId: selectedPropertyId,
        invites,
      });
      setBatchResults(res);
    } catch (err: any) {
      setErrors({ bulk: "Batch upload failed. Check file format." });
    } finally {
      setLoading(false);
    }
  };

  // Helper to clean and validate objects
  const formatInviteData = (items: any[]) => {
    return items
      .map(item => {
        // If header:false, item is an array [email, unit]
        // If header:true (CSV), item is an object {email, unitNumber}
        const email = (Array.isArray(item) ? item[0] : (item.email || item.Email || item.email_address)) || "";
        const unit = (Array.isArray(item) ? item[1] : (item.unitNumber || item.unit || item.Unit)) || "";
        
        return {
          email: String(email).trim(),
          unitNumber: String(unit).trim()
        };
      })
      .filter(item => item.email.includes("@") && item.unitNumber !== "");
  };

  const handlePasteSubmit = () => {
    Papa.parse(rawText.trim(), {
      header: false, // Set to false so users don't need to paste "email, unitNumber"
      skipEmptyLines: true,
      complete: (results) => {
        const formatted = formatInviteData(results.data);
        handleBulkSubmit(formatted);
      },
    });
  };

  const selectedPropertyName = properties.find(p => p.id === selectedPropertyId)?.name;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={batchResults ? "Invite Summary" : "Invite Residents"} 
      size={!selectedPropertyId ? "lg" : "md"}
    >
      <div className="space-y-6 text-gray-900">
        {batchResults ? (
          <BulkInviteSummary results={batchResults} onClose={() => { onSuccess(); onClose(); }} />
        ) : (
          <>
            {/* Tab Selection */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
              {(['single', 'bulk'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  type="button"
                  onClick={() => { setActiveTab(tab); setErrors({}); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'single' ? <UserPlus size={16} /> : <Users size={16} />}
                  {tab === 'single' ? 'New' : 'Bulk Upload'}
                </button>
              ))}
            </div>

            {/* Property Selection */}
            {!initialPropertyId && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    {selectedPropertyId ? 'Selected Property' : 'Step 1: Select Property'}
                  </label>
                  {selectedPropertyId && (
                    <button 
                      onClick={() => { setSelectedPropertyId(""); setBatchResults(null); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Change
                    </button>
                  )}
                </div>

                {fetchingData ? (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl animate-pulse">
                    <Loader2 className="animate-spin text-indigo-500" size={18} />
                    <span className="text-sm text-gray-500 font-medium">Fetching properties...</span>
                  </div>
                ) : selectedPropertyId ? (
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Property</p>
                      <p className="font-bold text-indigo-900 leading-tight">{selectedPropertyName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SearchInput value={searchProperty} onChange={setSearchProperty} placeholder="Search buildings..." />
                    <div className="max-h-[280px] overflow-hidden">
                      <Table<Property>
                        data={filteredProperties}
                        columns={propertyColumns}
                        rowKey="id"
                        onRowClick={(p) => setSelectedPropertyId(p.id)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Invite Forms */}
            {(selectedPropertyId || initialPropertyId) && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {!initialPropertyId && <hr className="my-6 border-gray-100" />}
                
                {activeTab === 'single' ? (
                  <form onSubmit={handleSingleSubmit} className="space-y-5">
                    <Input
                      label="Email Address"
                      placeholder="resident@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={errors.email}
                      required
                    />
                    <Input
                      label="Unit Number"
                      placeholder="e.g. 4B"
                      value={formData.unitNumber}
                      onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                      error={errors.unitNumber}
                      required
                    />
                    <div className="flex flex-col gap-2 pt-4">
                      <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                        Send Invitation
                      </Button>
                      <Button type="button" variant="ghost" onClick={onClose} className="w-full text-gray-400">
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    {/* CSV Uploader */}
                    <div 
                      onClick={() => !loading && fileInputRef.current?.click()}
                      className="group border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer"
                    >
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            Papa.parse(file, {
                              header: true,
                              skipEmptyLines: true,
                              complete: (results) => handleBulkSubmit(formatInviteData(results.data)),
                            });
                          }
                        }} 
                      />
                      <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                        <FileText className="text-gray-400 group-hover:text-indigo-600" size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-700">Upload CSV File</p>
                      <p className="text-xs text-gray-400 mt-1">Headers: email, unitNumber</p>
                    </div>

                    {/* Visual Divider */}
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-gray-100"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">OR PASTE FROM SHEETS</span>
                      <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    {/* Manual Entry */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end px-1">
                        <label className="text-sm font-semibold text-gray-700">Manual Entry</label>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">email, unitNumber</span>
                      </div>
                      <div className="relative">
                        <ClipboardList className="absolute left-3 top-3 text-gray-300" size={18} />
                        <textarea
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          placeholder="resident@test.com, 101&#10;resident2@test.com, 102"
                          className="w-full h-28 pl-10 pr-4 py-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                      {errors.bulk && <p className="text-red-500 text-xs font-bold text-left">{errors.bulk}</p>}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        onClick={handlePasteSubmit} 
                        variant="primary" 
                        size="lg" 
                        loading={loading} 
                        disabled={!rawText.trim()}
                        className="w-full"
                      >
                        Process & Invite
                      </Button>
                      <Button type="button" variant="ghost" onClick={onClose} className="w-full text-gray-400">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};