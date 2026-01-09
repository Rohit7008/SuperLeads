import { api } from "./api";

/**
 * Lead (Client Profile) - Represents the Person/Entity
 */
export type Lead = {
  id: number;
  name: string;
  phone_number: string;
  service_deprecated?: string; // Kept for legacy if needed, but we use lead_services now
  description?: string;
  is_converted?: boolean;
  created_at?: string;
  created_by?: string;
  agent_ids?: string[];
};

/**
 * Lead Service - Represents a specific interaction/deal
 */
export type LeadService = {
  id: number;
  lead_id: number;
  service_name: string;
  coverage?: string;
  premium_investment?: number;
  status: string;
  discussion_date?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  // Join fields
  leads?: Lead;
};

/**
 * UI Projection - Flattened Row for the Data Grid
 */
export type LeadRow = {
  // Service ID (Primary Key for the row in the UI table)
  service_id: number;
  // Lead/Client Details
  lead_id: number;
  client_name: string;
  phone_number: string;
  // Service Details
  service_name: string;
  coverage: string;
  premium_investment: number;
  status: string;
  discussion_date: string;
  follow_up_date: string;
  date: string; // Creation timestamp
  created_by: string;
};

export type LeadUpdate = {
  id: number;
  lead_id: number;
  content: string;
  type: 'Note' | 'Status' | 'Activity';
  created_at: string;
  created_by?: string;
  profiles?: {
    name: string;
    email: string;
  };
  created_by_name?: string;
  service_id?: number;
};

export type CreateLeadPayload = {
  // Client Data
  name: string;
  phone_number: string;
  description?: string;
  agent_ids?: string[];

  // Service Data (Initial Service)
  service_name: string;
  coverage?: string;
  premium_investment?: number;
  status?: string;
  discussion_date?: string;
  follow_up_date?: string;
  is_converted?: boolean;
  created_by_name?: string;
};

/**
 * Fetch all lead services (Flattened for Data Grid)
 */
export const getLeads = async (params?: { all?: boolean }): Promise<LeadRow[]> => {
  const url = params?.all ? "/leads?all=true" : "/leads";
  const res = await api.get(url);
  return res.data;
};

/**
 * Create a new lead (Client + Initial Service)
 */
export const createLead = async (data: CreateLeadPayload) => {
  const res = await api.post("/leads", data);
  return res.data;
};

/**
 * Update a specific Lead Service
 */
export const updateLeadService = async (serviceId: number, data: Partial<LeadService>) => {
  // Note: We'll likely need to separate Client updates from Service updates in the API eventually
  // For now, this assumes we are editing the service properties.
  const res = await api.put(`/leads/services/${serviceId}`, data);
  return res.data;
};

/**
 * Delete a lead service
 */
export const deleteLeadService = async (serviceId: number) => {
  await api.delete(`/leads/services/${serviceId}`);
};

/**
 * Get Client with all their Services
 */
export const getClientDetails = async (clientId: string) => {
  const res = await api.get(`/leads/client/${clientId}`);
  return res.data;
};

/**
 * Get a specific Service Detail
 */
export const getServiceDetails = async (serviceId: string) => {
  const res = await api.get(`/leads/services/${serviceId}`);
  return res.data;
};

/**
 * Fetch updates for a lead (Client Level or Filtered by Service)
 */
export const getLeadUpdates = async (clientId: string, serviceId?: string): Promise<LeadUpdate[]> => {
  const url = serviceId ? `/leads/${clientId}/updates?serviceId=${serviceId}` : `/leads/${clientId}/updates`;
  const res = await api.get(url);
  return res.data;
};

/**
 * Add an update/note to a lead (Optionally linked to a specific service)
 */
export const addLeadUpdate = async (clientId: string, content: string, type: string = 'Note', created_by_name?: string, serviceId?: number) => {
  const res = await api.post(`/leads/${clientId}/updates`, { content, type, created_by_name, service_id: serviceId });
  return res.data;
};

/**
 * Add new services to an existing lead
 */
export const addLeadServices = async (leadId: number, services: string[]) => {
  const res = await api.post(`/leads/${leadId}/services`, { services });
  return res.data;
};