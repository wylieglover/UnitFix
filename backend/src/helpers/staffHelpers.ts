import { Prisma } from "../lib/prisma";

export const staffSelect = {
  role: true,
  createdAt: true,
  archivedAt: true,
  user: {
    select: {
      opaqueId: true,
      name: true,
      email: true,
    },
  },
  property: {
    select: {
      opaqueId: true,
      name: true,
    }
  }
} as const;

type StaffWithSelect = Prisma.PropertyStaffGetPayload<{
  select: typeof staffSelect;
}>;

export const formatStaff = (staff: StaffWithSelect) => ({
  role: staff.role,
  createdAt: staff.createdAt,
  archivedAt: staff.archivedAt,
  user: {
    id: staff.user.opaqueId,
    name: staff.user.name,
    email: staff.user.email,
  },
  property: {
    id: staff.property.opaqueId,
    name: staff.property.name,
  },
});

export type FormattedStaff = ReturnType<typeof formatStaff>;
