import type { CreateActionInput, UpdateActionInput } from '@brewlog/shared';
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

  create: (input: CreateActionInput) => api.post<{ action: ActionItem }>('/actions', input).then((d) => d.action),

  update: (id: number, input: UpdateActionInput) =>
    api.patch<{ action: ActionItem }>(`/actions/${id}`, input).then((d) => d.action),
};
