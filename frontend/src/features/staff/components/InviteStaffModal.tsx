import { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import { Modal } from "../../../components/ui/Modal"; 
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Table } from "../../../components/ui/Table";
import { SearchInput } from "../../../components/ui/SearchInput"; 
import { BulkInviteSummary } from "../../invites/components/BulkInviteSummary";
import { inviteService } from "../../invites/services/inviteService";
import { staffService } from "../services/staffService";
import { api } from "../../../api/api";
import { 
  UserPlus, 
  Users, 
  Loader2, 
  Check, 
  FileText, 
  ClipboardList,
  Building2,
  ArrowRight
} from "lucide-react";
import type { 
  SendInvitePayload, 
  MaintenanceRole, 
  BulkInviteResponse 
} from "../../invites/types/invite.types";
import type { Staff } from "../types/staff.types";

interface Property {
  id: string;
  name: string;
}

interface InviteStaffModalProps {
  organizationId: string;
  propertyId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = 'new' | 'existing' | 'bulk';

export const InviteStaffModal = ({ 
  organizationId,
  propertyId: initialPropertyId, 
  onClose, 
  onSuccess 
}: InviteStaffModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [formData, setFormData] = useState({
    email: "",
    maintenanceRole: "member" as MaintenanceRole,
    propertyId: initialPropertyId || "",
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  
  const [searchProperty, setSearchProperty] = useState("");
  const [searchExisting, setSearchExisting] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [batchResults, setBatchResults] = useState<BulkInviteResponse | null>(null);
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return;
      setFetchingData(true);
      try {
        const [propsRes, staffRes] = await Promise.all([
          api.get(`/organizations/${organizationId}/properties`),
          staffService.list(organizationId, undefined, { status: 'active' })
        ]);
        setProperties(propsRes.data.properties || []);
        setAllStaff(staffRes.staff || []);
      } catch (err) {
        console.error("Failed to load modal data", err);
      } finally {
        setFetchingData(false);
      }
    };
    loadData();
  }, [organizationId]);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => 
      p.name.toLowerCase().includes(searchProperty.toLowerCase())
    );
  }, [properties, searchProperty]);

  const filteredExisting = useMemo(() => {
    if (!formData.propertyId) return [];
    return allStaff.filter(s => {
      const isAlreadyAtProperty = s.property.id === formData.propertyId;
      const matchesSearch = s.user.email.toLowerCase().includes(searchExisting.toLowerCase()) || 
                            s.user.name?.toLowerCase().includes(searchExisting.toLowerCase());
      return !isAlreadyAtProperty && matchesSearch;
    });
  }, [allStaff, formData.propertyId, searchExisting]);

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

  // Logic to handle both Objects (from Header CSV) and Arrays (from No-Header Raw Paste)
  const formatBulkData = (data: any[]) => {
    return data.map(item => {
      const email = (Array.isArray(item) ? item[0] : (item.email || item.Email)) || "";
      const rawRole = (Array.isArray(item) ? item[1] : (item.role || item.Role)) || "member";
      
      return {
        email: String(email).trim(),
        role: (rawRole.toLowerCase() === "manager" ? "manager" : "member") as MaintenanceRole
      };
    }).filter(inv => inv.email.includes("@"));
  };

  const handleBulkSubmit = async (formattedInvites: { email: string; role: MaintenanceRole }[]) => {
    if (!formData.propertyId) {
      setErrors({ propertyId: "Please select a property first" });
      return;
    }
    if (formattedInvites.length === 0) {
      setErrors({ bulk: "No valid email addresses found." });
      return;
    }

    setLoading(true);
    try {
      const res = await inviteService.sendBulk({
        role: "staff",
        propertyId: formData.propertyId,
        invites: formattedInvites.map(inv => ({
          email: inv.email,
          maintenanceRole: inv.role
        })),
      });
      setBatchResults(res);
    } catch (err) {
      setErrors({ bulk: "Failed to process bulk invites" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId) return;

    setLoading(true);
    try {
      if (activeTab === 'new') {
        const payload: SendInvitePayload = {
          role: "staff",
          email: formData.email,
          propertyId: formData.propertyId,
          maintenanceRole: formData.maintenanceRole,
        };
        await inviteService.send(payload, { email: true });
      } else {
        const selectedStaff = allStaff.find(s => s.user.email === formData.email);
        if (!selectedStaff) return;
        await staffService.assignToProperty(organizationId, {
          userId: selectedStaff.user.id,
          propertyId: formData.propertyId,
          role: formData.maintenanceRole,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors({ email: err.response?.data?.error || "Action failed" });
    } finally {
      setLoading(false);
    }
  };

  const selectedPropertyName = properties.find(p => p.id === formData.propertyId)?.name;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={batchResults ? "Invite Summary" : "Invite Staff"}
      size={!formData.propertyId ? "lg" : "md"}
    >
      <div className="space-y-6 text-gray-900">
        {batchResults ? (
          <BulkInviteSummary results={batchResults} onClose={() => { onSuccess(); onClose(); }} />
        ) : (
          <>
            <div className="flex p-1 bg-gray-100 rounded-xl">
              {(['new', 'existing', 'bulk'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  type="button" 
                  onClick={() => { setActiveTab(tab); setFormData(p => ({...p, email: ""})); setErrors({}); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'new' && <UserPlus size={16} />}
                  {tab === 'existing' && <Users size={16} />}
                  {tab === 'bulk' && <ClipboardList size={16} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {!initialPropertyId && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    {formData.propertyId ? 'Selected Property' : 'Step 1: Select Property'}
                  </label>
                  {formData.propertyId && (
                    <button 
                      onClick={() => setFormData(p => ({...p, propertyId: "", email: ""}))}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Change Property
                    </button>
                  )}
                </div>

                {formData.propertyId ? (
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Target Destination</p>
                      <p className="font-bold text-indigo-900 leading-tight">{selectedPropertyName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SearchInput 
                      value={searchProperty}
                      onChange={setSearchProperty}
                      placeholder="Search for a property to assign staff..."
                    />
                    <div className="max-h-[280px] overflow-hidden">
                      <Table<Property>
                        data={filteredProperties}
                        columns={propertyColumns}
                        rowKey="id"
                        loading={fetchingData}
                        onRowClick={(p) => setFormData(prev => ({...prev, propertyId: p.id}))}
                        emptyState={{
                          title: "No properties found",
                          description: "Try adjusting your search.",
                        }}
                      />
                    </div>
                  </div>
                )}
                {errors.propertyId && <p className="text-red-500 text-xs font-bold">{errors.propertyId}</p>}
              </div>
            )}

            {(formData.propertyId || initialPropertyId) && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <hr className="my-6 border-gray-100" />
                
                {activeTab === 'bulk' ? (
                  <div className="space-y-5">
                    {/* File Upload */}
                    <div 
                      onClick={() => !loading && fileInputRef.current?.click()}
                      className="group border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer"
                    >
                      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            Papa.parse(file, { 
                              header: true, 
                              skipEmptyLines: true, 
                              complete: (res) => handleBulkSubmit(formatBulkData(res.data)) 
                            });
                          }
                        }} 
                      />
                      <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                        <FileText className="text-gray-400 group-hover:text-indigo-600" size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-700">Upload CSV File</p>
                      <p className="text-xs text-gray-400 mt-1">Required columns: email, role</p>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-gray-100"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">OR PASTE FROM SHEETS</span>
                      <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    {/* Manual Entry */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end px-1">
                        <label className="text-sm font-semibold text-gray-700">Manual Entry</label>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">email, role</span>
                      </div>
                      <div className="relative">
                        <ClipboardList className="absolute left-3 top-3 text-gray-300" size={18} />
                        <textarea
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          placeholder="manager@company.com, manager&#10;tech1@company.com, member"
                          className="w-full h-28 pl-10 pr-4 py-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                      {errors.bulk && <p className="text-red-500 text-xs font-bold text-left">{errors.bulk}</p>}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        className="w-full" variant="primary" size="lg" 
                        disabled={!rawText.trim()} 
                        loading={loading}
                        onClick={() => {
                          Papa.parse(rawText.trim(), { 
                            header: false, 
                            skipEmptyLines: true, 
                            complete: (res) => handleBulkSubmit(formatBulkData(res.data)) 
                          });
                        }}
                      >
                        Process Bulk Invites
                      </Button>
                      <Button type="button" variant="ghost" onClick={onClose} className="w-full text-gray-400">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {activeTab === 'new' ? (
                      <Input
                        label="Invite via Email"
                        placeholder="colleague@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        error={errors.email}
                        required
                      />
                    ) : (
                      <div className="space-y-3 text-left">
                        <label className="block text-sm font-semibold text-gray-700">Directory Search</label>
                        <SearchInput value={searchExisting} onChange={setSearchExisting} />
                        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y bg-gray-50/30">
                          {fetchingData ? (
                             <div className="p-8 flex flex-col items-center gap-2 text-gray-400">
                               <Loader2 className="animate-spin" size={20} />
                               <span className="text-xs font-medium">Loading Directory...</span>
                             </div>
                          ) : filteredExisting.length > 0 ? (
                            filteredExisting.map((s) => (
                              <button key={s.user.id} type="button" onClick={() => setFormData({ ...formData, email: s.user.email })}
                                className={`w-full p-3 flex items-center justify-between transition-colors ${formData.email === s.user.email ? 'bg-indigo-50' : 'hover:bg-white'}`}>
                                <div className="text-left">
                                  <p className="text-sm font-bold text-gray-900">{s.user.name || 'Pending'}</p>
                                  <p className="text-xs text-gray-500">{s.user.email}</p>
                                </div>
                                {formData.email === s.user.email && <Check size={16} className="text-indigo-600" />}
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-400 text-xs italic">
                               No staff found to assign
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <RoleSelector 
                      value={formData.maintenanceRole} 
                      onChange={(val) => setFormData({...formData, maintenanceRole: val})} 
                    />

                    <div className="flex flex-col gap-2 pt-2">
                      <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!formData.email} className="w-full">
                        {activeTab === 'new' ? 'Send Invitation' : 'Assign to Property'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full text-gray-400">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

const RoleSelector = ({ value, onChange }: { value: MaintenanceRole; onChange: (val: MaintenanceRole) => void }) => (
  <div className="text-left">
    <label className="block text-sm font-semibold text-gray-700 mb-2">Access Level</label>
    <div className="grid grid-cols-2 gap-3">
      {(['member', 'manager'] as const).map((role) => (
        <button key={role} type="button" onClick={() => onChange(role)}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
            value === role ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
          }`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </button>
      ))}
    </div>
  </div>
);