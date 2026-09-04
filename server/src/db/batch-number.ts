import { like } from 'drizzle-orm';
import { db } from './client.js';
import { batches } from './schema.js';

// Per-year human-readable code, e.g. "2026-001", resetting each calendar year. Must be called
// from inside the same synchronous transaction as the batch insert to avoid duplicate numbers.
export function generateBatchNumber(): string {
  const prefix = `${new Date().getFullYear()}-`;
  const rows = db
    .select({ batchNumber: batches.batchNumber })
    .from(batches)
    .where(like(batches.batchNumber, `${prefix}%`))
    .all();

  const maxSeq = rows.reduce((max, row) => {
    const seq = Number(row.batchNumber.slice(prefix.length));
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}
