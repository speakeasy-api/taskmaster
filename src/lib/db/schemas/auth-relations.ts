import { relations } from 'drizzle-orm';
import { user } from './auth';
import { task } from './schema';

export const userRelations = relations(user, ({ many }) => ({
  tasks: many(task)
}));
