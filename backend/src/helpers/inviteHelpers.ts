import { Prisma, MaintenanceRole } from "../lib/prisma";

// Select for invite queries
export const inviteSelect = {
  id: true,
  email: true,
  phone: true,
  role: true,
  token: true,
  expiresAt: true,
  acceptedAt: true,
  organizationId: true,
  propertyId: true,
  maintenanceRole: true,
  unitNumber: true,
  createdAt: true,
} as const;

// Select for invite with relations
export const inviteWithRelationsSelect = {
  ...inviteSelect,
  organization: {
    select: {
      id: true,
      opaqueId: true,
      name: true,
      contactInfo: true,
    },
  },
  property: {
    select: {
      id: true,
      opaqueId: true,
      name: true,
      street: true,
      city: true,
      state: true,
      zip: true,
      country: true,
    },
  },
} as const;

type InviteWithRelations = Prisma.InviteGetPayload<{
  select: typeof inviteWithRelationsSelect;
}>;

// Validate invite is usable
export const validateInvite = (invite: InviteWithRelations | null) => {
  if (!invite) {
    return { valid: false, error: "Invalid or expired invite" };
  }

  if (invite.acceptedAt) {
    return { valid: false, error: "Invite already accepted" };
  }

  if (invite.expiresAt < new Date()) {
    return { valid: false, error: "Invite expired" };
  }

  return { valid: true };
};

// Format invite for API response
export const formatInvite = (invite: InviteWithRelations) => ({
  role: invite.role,
  email: invite.email ?? null,
  phone: invite.phone ?? null,
  unitNumber: invite.unitNumber ?? null,
  expiresAt: invite.expiresAt,
  organization: invite.organization
    ? {
        id: invite.organization.opaqueId,
        name: invite.organization.name,
      }
    : null,
  property: invite.property
    ? {
        id: invite.property.opaqueId,
        name: invite.property.name,
        street: invite.property.street,
        city: invite.property.city,
        state: invite.property.state,
        zip: invite.property.zip,
      }
    : null,
});

// Format minimal invite (for sendInvite response)
export const formatInviteMinimal = (invite: { 
  role: string; 
  expiresAt: Date; 
  email?: string | null; 
  phone?: string | null 
}) => ({
  role: invite.role,
  email: invite.email ?? null,
  phone: invite.phone ?? null,
  expiresAt: invite.expiresAt,
});

export const formatInviteBatchItem = (invite: Prisma.InviteGetPayload<{ select: typeof inviteSelect }>) => ({
  id: invite.id, // Internal ID
  email: invite.email,
  phone: invite.phone,
  role: invite.role,
  unitNumber: invite.unitNumber,
  expiresAt: invite.expiresAt,
});

export const createRoleRelationship = async (
  tx: Prisma.TransactionClient,
  userId: number,
  invite: {
    role: string;
    organizationId: number;
    propertyId: number | null;
    maintenanceRole: string | null;
    unitNumber: string | null;
  },
  unitNumberOverride?: string | null
) => {
  switch (invite.role) {
    case "org_admin": {
      // Check if already exists (shouldn't happen due to validation, but defensive)
      const existing = await tx.orgAdmin.findUnique({
        where: { userId },
      });

      if (existing) {
        throw new Error("User is already an org admin");
      }

      await tx.orgAdmin.create({
        data: {
          userId,
          organizationId: invite.organizationId,
        },
      });
      break;
    }

    case "staff": {
      if (!invite.propertyId || !invite.maintenanceRole) {
        throw new Error("Invalid staff invite configuration");
      }

      // Check if already assigned to this property (shouldn't happen, but defensive)
      const existing = await tx.propertyStaff.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId: invite.propertyId,
          },
        },
      });

      if (existing) {
        throw new Error("Staff member is already assigned to this property");
      }

      await tx.propertyStaff.create({
        data: {
          userId,
          propertyId: invite.propertyId,
          role: invite.maintenanceRole as MaintenanceRole,
        },
      });
      break;
    }

    case "tenant": {
      if (!invite.propertyId) {
        throw new Error("Tenant invite must include propertyId");
      }

      // Check if user is already a tenant (shouldn't happen due to validation, but defensive)
      const existing = await tx.tenant.findUnique({
        where: { userId },
      });

      if (existing) {
        throw new Error("User is already a tenant at another property");
      }

      const finalUnitNumber = unitNumberOverride ?? invite.unitNumber;

      await tx.tenant.create({
        data: {
          userId,
          propertyId: invite.propertyId,
          unitNumber: finalUnitNumber || null,
        },
      });
      break;
    }

    default:
      throw new Error(`Unsupported invite role: ${invite.role}`);
  }
};