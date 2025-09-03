import type { AuthenticatedDbClient } from '../event-utilities';
import ProjectService from './projects';

export class ServiceContainer {
  projects: ProjectService;

  constructor(private db: AuthenticatedDbClient) {
    this.projects = new ProjectService(this.db);
  }
}
