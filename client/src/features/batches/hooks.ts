import type { BatchLogEntryInput, CreateBatchInput, UpdateBatchInput } from '@brewlog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { batchesApi } from './api';
import type { BatchFilters } from './types';

export function useBatches(filters: BatchFilters) {
  return useQuery({
    queryKey: ['batches', filters],
    queryFn: () => batchesApi.list(filters),
  });
}

export function useBatch(id: number) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: () => batchesApi.get(id),
    enabled: Number.isInteger(id),
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBatchInput) => batchesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches'], exact: false }),
  });
}

export function useUpdateBatch(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBatchInput) => batchesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches'], exact: false }),
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => batchesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches'], exact: false }),
  });
}

export function useCreateLogEntry(batchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BatchLogEntryInput) => batchesApi.createLogEntry(batchId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches', batchId] }),
  });
}

export function useUpdateLogEntry(batchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: number; input: BatchLogEntryInput }) =>
      batchesApi.updateLogEntry(batchId, entryId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches', batchId] }),
  });
}

export function useDeleteLogEntry(batchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => batchesApi.deleteLogEntry(batchId, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches', batchId] }),
  });
}

export function useUploadLogPhoto(batchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, file }: { entryId: number; file: File }) =>
      batchesApi.uploadLogPhoto(batchId, entryId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches', batchId] }),
  });
}

export function useDeleteLogPhoto(batchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, photoId }: { entryId: number; photoId: number }) =>
      batchesApi.deleteLogPhoto(batchId, entryId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches', batchId] }),
  });
}
