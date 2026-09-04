import type { BatchLogEntryInput, CreateBatchInput, UpdateBatchInput } from '@brewlog/shared';
import { api } from '@/lib/api-client';
import type { BatchDetail, BatchFilters, BatchIngredient, BatchLogEntry, BatchStep, PaginatedBatches } from './types';

function buildQuery(filters: BatchFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const batchesApi = {
  list: (filters: BatchFilters = {}) => api.get<PaginatedBatches>(`/batches${buildQuery(filters)}`),

  get: (id: number) =>
    api.get<{ batch: BatchDetail; ingredients: BatchIngredient[]; steps: BatchStep[]; logEntries: BatchLogEntry[] }>(
      `/batches/${id}`,
    ),

  create: (input: CreateBatchInput) => api.post<{ batch: BatchDetail }>('/batches', input).then((d) => d.batch),

  update: (id: number, input: UpdateBatchInput) =>
    api.patch<{ batch: BatchDetail }>(`/batches/${id}`, input).then((d) => d.batch),

  remove: (id: number) => api.delete(`/batches/${id}`),

  createLogEntry: (batchId: number, input: BatchLogEntryInput) =>
    api.post<{ logEntry: BatchLogEntry }>(`/batches/${batchId}/log-entries`, input).then((d) => d.logEntry),

  updateLogEntry: (batchId: number, entryId: number, input: BatchLogEntryInput) =>
    api
      .patch<{ logEntry: BatchLogEntry }>(`/batches/${batchId}/log-entries/${entryId}`, input)
      .then((d) => d.logEntry),

  deleteLogEntry: (batchId: number, entryId: number) => api.delete(`/batches/${batchId}/log-entries/${entryId}`),

  uploadLogPhoto: (batchId: number, entryId: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.postForm(`/batches/${batchId}/log-entries/${entryId}/photos`, formData);
  },

  deleteLogPhoto: (batchId: number, entryId: number, photoId: number) =>
    api.delete(`/batches/${batchId}/log-entries/${entryId}/photos/${photoId}`),

  logPhotoUrl: (batchId: number, entryId: number, photoId: number) =>
    `/api/batches/${batchId}/log-entries/${entryId}/photos/${photoId}`,
};
