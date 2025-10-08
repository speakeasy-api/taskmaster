---
title: Getting Started
---

**Taskmaster** is a comprehensive demo application designed to showcase the
power and flexibility of [Speakeasy](https://speakeasy.com) products and
developer tooling. Built with modern web technologies, it serves as a practical
example for demonstrating API-first development workflows and integration
capabilities.

### Perfect for Demonstrating

- **🏗️ Terraform Provider Generation** - Auto-generate infrastructure-as-code providers
- **📦 SDK Generation** - Create type-safe client libraries across multiple programming languages
- **🤖 MCP Server Development** - Build Model Context Protocol servers using [Gram](https://getgram.ai)
- **📚 API Documentation** - Showcase OpenAPI specification and interactive documentation
- **🔐 Authentication Patterns** - Multiple auth paradigms in one application

## Authentication Paradigms

Taskmaster implements a comprehensive authentication system supporting multiple
industry-standard flows:

### Supported Authentication Methods

- **API Keys** - Simple, long-lived authentication for server-to-server integrations
- **OAuth 2.0 Client Credentials** - Machine-to-machine authentication for automated systems
- **OAuth 2.0 Authorization Code** - User authorization flow for web and mobile applications
- **Email/Password Authentication** - Traditional user authentication with Better Auth integration
- **Dynamic Client Registration** - Programmatic OAuth client creation and management

Each authentication method is fully documented with examples and can be
explored through the navigation menu.

## API Specification & Configuration

### OpenAPI Specification

Access the complete API documentation and schema:

**[📋 OpenAPI Specification](/api/openapi.yaml)**

The specification includes:

- Complete endpoint documentation with examples
- Request/response schemas with validation rules
- Authentication requirements for each endpoint
- Error response formats and codes

### OIDC Configuration

For applications integrating with Taskmaster's OAuth flows:

**[🔧 OIDC Well-Known Configuration](https://taskmaster-speakeasyapi.vercel.app/api/auth/.well-known/openid-configuration)**

This endpoint provides:

- Authorization and token endpoint URLs
- Supported grant types and response modes
- Available scopes and claims
- JWT signing key information (JWKS)

## Getting Started

1. **Explore the Authentication Flows** - Use the navigation menu to learn about different auth methods
2. **Review the API Documentation** - Check out the OpenAPI specification for endpoint details
3. **Try the Live Application** - Sign up and create projects to see the API in action
4. **Generate SDKs** - Use Speakeasy to generate client libraries from the OpenAPI spec
5. **Build Integrations** - Create your own applications using Taskmaster's APIs

## Technical Architecture

Taskmaster is built with modern, production-ready technologies:

- **Frontend**: Svelte 5 + SvelteKit 2.x with Skeleton UI and TailwindCSS
- **Backend**: Node.js with Better Auth for authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with OIDC Provider implementation
- **API**: RESTful design with comprehensive OpenAPI documentation
- **Deployment**: Vercel with Neon PostgreSQL

Ready to explore? Start with the **Authentication** section in the sidebar to
learn about the different ways to integrate with Taskmaster's APIs.
