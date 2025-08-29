import { relations } from 'drizzle-orm';
import { users, oauthApplications } from './auth';
import { tasks } from './schema';
import { authenticatedRole, authUid } from 'drizzle-orm/neon';
import { pgPolicy } from 'drizzle-orm/pg-core';

export const userRelations = relations(users, ({ many }) => ({
  tasks: many(tasks)
}));

export const oauthApplicationsPolicy_select = pgPolicy('crud-authenticated-policy-select', {
  as: 'permissive',
  for: 'select',
  to: authenticatedRole,
  using: authUid(oauthApplications.userId)
}).link(oauthApplications);

export const oauthApplicationsPolicy_insert = pgPolicy('crud-authenticated-policy-insert', {
  as: 'permissive',
  for: 'insert',
  to: authenticatedRole,
  withCheck: authUid(oauthApplications.userId)
}).link(oauthApplications);

export const oauthApplicationsPolicy_update = pgPolicy('crud-authenticated-policy-update', {
  as: 'permissive',
  for: 'update',
  to: authenticatedRole,
  using: authUid(oauthApplications.userId),
  withCheck: authUid(oauthApplications.userId)
}).link(oauthApplications);

export const oauthApplicationsPolicy_delete = pgPolicy('crud-authenticated-policy-delete', {
  as: 'permissive',
  for: 'delete',
  to: authenticatedRole,
  using: authUid(oauthApplications.userId)
}).link(oauthApplications);
