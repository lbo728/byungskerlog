# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16-based personal blog application with admin capabilities. The blog supports markdown content with syntax highlighting, uses Neon PostgreSQL database via Prisma, and Stack Auth for authentication. Deployed on Vercel.

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
- **Generated Client**: Uses default path at `node_modules/@prisma/client`
- **Singleton Pattern**: Prisma client is exported from `lib/prisma.ts` to prevent multiple instances in development
- **Models**:
  - `Post`: Blog posts with slug-based routing, markdown content, published status

### Authentication System

The application uses **Stack Auth** (@stackframe/stack):
- Client configuration in `stack/client.tsx`
- Server configuration in `stack/server.tsx`
- Auth handler route at `app/handler/[...stack]/page.tsx`
- Uses `nextjs-cookie` token store
- Requires three environment variables:
  - `NEXT_PUBLIC_STACK_PROJECT_ID`
  - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
  - `STACK_SECRET_SERVER_KEY`

### Middleware & Route Protection

- `middleware.ts` uses Stack Auth's server API to check authentication
- Protects all `/admin/*` routes
- Unauthenticated users redirected to `/handler/sign-in` with return URL

### Application Structure

**Pages & Routes**:
- `/` - Homepage listing published posts
- `/posts/[slug]` - Dynamic post pages
- `/admin/login` - Admin login page
- `/admin/write` - Post creation/editing page

**API Routes**:
- `POST /api/posts` - Create new post (authenticated with Stack Auth)
- `GET /api/posts` - List published posts

**Key Features**:
- Markdown rendering with syntax highlighting (react-markdown + react-syntax-highlighter)
- Automatic heading IDs for ToC navigation (scroll offset: `scroll-mt-24`)
- On-demand revalidation after post creation
- Tailwind CSS with dark mode support

### Admin Account Management

Admin authentication is managed entirely through Stack Auth:
- Create admin accounts in Stack Auth dashboard (https://app.stack-auth.com)
- No database-level admin accounts
- All users authenticated through Stack Auth can access admin routes

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
- `DATABASE_URL` - Neon PostgreSQL connection string (pooled)
- `DATABASE_URL_UNPOOLED` - Direct connection for migrations
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Stack Auth project ID
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Stack Auth publishable key
- `STACK_SECRET_SERVER_KEY` - Stack Auth secret key (server-side only)

### Database Provider

Uses **Neon PostgreSQL** (serverless Postgres):
- Requires both pooled and direct connection URLs
- Schema changes via `prisma db push` (development)
- Consider migrations for production (`prisma migrate`)
