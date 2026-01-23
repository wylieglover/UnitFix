import { asyncHandler } from "../helpers/asyncHandler";
import { formatProperty, propertySelect } from "../helpers/propertyHelpers";
import { prisma } from "../lib/prisma";
import { twilioService } from "../services/twilio";

export const createProperty = asyncHandler(async (req, res, next) => {
  const { organization } = res.locals;
  const { name, street, city, state, zip, country } = res.locals.body;

  const property = await prisma.property.create({
    data: {
      organizationId: organization.id,
      name,
      street,
      city,
      state,
      zip,
      country,
    },
    select: propertySelect,
  });

  return res.status(201).json({
    property: formatProperty(property),
  });
});

export const listProperties = asyncHandler(async (req, res, next) => {
  const { organization } = res.locals;
  const { status } = res.locals.query;

  const properties = await prisma.property.findMany({
    where: {
      organizationId: organization.id,
      ...(status === "archived"
        ? { archivedAt: { not: null } }
        : status === "all"
          ? {}
          : { archivedAt: null }),
    },
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

export const provisionPropertyPhone = asyncHandler(async (req, res) => {
  const { property } = res.locals; // Already resolved by your middleware!
  const { areaCode } = res.locals.body;

  if (property.maintenancePhoneNumber) {
    return res.status(400).json({ error: "Property already has a phone number" });
  }

  // 1. Provision via Twilio Service
  const provisioned = await twilioService.provisionPropertyNumber(areaCode, property.opaqueId);

  // 2. Update DB with both the number and the Resource SID
  const updatedProperty = await prisma.property.update({
    where: { id: property.id },
    data: {
      maintenancePhoneNumber: provisioned.phoneNumber,
      twilioSid: provisioned.twilioSid,
    },
    select: propertySelect,
  });

  return res.status(200).json({
    message: "Phone number provisioned successfully",
    property: formatProperty(updatedProperty),
  });
});
