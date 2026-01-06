import { api } from "./api";

/**
 * Lead Types Definition
 */
export type Lead = {
  id: number;
  name: string;
  phone_number: string;
  service: string;
  description?: string;
  date?: string;
  meeting_date?: string; // UI compatibility field
  follow_up_date?: string;
  status: string;
  created_by: string;
  agent_ids?: string[];
  is_converted?: boolean;
  created_at?: string;
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
};

export type CreateLeadPayload = {
  name: string;
  phone_number: string;
  service: string;
  description?: string;
  date?: string;
  follow_up_date?: string;
  status?: string;
  is_converted?: boolean;
  agent_ids?: string[];
};

/**
 * Fetch all leads
 * @returns Array of Lead objects
 * Performance: Optimized to return raw data for React Query caching.
 */
export const getLeads = async (): Promise<Lead[]> => {
  const res = await api.get("/leads");
  return res.data;
};

/**
 * Create a new lead
 * @param data Form data matching CreateLeadPayload
 */
export const createLead = async (data: any) => {
  const payload: CreateLeadPayload = {
    name: data.name,
    phone_number: data.phone_number,
    service: data.service,
    description: data.description,
    date: data.meeting_date || data.date,
    follow_up_date: data.follow_up_date,
    status: data.status || 'New',
    is_converted: data.is_converted || false,
    agent_ids: data.agent_ids || [],
  };

  const res = await api.post("/leads", payload);
  return res.data;
};

/**
 * Update an existing lead
 * @param id Lead primary key
 * @param data Partial lead data to update
 */
export const updateLead = async (id: number, data: any) => {
  const payload: Partial<CreateLeadPayload> = {};
  if (data.name) payload.name = data.name;
  if (data.phone_number) payload.phone_number = data.phone_number;
  if (data.service) payload.service = data.service;
  if (data.description !== undefined) payload.description = data.description;
  if (data.meeting_date || data.date) payload.date = data.meeting_date || data.date;
  if (data.follow_up_date !== undefined) payload.follow_up_date = data.follow_up_date;
  if (data.status) payload.status = data.status;
  if (data.is_converted !== undefined) payload.is_converted = data.is_converted;
  if (data.agent_ids !== undefined) payload.agent_ids = data.agent_ids;
  if (data.updated_by_name) (payload as any).updated_by_name = data.updated_by_name;


  const res = await api.put(`/leads/${id}`, payload);
  return res.data;
};

/**
 * Delete a lead
 * @param id Lead primary key
 */
export const deleteLead = async (id: number) => {
  await api.delete(`/leads/${id}`);
};

/**
 * Fetch a single lead by ID
 */
export const getLead = async (id: string): Promise<Lead> => {
  const res = await api.get(`/leads/${id}`);
  return res.data;
};

/**
 * Fetch updates for a lead
 */
export const getLeadUpdates = async (id: string): Promise<LeadUpdate[]> => {
  const res = await api.get(`/leads/${id}/updates`);
  return res.data;
};

/**
 * Add an update/note to a lead
 */
export const addLeadUpdate = async (id: string, content: string, type: string = 'Note', created_by_name?: string) => {
  const res = await api.post(`/leads/${id}/updates`, { content, type, created_by_name });
  return res.data;
};