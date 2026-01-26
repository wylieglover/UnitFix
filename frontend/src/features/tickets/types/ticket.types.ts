// src/features/tickets/types/ticket.types.ts

export type TicketStatus = "open" | "in_progress" | "completed" | "cancelled";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

/**
 * Represents the Ticket data returned by the API.
 * The 'assignee' object is the formatted user data for the UI.
 */
export interface Ticket {
  id: string;             // The opaqueId (UUID)
  code: string;           // The 4-character random code (e.g., "A2B4")
  description: string;
  unitNumber: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  archivedAt: string | null;
  assignedAt: string | null;
  
  // Included for breadcrumbs and identification in global lists
  property: {
    id: string;           // Property opaqueId
    name: string;
  };

  creator: {
    id: string;           // User opaqueId
    name: string;
    email: string;
  };

  // The expanded object returned by formatMaintenanceRequest
  assignee: {
    id: string;           // User opaqueId
    name: string;
    email: string;
  } | null;
}

/**
 * Payload for updating a ticket. 
 * Matches the backend Zod schema exactly.
 */
export interface UpdateTicketPayload {
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string | null; // Must be the User's opaqueId (UUID)
  unitNumber?: string | null;
  archived?: boolean;
}

export interface TicketListResponse {
  requests: Ticket[];
}

export interface TicketQueryFilters {
  status?: TicketStatus | "all";
  priority?: TicketPriority;
  relatedTo?: string;
  assignedTo?: string; // opaqueId of the staff member
  createdBy?: string;  // opaqueId of the creator
  archived?: "all" | "active" | "archived";
}