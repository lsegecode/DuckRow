/**
 * Users API endpoints.
 */

import client from './client';
import type { Area, UserProfile, PaginatedResponse } from '../types';

export const usersApi = {
  getAreas: async (): Promise<Area[]> => {
    const { data } = await client.get<PaginatedResponse<Area>>('/users/areas/');
    return data.results;
  },

  getProfiles: async (): Promise<PaginatedResponse<UserProfile>> => {
    const { data } = await client.get<PaginatedResponse<UserProfile>>('/users/profiles/');
    return data;
  },

  getResolvers: async (): Promise<UserProfile[]> => {
    const { data } = await client.get<UserProfile[]>('/users/resolvers/');
    return data;
  },
};
