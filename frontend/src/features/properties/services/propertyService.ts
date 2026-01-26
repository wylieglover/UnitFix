import { api } from "../../../api/api";
import type {
  Property,
  ListPropertiesResponse,
  CreatePropertyPayload,
  CreatePropertyResponse,
  UpdatePropertyPayload,
  PropertyQueryParams,
} from "../types/property.types";

export const propertyService = {
  list: async (organizationId: string, params?: PropertyQueryParams) => {
    const res = await api.get<ListPropertiesResponse>(
      `/organizations/${organizationId}/properties`,
      { params }
    );
    return res.data;
  },

  create: async (organizationId: string, payload: CreatePropertyPayload) => {
    const res = await api.post<CreatePropertyResponse>(
      `/organizations/${organizationId}/properties`,
      payload
    );
    return res.data;
  },

  get: async (organizationId: string, propertyId: string) => {
    const res = await api.get<{ property: Property }>(
      `/organizations/${organizationId}/properties/${propertyId}`
    );
    return res.data;
  },

  update: async (
    organizationId: string,
    propertyId: string,
    payload: UpdatePropertyPayload
  ) => {
    const res = await api.put<{ property: Property }>(
      `/organizations/${organizationId}/properties/${propertyId}`,
      payload
    );
    return res.data;
  },
};