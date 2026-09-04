import type { BatchStatus } from '@brewlog/shared';

export const STATUS_LABELS: Record<BatchStatus, string> = {
  planning: 'Planning',
  fermenting: 'Fermenting',
  conditioning: 'Conditioning',
  bottled_kegged: 'Bottled/Kegged',
  aging: 'Aging',
  completed: 'Completed',
  archived: 'Archived',
};

export const STATUS_OPTIONS: BatchStatus[] = [
  'planning',
  'fermenting',
  'conditioning',
  'bottled_kegged',
  'aging',
  'completed',
  'archived',
];
