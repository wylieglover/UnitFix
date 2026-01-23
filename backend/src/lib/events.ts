import { EventEmitter } from "events";

export const UserEvents = {
  INVITE_CREATED: "user.invite_created",
} as const;

export const MaintenanceEvents = {
  CREATED: "maintenance.created",
  ASSIGNED: "maintenance.assigned",
  STATUS_CHANGED: "maintenance.status_changed",
} as const;

// Types for payloads to ensure consistency across publishers and subscribers
export interface UserInviteCreatedPayload {
  inviteId: number;
  sendEmail: boolean;
  sendPhone: boolean;
}

export interface MaintenanceCreatedPayload {
  requestId: number;
  propertyId: number;
}

export interface MaintenanceAssignedPayload {
  requestId: number;
  assigneeId: number;
}

export interface MaintenanceStatusChangedPayload {
  requestId: number;
  oldStatus: string;
  newStatus: string;
}

const eventBus = new EventEmitter();

export const Events = {
  publish(event: string, payload: any) {
    console.log(`[EventBus] Publishing ${event}`);
    eventBus.emit(event, payload);
  },

  subscribe(event: string, handler: (payload: any) => void) {
    eventBus.on(event, handler);
  },
};
