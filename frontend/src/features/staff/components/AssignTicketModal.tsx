import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Table } from "../../../components/ui/Table";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ticketService } from "../../tickets/services/ticketService";
import { Search, PlusCircle, Loader2 } from "lucide-react";
import type { Ticket } from "../../tickets/types/ticket.types";

interface AssignTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  organizationId: string;
  propertyId: string;
  onSuccess: () => void;
}

export const AssignTicketModal = ({ 
  isOpen, 
  onClose, 
  staffId, 
  organizationId, 
  propertyId, 
  onSuccess 
}: AssignTicketModalProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableTickets = async () => {
      setLoading(true);
      try {
        const data = await ticketService.list(organizationId, propertyId);
        
        // Filter out closed tickets and tickets already assigned to this person
        const available = data.requests.filter((t: Ticket) => 
          t.status !== 'completed' && 
          t.status !== 'cancelled' &&
          t.assignee?.id !== staffId
        );
        setTickets(available);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) fetchAvailableTickets();
  }, [isOpen, organizationId, propertyId, staffId]);

  const handleAssign = async (ticketId: string, ticketCode: string) => {
    setAssigningId(ticketId);
    try {
      await ticketService.update(organizationId, propertyId, ticketCode, {
        assignedTo: staffId
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Assignment failed", err);
    } finally {
      setAssigningId(null);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      key: "code", 
      header: "ID", 
      render: (t: Ticket) => <span className="font-mono font-bold text-indigo-600">#{t.code}</span> 
    },
    { 
      key: "issue", 
      header: "Issue", 
      render: (t: Ticket) => (
        <div className="max-w-[320px] truncate font-medium text-gray-900">
          {t.description}
        </div>
      )
    },
    { 
      key: "priority", 
      header: "Priority", 
      render: (t: Ticket) => <StatusBadge type="priority" value={t.priority} /> 
    },
    { 
      key: "action", 
      header: "", 
      render: (t: Ticket) => (
        <div className="flex justify-end">
          <button 
            disabled={assigningId === t.id}
            onClick={() => handleAssign(t.id, t.code)}
            className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
          >
            {assigningId === t.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <PlusCircle size={16} />
                <span>Assign</span>
              </>
            )}
          </button>
        </div>
      )
    },
  ];

  return (
    <Modal 
      title="Assign Staff to Ticket" 
      isOpen={isOpen} 
      onClose={onClose} 
      size="3xl"
    >
      <div className="space-y-6">
        {/* Minimalist Search - No gray box/border bar */}
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            className="w-full bg-transparent pl-8 py-2 text-sm border-b border-gray-100 focus:border-indigo-500 transition-colors outline-none text-gray-900 placeholder:text-gray-400"
            placeholder="Search tickets by ID or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table Area - No heavy outer borders */}
        <div className="max-h-[450px] overflow-y-auto">
          <Table 
            data={filteredTickets}
            columns={columns}
            loading={loading}
            rowKey={(t) => t.id}
            emptyState={{
              title: "No tickets found",
              description: "No available tickets match your search.",
              icon: <Search className="text-gray-200" size={32} />
            }}
          />
        </div>

        {/* Simple Footer */}
        <div className="flex justify-end pt-2">
           <Button variant="ghost" onClick={onClose} className="text-gray-400 font-medium">
             Cancel
           </Button>
        </div>
      </div>
    </Modal>
  );
};