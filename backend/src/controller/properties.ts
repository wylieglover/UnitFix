import { asyncHandler } from "../helpers/asyncHandler";
import { TokenPayload } from "../helpers/token";
import { formatProperty, propertySelect } from "../helpers/propertyHelpers";
import { prisma } from "../lib/prisma";
import { twilioService } from "../services/twilio";

export const createProperty = asyncHandler(async (req, res, next) => {
  const { organization } = res.locals;
  const { name, street, city, state, zip, country } = res.locals.body;

  // Check if organization has a provisioned phone number
  const orgWithPhone = await prisma.organization.findUnique({
    where: { id: organization.id },
    select: { twilioPhoneNumber: true },
  });

  const property = await prisma.property.create({
    data: {
      organizationId: organization.id,
      name,
      street,
      city,
      state,
      zip,
      country,
      // Automatically inherit organization's phone number if it exists
      ...(orgWithPhone?.twilioPhoneNumber && {
        maintenancePhoneNumber: orgWithPhone.twilioPhoneNumber,
      }),
    },
    select: propertySelect,
  });

  return res.status(201).json({
    property: formatProperty(property),
  });
});

export const listProperties = asyncHandler(async (req, res, next) => {
  const { organization, user } = res.locals;
  const { status } = res.locals.query;
  const { userId, userType } = user as TokenPayload;

  const whereClause: any = {
    organizationId: organization.id,
    ...(status === "archived"
      ? { archivedAt: { not: null } }
      : status === "all"
        ? {}
        : { archivedAt: null }),
  };

  // If staff, only show properties they're assigned to
  if (userType === "staff") {
    whereClause.staff = {
      some: { userId }
    };
  }

  const properties = await prisma.property.findMany({
    where: whereClause,
    select: propertySelect,
  });

  return res.status(200).json({
    properties: properties.map(formatProperty),
  });
});

export const getProperty = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;

  const propertyData = await prisma.property.findUnique({
    where: { id: property.id },
    select: propertySelect,
  });

  if (!propertyData) {
    return res.status(404).json({ error: "Property not found" });
  }

  return res.status(200).json({
    property: formatProperty(propertyData),
  });
});

export const updateProperty = asyncHandler(async (req, res, next) => {
  const { property } = res.locals;
  const { archived, ...updateData } = res.locals.body;

  const updatedProperty = await prisma.property.update({
    where: { id: property.id },
    data: {
      ...updateData,
      ...(archived !== undefined && {
        archivedAt: archived ? new Date() : null,
      }),
    },
    select: propertySelect,
  });

  return res.status(200).json({
    property: formatProperty(updatedProperty),
  });
});