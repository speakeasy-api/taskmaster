# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` or `bun dev`
- **Production build**: `npm run build`
- **Preview build**: `npm run preview`
- **Type checking**: `npm run check` (includes svelte-kit sync)
- **Continuous type checking**: `npm run check:watch`
- **Linting**: `npm run lint` (prettier + eslint)
- **Formatting**: `npm run format`
- **Testing**: `npm run test` (vitest)

## Database Commands

- **Generate migrations**: `bunx drizzle-kit generate`
- **Run migrations**: `bunx drizzle-kit migrate`
- **Database studio**: `bunx drizzle-kit studio`

The project uses PostgreSQL with Drizzle ORM. Database configuration is in `drizzle.config.ts` and requires `DATABASE_URL` environment variable.

## Architecture Overview

This is a SvelteKit application with Better Auth integration for authentication and Drizzle ORM for database operations.

### Authentication Architecture

- **Better Auth Server**: Configured in `src/lib/auth.ts` with Drizzle adapter
- **Better Auth Client**: Browser client in `src/lib/auth-client.ts`
- **SvelteKit Integration**: Handled via `src/hooks.server.ts` using `svelteKitHandler`
- **Database Schemas**: Auth tables defined in `src/lib/db/schemas/auth.ts`

Key auth features enabled:

- Email/password authentication
- OIDC provider plugin with login page at `/sign-in`
- JWT tokens for API access
- OpenAPI documentation generation
- Session cookie caching (5-minute cache)
- Dynamic client registration support

### OIDC Provider Implementation

Custom OIDC provider implementation in `src/lib/oidc-provider/`:

- Authorization endpoint handling (`authorize.ts`)
- Token endpoint handlers for authorization code and client credentials flows (`handlers/token/`)
- Client registration and management
- OAuth consent flow management

### Database Structure

Database connection setup in `src/lib/db/index.ts` using node-postgres adapter.

Core auth tables:

- `user`: User profiles with email, name, verification status
- `session`: User sessions with expiration and metadata
- `account`: OAuth provider accounts linked to users
- `verification`: Email/phone verification tokens
- `jwks`: JSON Web Key Sets for token signing
- `oauthApplication`: OAuth client applications
- `oauthAccessToken`: OAuth access and refresh tokens
- `oauthConsent`: User consent for OAuth applications

### Remote Functions Architecture

This project uses [SvelteKit remote functions](https://svelte.dev/docs/kit/remote-functions) for type-safe server-client communication. Remote functions are an experimental feature that allows calling server-side functions directly from components with full type safety.

#### File Organization Pattern

**Component-adjacent pattern** (for optimal maintainability):

```
Component.svelte                      # Svelte component
Component.remote.ts                   # Remote function implementations
Component.schemas.ts                  # Zod validation schemas
```

This co-location pattern ensures that:
- Related functionality stays together
- Changes to components naturally include their remote functions
- No need for centralized barrel exports
- Easier to find and maintain component-specific logic

#### Function Implementation Standards

- **Data mutations**: Use `command()` with Zod schemas for type-safe mutations
- **Form submissions**: Use `form()` with validation helpers for form handling
- **Data fetching**: Use `prerender()` for data that can be cached at build time
- **Error handling**: Use consistent utility functions for validation and database errors

#### Utility Functions (`/src/lib/util.server.ts`)

- `validateForm(formData, schema)`: Validates FormData against Zod schemas
- `handleValidationError(validation)`: Returns consistent validation error responses
- `handleDatabaseError(rowCount, message)`: Handles database operation errors
- `createSuccessResponse(data)`: Creates standardized success responses

#### Usage Examples

**Component-adjacent function (CreateProjectModal.remote.ts)**:

```typescript
import { command } from '$app/server';
import { CreateProjectRequest } from './CreateProjectModal.schemas';
import { validateForm, handleValidationError } from '$lib/util.server';

export const createProject = command(CreateProjectRequest, async (request) => {
  const { user } = await getRequestEvent().locals.validateSession();
  // Implementation...
});
```

**Component usage with direct imports**:

```typescript
import { createProject } from './CreateProjectModal.remote';
import { CreateProjectRequest } from './CreateProjectModal.schemas';
```

**Form function with error handling**:

```typescript
import { form } from '$app/server';
import { validateForm, handleValidationError } from '$lib/util.server';
import { DeleteProjectRequest } from './ProjectComponent.schemas';

export const deleteProject = form(async (formData) => {
  const validation = validateForm(formData, DeleteProjectRequest);
  if (!validation.success) {
    return handleValidationError(validation);
  }
  // Implementation...
});
```

## API Development Guidelines

### Required Practices for All API Routes

When creating or modifying API routes in `src/routes/api/`, follow these mandatory practices:

#### 0. Security Requirements

**CRITICAL**: For ANY endpoint that accesses privileged information (user data, protected resources, etc.):

- **App routes**: ALWAYS validate session using `locals.validateSession()` or equivalent
- **API routes**: ALWAYS validate OAuth token using `validateAuthHeader()` or equivalent

NO exceptions - this must be the first check in any privileged endpoint before any data access or processing.

#### 1. OpenAPI Documentation

- **ALWAYS** update `static/openapi.yaml` when making API changes
- Document all parameters, request bodies, response schemas, and error codes
- **ALWAYS** include `operationId` for each operation using camelCase naming (e.g., `getTasks`, `createProject`, `updateTask`, `deleteProject`)
- Follow existing patterns for consistency
- Include examples for request/response data

#### 2. Input Validation

- **ALWAYS** validate request bodies and query parameters using Zod schemas
- Perform validation **before** any database operations
- Return structured 400 errors with field-specific messages on validation failure
- Use component-adjacent `*.schemas.ts` files for schema organization

```typescript
// Query parameter validation example
const QueryParamsSchema = z.object({
  project_id: z.string().uuid('project_id must be a valid UUID').optional()
});

const validation = QueryParamsSchema.safeParse(queryParams);
if (!validation.success) {
  const errors = validation.error.flatten().fieldErrors;
  return json({ message: 'Invalid query parameters', errors }, { status: 400 });
}
```

#### 3. Authorization & Security

- **ALWAYS** validate user authentication before data access
- Use `validateAuthHeader()` for OAuth token validation
- Ensure users can only access/modify resources they own
- Filter all database queries by authenticated user ID

```typescript
const validToken = await validateAuthHeader(request.headers.get('Authorization'));
if (!validToken) return new Response('Unauthorized', { status: 401 });

const authedUserId = validToken.userId;
if (!authedUserId) {
  return new Response('Invalid token', { status: 400 });
}

// Always filter by authenticated user
const result = await db.query.task.findMany({
  where: (table, { eq }) => eq(table.created_by, authedUserId)
});
```

#### 4. Error Handling

- Return consistent error response formats
- Use appropriate HTTP status codes:
  - `400`: Bad Request (validation errors)
  - `401`: Unauthorized (missing/invalid auth)
  - `403`: Forbidden (insufficient permissions)
  - `404`: Not Found (resource doesn't exist)
  - `500`: Internal Server Error (unexpected errors)
- Include descriptive error messages for API consumers

#### 5. Database Operations

- Always include user-based filtering in queries for security
- Use Drizzle ORM query patterns consistently
- Handle database errors gracefully
- Never expose internal database errors to API responses

### Implementation Checklist

Before deploying API changes, ensure:

- [ ] OpenAPI specification updated with operationId
- [ ] Input validation implemented with Zod
- [ ] Authorization checks in place
- [ ] Database queries filtered by authenticated user
- [ ] Error responses are consistent and informative
- [ ] No sensitive data exposed in responses

### Stack Details

- **Framework**: SvelteKit 2.x with Svelte 5
- **Styling**: TailwindCSS 4.x with Skeleton UI components
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth with email/password and OIDC support
- **Package Manager**: pnpm (specified in package.json)
- **Build Tool**: Vite with SvelteKit and TailwindCSS plugins

### Key File Locations

- Auth configuration: `src/lib/auth.ts` and `src/lib/auth-client.ts`
- Database schemas: `src/lib/db/schemas/`
- Database connection: `src/lib/db/index.ts`
- Remote functions: Component-adjacent `*.remote.ts` and `*.schemas.ts` files throughout the codebase
- Server hooks: `src/hooks.server.ts`
- Routes: `src/routes/` (includes sign-up flow)
