// src/pages/Properties.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FilterBar } from "../components/ui/FilterBar";
import { StatusBadge } from "../components/ui/StatusBadge"; // New import
import { CreatePropertyForm } from "../features/properties/components/CreatePropertyForm";
import { propertyService } from "../features/properties/services/propertyService";
import { useAuth } from "../hooks/useAuth";
import { Building2 } from "lucide-react";
import type { Property } from "../features/properties/types/property.types";

type PropertyStatus = 'active' | 'archived' | 'all';

export const Properties = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { isOrgLevel } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PropertyStatus>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProperties = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await propertyService.list(organizationId, { status });
      setProperties(data.properties);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [organizationId, status]);

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchProperties();
  };

  // Only show Availability filter to Org Admins/Owners
  const dropdownFilters = useMemo(() => {
    if (!isOrgLevel) return [];
    return [
      {
        label: "Availability",
        value: status,
        options: [
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ],
        onChange: (val: string) => setStatus(val as PropertyStatus)
      }
    ];
  }, [isOrgLevel, status]);

  const columns = [
    {
      key: 'name',
      header: 'Property Name',
      render: (property: Property) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{property.name}</span>
          <span className="text-xs text-gray-400 font-medium">
            Created {new Date(property.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (property: Property) => (
        <div className="text-sm text-gray-600">
          <div className="font-medium text-gray-700">{property.street}</div>
          <div className="text-xs text-gray-400">{property.city}, {property.state}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Texting Number',
      render: (property: Property) => (
        <span className="text-sm font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
          {property.maintenancePhoneNumber || (
            <span className="text-gray-300 italic text-xs">Unassigned</span>
          )}
        </span>
      ),
    },
    // Conditionally include Availability column for Org Admins/Owners
    ...(isOrgLevel ? [{
      key: 'status',
      header: 'Availability',
      render: (property: Property) => (
        <StatusBadge 
          type="availability" 
          value={property.archivedAt ? 'archived' : 'active'} 
        />
      ),
    }] : []),
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (property: Property) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/organizations/${organizationId}/properties/${property.id}`);
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  if (error && properties.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl inline-block border border-red-100">
          {error}
        </div>
        <div className="mt-4">
          <Button onClick={fetchProperties} variant="outline">Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Properties</h1>
          <p className="text-gray-500">Real estate assets under management</p>
        </div>
        {isOrgLevel && (
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="shadow-lg shadow-indigo-100">
            <span className="mr-2">+</span> New Property
          </Button>
        )}
      </div>

      {/* Unified Filter and Search Bar */}
      <FilterBar
        dropdowns={dropdownFilters}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, street, or city..."
        resultsCount={filteredProperties.length}
        variant="indigo"
      />

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table
          data={filteredProperties}
          columns={columns}
          loading={loading}
          rowKey="id"
          onRowClick={(property) => navigate(`/organizations/${organizationId}/properties/${property.id}`)}
          emptyState={{
            icon: <Building2 className="h-12 w-12 text-gray-200" />,
            title: searchTerm ? 'No matches found' : (status === 'archived' ? 'No archives found' : 'Start your portfolio'),
            description: searchTerm 
              ? `No properties found matching "${searchTerm}"`
              : (status === 'archived' 
                ? "You haven't archived any properties yet." 
                : "You haven't added any properties to UnitFix yet."),
            action: isOrgLevel && status === 'active' && !searchTerm ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Add First Property
              </Button>
            ) : undefined
          }}
        />
      </div>

      {/* Create Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Register Property"
      >
        <div className="p-1">
          <p className="text-sm text-gray-500 mb-6">
            Adding a property allows you to assign staff and invite tenants to submit maintenance requests.
          </p>
          <CreatePropertyForm
            organizationId={organizationId!}
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </div>
      </Modal>
    </div>
  );
};