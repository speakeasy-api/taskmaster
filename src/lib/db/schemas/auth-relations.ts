import { relations } from 'drizzle-orm';
import { users } from './auth';
import { tasks } from './schema';

export const userRelations = relations(users, ({ many }) => ({
  tasks: many(tasks)
}));
