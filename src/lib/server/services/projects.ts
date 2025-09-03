import { projects } from '$lib/db/schemas/schema';
import { ResultAsync } from 'neverthrow';
import type { AuthenticatedDbClient } from '../event-utilities';
import { and, eq, ilike } from 'drizzle-orm';
import { DatabaseError, type TaggedError } from './errors';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { combinedSchemas } from '$lib/db';

export class ProjectNotFoundError extends Error implements TaggedError {
  _tag = 'ProjectNotFoundError' as const;

  constructor(message?: string) {
    super(message || 'Not Found');
    this.name = 'ProjectNotFoundError';
  }
}

/**
 * Service for managing projects.
 * Uses an authenticated database client to ensure operations are performed as a user
 * and thus subject to PG RLS policies.
 */
export default class ProjectService {
  constructor(private db: AuthenticatedDbClient) {}

  /** Create a new project */
  create = (params: {
    name: string;
    description: string;
    created_by?: string;
  }): ResultAsync<typeof projects.$inferSelect, DatabaseError> =>
    ResultAsync.fromPromise(
      this.db
        .insert(projects)
        .values(params)
        .returning()
        .then((r) => r[0]),
      (e) => {
        if (e instanceof DatabaseError) return e;
        throw e;
      }
    );

  list = (params: {
    created_by?: string;
    search?: string;
  }): ResultAsync<(typeof projects.$inferSelect)[], DatabaseError> =>
    ResultAsync.fromPromise(
      this.db.query.projects.findMany({
        where: and(
          params.created_by ? eq(projects.created_by, params.created_by) : undefined,
          params.search ? ilike(projects.name, `%${params.search}%`) : undefined
        )
      }),
      (e) => {
        if (e instanceof DatabaseError) return e;
        throw e;
      }
    );

  delete = (params: {
    id: string;
    created_by?: string;
  }): ResultAsync<void, ProjectNotFoundError | DatabaseError> =>
    ResultAsync.fromPromise(
      this.db
        .delete(projects)
        .where(
          and(
            eq(projects.id, params.id),
            params.created_by ? eq(projects.created_by, params.created_by) : undefined
          )
        )
        .then((r) => {
          if (r.rowCount === 0) throw new ProjectNotFoundError();
        }),
      (e) => {
        if (!(e instanceof ProjectNotFoundError) && !(e instanceof DatabaseError)) throw e;
        return e;
      }
    );
}

/**
 * Admin service for managing projects.
 * Bypasses RLS policies and thus should only be used in trusted contexts.
 */
export class AdminProjectService {
  constructor(private db: NeonHttpDatabase<typeof combinedSchemas>) {}

  list = (params: {
    created_by?: string;
    search?: string;
  }): ResultAsync<(typeof projects.$inferSelect)[], DatabaseError> =>
    ResultAsync.fromPromise(
      this.db.query.projects.findMany({
        where: and(
          params.created_by ? eq(projects.created_by, params.created_by) : undefined,
          params.search ? ilike(projects.name, `%${params.search}%`) : undefined
        )
      }),
      (e) => {
        if (e instanceof DatabaseError) return e;
        throw e;
      }
    );
}
