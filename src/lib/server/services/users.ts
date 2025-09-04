import type { combinedSchemas } from '$lib/db';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { ResultAsync } from 'neverthrow';
import { DatabaseError, type TaggedError } from './errors';
import type { User } from 'better-auth';

export class ProjectNotFoundError extends Error implements TaggedError {
  _tag = 'UserNotFoundError' as const;

  constructor(message?: string) {
    super(message || 'Not Found');
    this.name = 'ProjectNotFoundError';
  }
}

export class AdminUsersService {
  constructor(private adminDb: NeonHttpDatabase<typeof combinedSchemas>) {}

  get(params: { id: string }): ResultAsync<User, DatabaseError | ProjectNotFoundError> {
    return ResultAsync.fromPromise(
      this.adminDb.query.users
        .findFirst({
          where: (users, { eq }) => eq(users.id, params.id)
        })
        .then((result) => {
          if (!result) throw new ProjectNotFoundError();
          return result;
        }),
      (e) => {
        if (e instanceof DatabaseError || e instanceof ProjectNotFoundError) return e;
        throw e;
      }
    );
  }
}
