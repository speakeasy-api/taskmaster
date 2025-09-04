import { apikeys } from '$lib/db/schemas/auth';
import { eq } from 'drizzle-orm';
import { ResultAsync } from 'neverthrow';
import type { AuthenticatedDbClient } from '../event-utilities';
import { DatabaseError } from './errors';

export interface IApiKeysService {
  list: (params: {
    userId?: string;
  }) => ResultAsync<(typeof apikeys.$inferSelect)[], DatabaseError>;
}

export class ApiKeysService implements IApiKeysService {
  constructor(private dbClient: AuthenticatedDbClient) {}

  list = (params: { userId?: string }) =>
    ResultAsync.fromPromise(
      this.dbClient
        .select()
        .from(apikeys)
        .where(params.userId ? eq(apikeys.userId, params.userId) : undefined),
      (e) => {
        if (e instanceof DatabaseError) return e;
        throw e;
      }
    );
}
