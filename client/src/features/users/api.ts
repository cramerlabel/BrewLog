import type { AdminResetPasswordInput, CreateUserInput, UpdateUserInput } from '@brewlog/shared';
import { api } from '@/lib/api-client';
import type { AdminUser } from './types';

export const usersApi = {
  list: () => api.get<{ users: AdminUser[] }>('/users').then((d) => d.users),

  create: (input: CreateUserInput) => api.post<{ user: AdminUser }>('/users', input).then((d) => d.user),

  update: (id: number, input: UpdateUserInput) =>
    api.patch<{ user: AdminUser }>(`/users/${id}`, input).then((d) => d.user),

  resetPassword: (id: number, input: AdminResetPasswordInput) =>
    api.post<{ ok: true }>(`/users/${id}/reset-password`, input),
};
