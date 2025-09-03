import { projects } from '$lib/db/schemas/schema';
import { ResultAsync } from 'neverthrow';
import type { AuthenticatedDbClient } from '../event-utilities';
import { and, eq, ilike } from 'drizzle-orm';
import { DatabaseError, type TaggedError } from './errors';

export class ProjectNotFoundError extends Error implements TaggedError {
  _tag = 'ProjectNotFoundError' as const;

  constructor(message?: string) {
    super(message || 'Not Found');
    this.name = 'ProjectNotFoundError';
  }
}

export default class ProjectService {
  constructor(private db: AuthenticatedDbClient) {}

  create = (params: {
    name: string;
    description: string;
    created_by: string;
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
    created_by: string;
    search?: string;
  }): ResultAsync<(typeof projects.$inferSelect)[], DatabaseError> => {
    const conditions = and(eq(projects.created_by, params.created_by));
    if (params.search) conditions?.append(ilike(projects.name, `%${params.search}%`));

    return ResultAsync.fromPromise(this.db.query.projects.findMany({ where: conditions }), (e) => {
      if (e instanceof DatabaseError) return e;
      throw e;
    });
  };

  delete = (params: {
    id: string;
    created_by: string;
  }): ResultAsync<void, ProjectNotFoundError | DatabaseError> =>
    ResultAsync.fromPromise(
      this.db
        .delete(projects)
        .where(and(eq(projects.id, params.id), eq(projects.created_by, params.created_by)))
        .then((r) => {
          if (r.rowCount === 0) throw new ProjectNotFoundError();
        }),
      (e) => {
        if (!(e instanceof ProjectNotFoundError) && !(e instanceof DatabaseError)) throw e;
        return e;
      }
    );
}
