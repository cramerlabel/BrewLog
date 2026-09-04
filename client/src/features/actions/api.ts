import { api } from '@/lib/api-client';

export interface ActionItem {
  id: number;
  name: string;
  description: string | null;
  applicableTo: 'beer' | 'wine' | 'both';
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export const actionsApi = {
  list: () => api.get<{ actions: ActionItem[] }>('/actions').then((d) => d.actions),
};
