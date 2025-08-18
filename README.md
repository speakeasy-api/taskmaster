# Speakeasy Demo Application

A modern SvelteKit application designed to demonstrate Speakeasy products and features.

## 🚀 Quick Deploy to Vercel

This application is optimized for easy deployment to Vercel with Neon PostgreSQL:

1. **Fork this repository** to your GitHub account

2. **Set up Neon Database**:
   - Create a new project at [neon.tech](https://neon.tech)
   - Copy your database connection string

3. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Add the following environment variable:
     ```
     DATABASE_URL=your_neon_connection_string
     ```
   - Deploy! Vercel will automatically handle the build and deployment

4. **Run database migrations**:
   - After deployment, run migrations via Vercel CLI or dashboard
   - Alternatively, set up GitHub Actions for automatic migrations

## 🛠 Tech Stack

This application leverages modern web development tools and frameworks:

- **Frontend**: [Svelte 5](https://svelte.dev) + [SvelteKit 2.x](https://kit.svelte.dev)
- **UI Framework**: [Skeleton UI](https://skeleton.dev) + [TailwindCSS 4.x](https://tailwindcss.com)
- **Authentication**: [Better Auth](https://better-auth.com) with email/password and OIDC support
- **Database**: [PostgreSQL](https://postgresql.org) with [Drizzle ORM](https://orm.drizzle.team)
- **Deployment**: [Vercel](https://vercel.com) with [Neon](https://neon.tech) database
- **Development**: TypeScript, Vite, ESLint, Prettier

## ✨ Key Features

- 🔐 **Full Authentication System** - Email/password auth with Better Auth
- 🌐 **OIDC Provider** - Custom OpenID Connect implementation
- 🗄️ **Type-Safe Database** - PostgreSQL with Drizzle ORM and full TypeScript support
- 📡 **Remote Functions** - SvelteKit's experimental remote functions for type-safe client-server communication
- 🎨 **Modern UI** - Responsive design with Skeleton UI components
- 📚 **OpenAPI Documentation** - Auto-generated API documentation
- 🤖 **AI-Powered Development** - Optimized for efficient development with Claude Code

## 🏗 AI-Powered Development

This project includes a comprehensive `CLAUDE.md` file that enables efficient AI-powered development workflows. The configuration provides Claude Code with:

- Complete project architecture understanding
- Development command shortcuts
- Database operation guidance  
- API development best practices
- Remote functions implementation patterns

Simply use [Claude Code](https://claude.ai/code) with this repository for intelligent code assistance, refactoring, and feature development.

## 🚦 Local Development

### Prerequisites

- Node.js 18+ or Bun 1.2+
- PostgreSQL database (local or hosted)

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo-url>
   cd sveltekit-betterauth
   bun install  # or npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Add your database URL:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```

3. **Set up the database**:
   ```bash
   # Generate and run migrations
   bunx drizzle-kit generate
   bunx drizzle-kit migrate
   
   # Optional: Open Drizzle Studio
   bunx drizzle-kit studio
   ```

4. **Start development server**:
   ```bash
   bun dev  # or npm run dev
   ```

Visit `http://localhost:5173` to see your application running.

## 🏛 Architecture Overview

### Remote Functions
This project uses SvelteKit's experimental remote functions feature for type-safe server-client communication:

- **Domain-level functions**: `/lib/remote-fns/[domain].remote.ts`
- **Route-specific functions**: `/routes/.../[route].remote.ts`  
- **Validation utilities**: Zod schemas with error handling helpers

### Authentication Flow
- **Better Auth Server**: Configured in `src/lib/auth.ts`
- **SvelteKit Integration**: Handled via `src/hooks.server.ts`
- **Database Schemas**: Auth tables in `src/lib/db/schemas/auth.ts`
- **OIDC Provider**: Custom implementation in `src/lib/oidc-provider/`

### Database Structure
- User management and authentication tables
- OAuth applications and tokens
- Session management with caching
- JSON Web Key Sets for token signing

## 📋 Available Commands

### Development
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun preview` - Preview production build

### Code Quality
- `bun run check` - TypeScript checking with svelte-kit sync
- `bun run check:watch` - Continuous type checking
- `bun run lint` - Lint with Prettier + ESLint
- `bun run format` - Format code with Prettier
- `bun run test` - Run tests with Vitest

### Database
- `bunx drizzle-kit generate` - Generate migrations
- `bunx drizzle-kit migrate` - Run migrations  
- `bunx drizzle-kit studio` - Open Drizzle Studio

## 📖 API Documentation

The application includes auto-generated OpenAPI documentation. After starting the development server, visit the API documentation endpoints to explore available endpoints and schemas.

## 🤝 Contributing

This project follows modern development practices with comprehensive linting, formatting, and type checking. The `CLAUDE.md` configuration ensures consistent development patterns when using AI assistance.

---

Built with ❤️ using SvelteKit and modern web technologies.
