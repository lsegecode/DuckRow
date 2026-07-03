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
  status?: string;
  urgency?: string;
  internal_priority?: string;
  source_area?: string;
  assigned_to?: number;
  search?: string;
  ordering?: string;
  page?: number;
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

  stats: async (): Promise<TicketStats> => {
    const { data } = await client.get<TicketStats>('/tickets/tickets/stats/');
    return data;
  },
};
