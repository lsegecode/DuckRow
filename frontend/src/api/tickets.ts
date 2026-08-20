/**
 * Tickets API endpoints.
 */

import client from './client';
import type {
  Ticket,
  TicketCreatePayload,
  TicketUpdatePayload,
  TicketStats,
  PaginatedResponse,
} from '../types';

export interface TicketFilters {
  ticket_type?: string;
  status?: string;
  urgency?: string;
  internal_priority?: string;
  source_area?: string;
  assigned_to?: number;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
}

export const ticketsApi = {
  list: async (filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> => {
    const { data } = await client.get<PaginatedResponse<Ticket>>('/tickets/tickets/', {
      params: filters,
    });
    return data;
  },

  get: async (id: string): Promise<Ticket> => {
    const { data } = await client.get<Ticket>(`/tickets/tickets/${id}/`);
    return data;
  },

  create: async (payload: TicketCreatePayload): Promise<Ticket> => {
    const { data } = await client.post<Ticket>('/tickets/tickets/', payload);
    return data;
  },

  update: async (id: string, payload: TicketUpdatePayload): Promise<Ticket> => {
    const { data } = await client.patch<Ticket>(`/tickets/tickets/${id}/`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/tickets/tickets/${id}/`);
  },

  claim: async (id: string): Promise<Ticket> => {
    const { data } = await client.post<Ticket>(`/tickets/tickets/${id}/claim/`);
    return data;
  },

  stats: async (): Promise<TicketStats> => {
    const { data } = await client.get<TicketStats>('/tickets/tickets/stats/');
    return data;
  },
};
