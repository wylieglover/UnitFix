import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketService } from "../features/tickets/services/ticketService";
import { Table } from "../components/ui/Table";
import { FilterBar } from "../components/ui/FilterBar";
import { StatusBadge } from "../components/ui/StatusBadge"; // Import your component
import { useAuth } from "../hooks/useAuth";
import { 
  ClipboardList, 
  ChevronRight
} from "lucide-react";
import type { Ticket, TicketStatus, TicketPriority } from "../features/tickets/types/ticket.types";

type StatusFilter = 'all' | TicketStatus;
type ArchiveFilter = 'all' | 'active' | 'archived';
type PriorityFilter = 'all' | TicketPriority;

export const Tickets = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { propertyId, isTenant, loading: authLoading } = useAuth(); 
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  useEffect(() => {
    const loadTickets = async () => {
      if (!organizationId || authLoading) return;
      if (isTenant && !propertyId) return;

      try {
        setLoading(true);
        const data = await ticketService.list(
          organizationId, 
          isTenant ? propertyId : undefined,
          {
            status: statusFilter,
            priority: priorityFilter === 'all' ? undefined : priorityFilter,
            archived: archiveFilter
          }
        );
        setTickets(data.requests);
      } catch (err) {
        console.error("Error loading tickets", err);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [organizationId, propertyId, isTenant, authLoading, statusFilter, archiveFilter, priorityFilter]);

  const filteredTickets = tickets.filter(t => {
    const search = searchTerm.toLowerCase();
    return (
      t.description.toLowerCase().includes(search) ||
      t.code.toLowerCase().includes(search) ||
      t.property.name.toLowerCase().includes(search) ||
      t.unitNumber?.toLowerCase().includes(search)
    );
  });

  const dropdownFilters = [
    {
      label: "Status",
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      onChange: (val: string) => setStatusFilter(val as StatusFilter)
    },
    {
      label: "Archive",
      value: archiveFilter,
      options: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
      onChange: (val: string) => setArchiveFilter(val as ArchiveFilter)
    },
    {
      label: "Priority",
      value: priorityFilter,
      options: [
        { value: 'all', label: 'All Priorities' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
      onChange: (val: string) => setPriorityFilter(val as PriorityFilter)
    }
  ];

  const columns = [
    {
      key: "id",
      header: "Ticket",
      render: (t: Ticket) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-indigo-600 text-sm">#{t.code}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {new Date(t.createdAt).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: "info",
      header: "Description & Location",
      render: (t: Ticket) => (
        <div className={`max-w-md ${t.archivedAt ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-900 truncate">{t.description}</div>
            {t.archivedAt && (
              <StatusBadge type="availability" value="archived" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span className="font-medium text-gray-700">{t.property.name}</span>
            <span>•</span>
            <span>Unit {t.unitNumber || "Common Area"}</span>
          </div>
        </div>
      )
    },
    {
      key: "priority",
      header: "Priority",
      render: (t: Ticket) => (
        <StatusBadge type="priority" value={t.priority} />
      )
    },
    {
      key: "status",
      header: "Status",
      render: (t: Ticket) => (
        <StatusBadge type="ticket" value={t.status} />
      )
    },
    {
      key: "actions",
      header: "",
      render: () => <ChevronRight size={16} className="text-gray-300" />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Maintenance Board</h1>
          <p className="text-gray-500">
            {loading ? "Loading tickets..." : `Tracking ${tickets.length} tickets.`}
          </p>
        </div>
      </div>

      <FilterBar
        dropdowns={dropdownFilters}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search code, issue, or property..."
        resultsCount={filteredTickets.length}
        variant="indigo"
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
          data={filteredTickets}
          columns={columns}
          loading={loading || authLoading}
          rowKey="id"
          onRowClick={(t) => {
            navigate(`/organizations/${organizationId}/properties/${t.property.id}/tickets/${t.code}`);
          }}
          emptyState={{
            title: searchTerm || statusFilter !== 'all' ? "No tickets match filters" : "No maintenance tickets",
            description: "Maintenance requests from tenants and staff will appear here.",
            icon: <ClipboardList className="h-12 w-12 text-gray-200" />
          }}
        />
      </div>
    </div>
  );
};