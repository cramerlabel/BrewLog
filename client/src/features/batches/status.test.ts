import { describe, expect, it } from 'vitest';
import { STATUS_LABELS, STATUS_OPTIONS } from './status';

describe('batch status labels', () => {
  it('has a human-readable label for every status option', () => {
    for (const status of STATUS_OPTIONS) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
