import type { combinedSchemas } from '$lib/db';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { AuthenticatedDbClient } from '../event-utilities';
import ProjectService, { AdminProjectService } from './projects';

export class ServiceContainer {
  projects: ProjectService;
  adminProjects: AdminProjectService;

  constructor(
    private authenticatedDb: AuthenticatedDbClient,
    private adminDb: NeonHttpDatabase<typeof combinedSchemas>
  ) {
    this.projects = new ProjectService(this.authenticatedDb);
    this.adminProjects = new AdminProjectService(this.adminDb);
  }
}
