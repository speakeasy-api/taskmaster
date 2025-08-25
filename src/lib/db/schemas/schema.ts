import { relations, sql } from 'drizzle-orm';
import {
  check,
  customType,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { users } from './auth';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  }
});

const timestamps = {
  created_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updated_at: timestamp({ withTimezone: true, mode: 'string' })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`)
};

export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'triage',
  'todo',
  'in_progress',
  'done',
  'canceled'
]);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid().defaultRandom().primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }).notNull(),
    created_by: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    project_id: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    search_vector: tsvector().generatedAlwaysAs(
      sql`
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
      `
    ),
    status: taskStatusEnum(),
    ...timestamps
  },
  (t) => [index('title_search_index').using('gin', t.search_vector)]
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.created_by],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id]
  }),
  dependencies: many(taskDependencies, { relationName: 'task_dependencies' }),
  dependents: many(taskDependencies, { relationName: 'depends_on_task' })
}));

export const taskDependencyTypeEnum = pgEnum('dependency_type', [
  'blocks',
  'relates_to',
  'duplicates'
]);

export const taskDependencies = pgTable(
  'task_dependencies',
  {
    id: uuid().defaultRandom().primaryKey(),
    task_id: uuid()
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    depends_on_task_id: uuid()
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    dependency_type: taskDependencyTypeEnum().notNull(),
    created_by: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps
  },
  (t) => [
    unique().on(t.task_id, t.depends_on_task_id),
    check('no_self_ref', sql`${t.task_id} <> ${t.depends_on_task_id}`)
  ]
);

export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
  task: one(tasks, {
    fields: [taskDependencies.task_id],
    references: [tasks.id],
    relationName: 'task_dependencies'
  }),
  dependsOnTask: one(tasks, {
    fields: [taskDependencies.depends_on_task_id],
    references: [tasks.id],
    relationName: 'depends_on_task'
  })
}));

export const projects = pgTable('projects', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull(),
  created_by: text().references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps
});

export const projectsRelations = relations(projects, ({ many }) => ({
  task: many(tasks)
}));
