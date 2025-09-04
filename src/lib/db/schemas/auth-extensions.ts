import { relations } from 'drizzle-orm';
import { authenticatedRole, authUid } from 'drizzle-orm/neon';
import { pgPolicy } from 'drizzle-orm/pg-core';
import { apikeys, oauthApplications, users } from './auth';
import { tasks } from './schema';

export const userRelations = relations(users, ({ many }) => ({
  tasks: many(tasks)
}));

/**
 * POLICIES FOR OAUTH APPS
 */

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

/**
 * POLICIES FOR API KEYS
 */

export const apikeysPolicy_select = pgPolicy('crud-authenticated-policy-select', {
  as: 'permissive',
  for: 'select',
  to: authenticatedRole,
  using: authUid(apikeys.userId)
}).link(apikeys);

export const apikeysPolicy_insert = pgPolicy('crud-authenticated-policy-insert', {
  as: 'permissive',
  for: 'insert',
  to: authenticatedRole,
  withCheck: authUid(apikeys.userId)
}).link(apikeys);

export const apikeysPolicy_update = pgPolicy('crud-authenticated-policy-update', {
  as: 'permissive',
  for: 'update',
  to: authenticatedRole,
  using: authUid(apikeys.userId),
  withCheck: authUid(apikeys.userId)
}).link(apikeys);

export const apikeysPolicy_delete = pgPolicy('crud-authenticated-policy-delete', {
  as: 'permissive',
  for: 'delete',
  to: authenticatedRole,
  using: authUid(apikeys.userId)
}).link(apikeys);
