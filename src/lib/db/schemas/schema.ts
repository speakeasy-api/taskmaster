import { relations, sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'triage',
  'todo',
  'in_progress',
  'done',
  'canceled'
]);

export const task = pgTable('task', {
  id: uuid().defaultRandom().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull(),
  created_by: text()
    .notNull()
    .references(() => user.id, { onDelete: 'no action' }),
  project_id: uuid().references(() => project.id, { onDelete: 'cascade' }),
  status: taskStatusEnum(),
  created_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updated_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`)
});

export const taskRelations = relations(task, ({ one }) => ({
  user: one(user, {
    fields: [task.created_by],
    references: [user.id]
  }),
  project: one(project, {
    fields: [task.project_id],
    references: [project.id]
  })
}));

export const project = pgTable('project', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull(),
  created_by: text().references(() => user.id),
  created_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updated_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`)
});

export const projectRelations = relations(project, ({ many }) => ({
  task: many(task)
}));
