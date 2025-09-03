import { DatabaseError as PgDatabaseError } from 'pg';

export interface TaggedError {
  readonly _tag: string;
}

/**
 * Extends the pg DatabaseError to add a discriminant property for easier error
 * handling
 * */
export class DatabaseError extends PgDatabaseError implements TaggedError {
  _tag = 'DatabaseError' as const;
}
