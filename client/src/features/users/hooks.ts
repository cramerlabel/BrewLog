import type { AdminResetPasswordInput, CreateUserInput, UpdateUserInput } from '@brewlog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
    },
  });
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
    },
  });
}

export function useResetUserPassword(id: number) {
  return useMutation({
    mutationFn: (input: AdminResetPasswordInput) => usersApi.resetPassword(id, input),
  });
}
