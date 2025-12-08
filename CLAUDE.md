# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16-based personal blog application with admin capabilities. The blog supports markdown content with syntax highlighting, has a PostgreSQL database via Prisma, and uses NextAuth for admin authentication.

## Development Commands

```bash
# Development server
npm run dev

# Build (includes Prisma generation and DB push)
npm run build

# Production server
npm start

# Linting
npm run lint

# Prisma commands
npx prisma generate          # Generate Prisma Client
npx prisma db push          # Push schema changes to database
npx prisma studio           # Open Prisma Studio GUI

# Admin account creation
npm run create-admin        # Generate SQL for creating admin account
```

## Architecture

### Database & ORM

- **Prisma**: Located in `prisma/schema.prisma`
- **Generated Client**: Custom output path at `lib/generated/prisma/client`
- **Singleton Pattern**: Prisma client is exported from `lib/prisma.ts` to prevent multiple instances in development
- **Models**:
  - `Post`: Blog posts with slug-based routing, markdown content, published status
  - `Admin`: Admin users with bcrypt-hashed passwords

### Authentication System

The application uses **dual authentication setup**:

1. **NextAuth (Database-based)**: Primary authentication for admin panel
   - Configuration in `auth.ts`
   - Credentials provider with bcrypt password verification
   - Queries `Admin` model from Prisma
   - Custom sign-in page at `/admin/login`
   - Protected routes via `authorized` callback

2. **Stack Auth (@stackframe/stack)**: Alternative auth system
   - Client config in `stack/client.tsx`
   - Server config in `stack/server.tsx`
   - Handler route at `app/handler/[...stack]/page.tsx`

**Note**: The dual auth setup may indicate a transition or experimentation. Verify which system is actively used before making changes.

### Middleware & Route Protection

- `middleware.ts` exports NextAuth's `auth` as middleware
- Protects all `/admin/*` routes
- Unauthenticated users redirected to `/admin/login`

### Application Structure

**Pages & Routes**:
- `/` - Homepage listing published posts
- `/posts/[slug]` - Dynamic post pages
- `/admin/login` - Admin login page
- `/admin/write` - Post creation/editing page

**API Routes**:
- `POST /api/posts` - Create new post (authenticated)
- `GET /api/posts` - List published posts
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/setup-admin` - Admin account setup

**Key Features**:
- Markdown rendering with syntax highlighting (react-markdown + react-syntax-highlighter)
- Automatic heading IDs for ToC navigation (scroll offset: `scroll-mt-24`)
- On-demand revalidation after post creation
- Tailwind CSS with dark mode support

### Admin Account Management

Admin accounts cannot be created through the UI. Use one of these methods:

1. **Script Method**: Run `npm run create-admin` to generate SQL with bcrypt hash
2. **SQL Direct**: Execute generated SQL in Neon SQL Editor or database client
3. **API Method**: POST to `/api/setup-admin` endpoint (check if enabled)

Default script credentials:
- Username: `admin`
- Password: `qwer1234!!` (change in production)

### Important Conventions

- **Prisma Client Import**: Always import from `@/lib/prisma` not directly from generated client
- **Path Alias**: `@/*` maps to project root
- **Slug Uniqueness**: Post slugs must be unique (enforced by database constraint)
- **Published Flag**: Only `published: true` posts appear on frontend
- **Revalidation**: Manual revalidation via `revalidatePath()` after mutations

### UI Components

- Uses shadcn/ui components in `components/ui/`
- Custom components:
  - `MarkdownRenderer`: Renders markdown with custom styling and syntax highlighting
  - `ThemeProvider`: Dark mode support
  - `ThemeToggle`: Theme switcher
  - `TableOfContents`: Auto-generated from markdown headings

### Environment Setup

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DATABASE_URL_UNPOOLED` - Direct connection for migrations
- Stack Auth credentials (if using Stack Auth)
- NextAuth secret (auto-generated in development)

### Database Provider

Uses **Neon PostgreSQL** (serverless Postgres):
- Requires both pooled and direct connection URLs
- Schema changes via `prisma db push` (development)
- Consider migrations for production (`prisma migrate`)
