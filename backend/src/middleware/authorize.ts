// middleware/authorize.ts
import { RequestHandler } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { prisma, type MaintenanceRole, type UserType } from "../lib/prisma";
import { TokenPayload } from "../helpers/token";

type AuthorizeOptions = {
  orgRoles?: UserType[];
  property?: {
    allowStaff?: boolean;
    allowTenants?: boolean;
    maintenanceRoles?: MaintenanceRole[];
  };
};

export const authorize = (options: AuthorizeOptions = {}): RequestHandler => {
  return asyncHandler(async (req, res, next) => {
    const { userId, userType, organizationId: tokenOrgId } = res.locals.user as TokenPayload;
    const organizationId = res.locals.organization?.id || tokenOrgId;
    const propertyId = res.locals.property?.id;

    // Org-level role check
    if (options.orgRoles && !options.orgRoles.includes(userType)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Org admin/owner verification
    if (userType === "org_owner" || userType === "org_admin") {
      if (!organizationId) {
        return res.status(400).json({ error: "Organization context required" });
      }

      const orgAdmin = await prisma.orgAdmin.findUnique({
        where: { userId },
        include: { organization: true },
      });

      if (!orgAdmin) {
        return res.status(403).json({ error: "Not an organization admin" });
      }

      if (orgAdmin.organizationId !== organizationId) {
        return res.status(403).json({ error: "Access denied to this organization" });
      }

      if (!orgAdmin.organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
    }

    // Property staff access
    if (userType === "staff") {
      if (!options.property?.allowStaff) {
        return res.status(403).json({ error: "Staff access not permitted for this resource" });
      }

      if (!propertyId) {
        return res.status(400).json({ error: "Property context required" });
      }

      const assignment = await prisma.propertyStaff.findUnique({
        where: { userId_propertyId: { userId, propertyId } },
      });

      if (!assignment) {
        return res.status(403).json({ error: "Access denied to this property" });
      }

      if (
        options.property.maintenanceRoles &&
        !options.property.maintenanceRoles.includes(assignment.role)
      ) {
        return res.status(403).json({ error: "Insufficient permissions for this action" });
      }
    }

    // Tenant access
    if (userType === "tenant") {
      if (!options.property?.allowTenants) {
        return res.status(403).json({ error: "Tenant access not permitted for this resource" });
      }

      if (!propertyId) {
        return res.status(400).json({ error: "Property context required" });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { userId_propertyId: { userId, propertyId } },
      });

      if (!tenant || tenant.archivedAt) {
        return res.status(403).json({ error: "Access denied to this property" });
      }
    }

    return next();
  });
};
