import type { combinedSchemas } from '$lib/db';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { AuthenticatedDbClient } from '../event-utilities';
import ProjectService, { AdminProjectService } from './projects';
import { ApiKeysService } from './api-keys';
import { AdminUsersService } from './users';

export class ServiceContainer {
  adminUsers: AdminUsersService;

  projects: ProjectService;
  adminProjects: AdminProjectService;

  apiKeys: ApiKeysService;

  constructor(
    private authenticatedDb: AuthenticatedDbClient,
    private adminDb: NeonHttpDatabase<typeof combinedSchemas>
  ) {
    this.projects = new ProjectService(this.authenticatedDb);
    this.adminProjects = new AdminProjectService(this.adminDb);

    this.adminUsers = new AdminUsersService(this.adminDb);

    this.apiKeys = new ApiKeysService(this.authenticatedDb);
  }
}
