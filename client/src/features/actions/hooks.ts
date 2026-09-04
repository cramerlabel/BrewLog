import type { CreateActionInput, UpdateActionInput } from '@brewlog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actionsApi } from './api';

export function useActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: actionsApi.list,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActionInput) => actionsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'], exact: false });
    },
  });
}

export function useUpdateAction(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateActionInput) => actionsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'], exact: false });
    },
  });
}
