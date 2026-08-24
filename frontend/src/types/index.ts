/**
 * Core type definitions for the Agile Ducks Service Desk.
 */

// ── User Types ──

export type Role = 'CLIENT' | 'RESOLVER' | 'SYSADMIN';

export interface UserMinimal {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Area {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user: UserMinimal;
  role: Role;
  areas: Area[];
  created_at: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile: UserProfile;
}

// ── Ticket Types ──

export type TicketType = 'BUG' | 'FEATURE';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TicketAttachment {
  id: string;
  file_name: string;
  file_size?: number | null;
  url: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  ticket_type: TicketType;
  description?: string;
  status: TicketStatus;
  urgency: Urgency;
  internal_priority?: Priority;
  source_area: Area;
  created_by: UserMinimal;
  assigned_to?: UserMinimal | null;
  attachments?: TicketAttachment[];
  started_at?: string | null;
  resolved_at?: string | null;
  resolution_documentation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketCreatePayload {
  title: string;
  ticket_type: TicketType;
  description: string;
  urgency: Urgency;
  source_area_id: string;
  uploaded_images?: string[];
}

export interface TicketUpdatePayload {
  title?: string;
  ticket_type?: TicketType;
  description?: string;
  status?: TicketStatus;
  urgency?: Urgency;
  internal_priority?: Priority;
  assigned_to_id?: number | null;
  estimated_resolution_time?: string | null;
  estimated_work_hours?: string | null;
  resolution_documentation?: string | null;
  resolved_at?: string | null;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

// ── Auth Types ──

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Role;
  area_ids?: string[];
}

// ── API Types ──

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
