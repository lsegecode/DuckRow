/**
 * Authentication API endpoints.
 */

import client from './client';
import type { TokenPair, LoginCredentials, RegisterPayload, CurrentUser } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<TokenPair> => {
    const { data } = await client.post<TokenPair>('/auth/token/', credentials);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<CurrentUser> => {
    const { data } = await client.post<CurrentUser>('/users/register/', payload);
    return data;
  },

  refreshToken: async (refresh: string): Promise<TokenPair> => {
    const { data } = await client.post<TokenPair>('/auth/token/refresh/', { refresh });
    return data;
  },

  getCurrentUser: async (): Promise<CurrentUser> => {
    const { data } = await client.get<CurrentUser>('/users/me/');
    return data;
  },
};
