import type { BatchStatus, BrewType } from '@brewlog/shared';

export interface BatchSummary {
  id: number;
  name: string;
  type: BrewType;
  batchNumber: string;
  status: BatchStatus;
  startDate: string;
  endDate: string | null;
  ownerId: number;
  recipeId: number | null;
  createdAt: string;
  ownerUsername: string | null;
  ownerDisplayName: string | null;
}

export interface BatchIngredient {
  id: number;
  batchId: number;
  sortOrder: number;
  category: string;
  name: string;
  amount: number | null;
  unit: string | null;
  notes: string | null;
}

export interface BatchStep {
  id: number;
  batchId: number;
  stepNumber: number;
  text: string;
  isDone: boolean;
}

export interface BatchLogPhoto {
  id: number;
  logEntryId: number;
  filePath: string;
  originalFilename: string;
  uploadedAt: string;
}

export interface BatchLogEntry {
  id: number;
  batchId: number;
  entryDate: string;
  actionId: number | null;
  actionName: string | null;
  og: number | null;
  fg: number | null;
  brix: number | null;
  sg: number | null;
  ph: number | null;
  temperature: number | null;
  temperatureUnit: string | null;
  notes: string | null;
  createdBy: number;
  createdAt: string;
  photos: BatchLogPhoto[];
}

export interface BatchDetail {
  id: number;
  recipeId: number | null;
  recipeNameSnapshot: string | null;
  type: BrewType;
  name: string;
  batchNumber: string;
  status: BatchStatus;
  startDate: string;
  endDate: string | null;
  finalYieldAmount: number | null;
  finalYieldUnit: string | null;
  finalAbv: number | null;
  notes: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  owner: { id: number; username: string; displayName: string } | null;
}

export interface BatchFilters {
  status?: BatchStatus | 'open' | 'all';
  type?: BrewType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBatches {
  batches: BatchSummary[];
  total: number;
  page: number;
  pageSize: number;
}
