import { relations, sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'triage',
  'todo',
  'in_progress',
  'done',
  'canceled'
]);

export const tasks = pgTable('tasks', {
  id: uuid().defaultRandom().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull(),
  created_by: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  project_id: uuid().references(() => projects.id, { onDelete: 'cascade' }),
  status: taskStatusEnum(),
  created_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updated_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`)
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.created_by],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id]
  })
}));

export const projects = pgTable('projects', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull(),
  created_by: text().references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updated_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`)
});

export const projectsRelations = relations(projects, ({ many }) => ({
  task: many(tasks)
}));
