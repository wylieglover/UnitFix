export type MaintenanceRole = "manager" | "member";
export type StaffStatus = "active" | "archived" | "all";

export interface Staff {
  role: MaintenanceRole;
  createdAt: string;
  archivedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  property: {
    id: string;
    name: string;
  };
}

export interface StaffListResponse {
  staff: Staff[];
}

export interface StaffQueryFilters {
  status?: StaffStatus;
}

export interface UpdateStaffPayload {
  role?: MaintenanceRole;
  archived?: boolean;
}