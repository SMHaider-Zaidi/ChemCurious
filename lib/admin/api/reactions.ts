import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { Reaction, ReactionInput, Paginated, ContentStatus } from '../types';

export const reactionsApi = {
  getReactions: async (params?: {
    q?: string;
    category?: 'organic' | 'inorganic';
    status?: ContentStatus;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Reaction>> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getReactions(params);
    return adminFetch<Paginated<Reaction>>('/api/admin/reactions', { query: params });
  },

  getReaction: async (id: number): Promise<Reaction> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getReaction(id);
    return adminFetch<Reaction>(`/api/admin/reactions/${id}`);
  },

  createReaction: async (input: ReactionInput): Promise<Reaction> => {
    if (IS_ADMIN_MOCK) return demoAdapter.createReaction(input);
    return adminFetch<Reaction>('/api/admin/reactions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateReaction: async (id: number, input: ReactionInput): Promise<Reaction> => {
    if (IS_ADMIN_MOCK) return demoAdapter.updateReaction(id, input);
    return adminFetch<Reaction>(`/api/admin/reactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  setReactionStatus: async (id: number, status: ContentStatus): Promise<Reaction> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setReactionStatus(id, status);
    return adminFetch<Reaction>(`/api/admin/reactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteReaction: async (id: number): Promise<void> => {
    if (IS_ADMIN_MOCK) return demoAdapter.deleteReaction(id);
    return adminFetch<void>(`/api/admin/reactions/${id}`, { method: 'DELETE' });
  },
};
