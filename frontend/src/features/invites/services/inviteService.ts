// src/features/invites/services/inviteService.ts
import { api } from "../../../api/api";
import type { 
  SendInvitePayload, 
  InviteResponse, 
  InviteQueryFilters,
  AcceptInvitePayload,
  AcceptInviteResponse,
  BulkSendInvitePayload,
  BulkInviteResponse
} from "../types/invite.types";

export const inviteService = {
  /**
   * POST /api/invites
   * Triggers the backend to create an invite record and send the email/SMS
   */
  send: async (payload: SendInvitePayload, filters: InviteQueryFilters = { email: true }) => {
    const response = await api.post<InviteResponse>(`/invites`, payload, {
      params: filters,
    });
    return response.data;
  },

  sendBulk: async (payload: BulkSendInvitePayload, filters: InviteQueryFilters = { email: true }) => {
    const response = await api.post<BulkInviteResponse>(`/invites/bulk`, payload, {
      params: filters,
    });
    return response.data;
  },
  /**
   * GET /api/invites/:token
   * Used on the registration page to show "Welcome to [Org Name]"
   */
  getDetails: async (token: string) => {
    const response = await api.get(`/invites/${token}`);
    return response.data;
  },

  /**
   * POST /api/invites/:token/accept
   * Handles both new user registration AND existing users accepting additional invites
   */
  accept: async (token: string, data: AcceptInvitePayload) => {
    const response = await api.post<AcceptInviteResponse>(`/invites/${token}/accept`, data);
    return response.data;
  }
};