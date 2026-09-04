import { sql } from 'drizzle-orm';

// Matches the `(current_timestamp)` default used in the schema, so updated rows stay in the
// same sortable "YYYY-MM-DD HH:MM:SS" format as freshly-inserted ones.
export function now() {
  return sql`(current_timestamp)`;
}
