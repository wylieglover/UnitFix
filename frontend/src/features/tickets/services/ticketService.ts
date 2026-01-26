import { api } from "../../../api/api";
import type { 
  Ticket, 
  TicketListResponse, 
  TicketQueryFilters,
  TicketPriority,
  UpdateTicketPayload
} from "../types/ticket.types";

export const ticketService = {
  /**
   * Fetches tickets. If propertyId is provided, it fetches for that property.
   * If omitted, it fetches for the entire organization.
   */
  list: async (orgId: string, propertyId?: string, filters?: TicketQueryFilters) => {
    const url = propertyId 
      ? `/organizations/${orgId}/properties/${propertyId}/maintenance-requests`
      : `/organizations/${orgId}/properties/maintenance-requests`;
    
    const response = await api.get<TicketListResponse>(url, { params: filters });
    return response.data;
  },

  /**
   * Fetch a single ticket. Note: Backend requires propertyId for specific lookups
   * because of the composite key (propertyId + code/opaqueId).
   */
  get: async (orgId: string, propertyId: string, requestId: string) => {
    const response = await api.get<{ request: Ticket }>(
      `/organizations/${orgId}/properties/${propertyId}/maintenance-requests/${requestId}`
    );
    return response.data;
  },

  create: async (orgId: string, propertyId: string, data: {
    description: string;
    unitNumber?: string;
    priority: TicketPriority;
  }) => {
    const response = await api.post<{ request: Ticket }>(
      `/organizations/${orgId}/properties/${propertyId}/maintenance-requests`,
      data
    );
    return response.data;
  },

  update: async (
    orgId: string, 
    propertyId: string, 
    requestId: string, 
    data: UpdateTicketPayload // <--- Use the new interface here
  ) => {
    const response = await api.put<{ request: Ticket }>(
      `/organizations/${orgId}/properties/${propertyId}/maintenance-requests/${requestId}`,
      data
    );
    return response.data;
  }
};