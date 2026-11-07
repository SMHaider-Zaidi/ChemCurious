import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { Molecule, MoleculeInput, PubChemResult, Paginated, ContentStatus } from '../types';

export const moleculesApi = {
  getMolecules: async (params?: {
    q?: string;
    category?: string;
    status?: ContentStatus;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Molecule>> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getMolecules(params);
    return adminFetch<Paginated<Molecule>>('/api/admin/molecules', { query: params });
  },

  getMolecule: async (id: number): Promise<Molecule> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getMolecule(id);
    return adminFetch<Molecule>(`/api/admin/molecules/${id}`);
  },

  createMolecule: async (input: MoleculeInput): Promise<Molecule> => {
    if (IS_ADMIN_MOCK) return demoAdapter.createMolecule(input);
    return adminFetch<Molecule>('/api/admin/molecules', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateMolecule: async (id: number, input: MoleculeInput): Promise<Molecule> => {
    if (IS_ADMIN_MOCK) return demoAdapter.updateMolecule(id, input);
    return adminFetch<Molecule>(`/api/admin/molecules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  setMoleculeStatus: async (id: number, status: ContentStatus): Promise<Molecule> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setMoleculeStatus(id, status);
    return adminFetch<Molecule>(`/api/admin/molecules/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteMolecule: async (id: number): Promise<void> => {
    if (IS_ADMIN_MOCK) return demoAdapter.deleteMolecule(id);
    return adminFetch<void>(`/api/admin/molecules/${id}`, { method: 'DELETE' });
  },

  fetchPubChem: async (query: string): Promise<PubChemResult> => {
    if (IS_ADMIN_MOCK) return demoAdapter.fetchPubChem(query);
    return adminFetch<PubChemResult>('/api/admin/molecules/fetch-pubchem', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};
