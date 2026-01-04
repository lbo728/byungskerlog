# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Overview

Next.js 16 personal blog with Neon PostgreSQL (Prisma), Stack Auth, TipTap editor, deployed on Vercel.

## Build/Lint/Test Commands

```bash
npm run dev              # Dev server (port 3002)
npm run build            # prisma generate && next build
npm run lint             # ESLint

# Testing (Vitest + React Testing Library + MSW)
npm run test             # Watch mode
npm run test:run         # Single run
npm run test:coverage    # Coverage report

# Run single test file
npx vitest run __tests__/hooks/usePost.test.tsx

# Run tests matching pattern
npx vitest run -t "로딩 상태"

# Prisma
npx prisma generate && npx prisma db push && npx prisma studio
```

## Code Style Guidelines

### Formatting (Prettier)

- Semicolons required, double quotes, 2-space tabs
- Trailing comma: ES5, print width: 120, arrow parens: always, LF endings

### Imports

```typescript
// 1. External packages → 2. @/ alias → 3. Relative
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Post } from "@/lib/types/post";
import { createWrapper } from "../test-utils";
```

### TypeScript

- Strict mode, use `interface` for objects, `type` for unions
- Use `type` imports for type-only imports

### Naming Conventions

| Item             | Convention      | Example                          |
| ---------------- | --------------- | -------------------------------- |
| Components       | PascalCase      | `PostDetail`, `MarkdownRenderer` |
| Component Files  | PascalCase      | `PostDetail.tsx`, `Header.tsx`   |
| Hooks            | camelCase, use- | `usePost`, `useDraftMutations`   |
| Hook Files       | camelCase       | `usePost.ts`, `useDrafts.ts`     |
| Other Files      | kebab-case      | `post-data.ts`, `api-client.ts`  |
| Constants        | SCREAMING_SNAKE | `ErrorCode.NOT_FOUND`            |
| Types/Interfaces | PascalCase      | `Post`, `ApiErrorResponse`       |
| Query keys       | nested object   | `queryKeys.posts.detail(slug)`   |

### Tailwind CSS

First class name describes the DOM element's purpose:

```tsx
<div className="post-detail-layout relative py-12">  // Good
<div className="relative py-12">                      // Bad
```

Use semantic HTML tags (`article`, `section`, `nav`, `header`, `footer`).

### Error Handling

Server-side (API routes):

```typescript
import { ApiError, handleApiError } from "@/lib/api/errors";
throw ApiError.notFound("Post");
throw ApiError.validationError("Title is required");
return handleApiError(error, "Failed to fetch post");
```

Client-side:

```typescript
import { ClientApiError } from "@/lib/api/client";
if (error instanceof ClientApiError) {
  if (error.code === "NOT_FOUND") {
    /* handle */
  }
}
```

### React Query Patterns

```typescript
export function usePost(id: string, options: UsePostOptions = {}) {
  return useQuery({
    queryKey: queryKeys.posts.detailById(id),
    queryFn: () => apiClient.get<Post>(`/api/posts/${id}`),
    staleTime: Infinity,
    enabled: !!id && options.enabled !== false,
  });
}
```

### Component Structure

- Hooks first, early returns, main render last
- Define props interface above component
- Add `"use client"` directive for client components

## Testing Guidelines

### Test Patterns

- Use `vitest`, `@testing-library/react`, `msw` for mocking
- Test descriptions in Korean, function names in English
- Test loading/success/error states for hooks
- Test success/failure cases for API client
- Use `renderHook` with `createWrapper()` for React Query hooks

## Git Conventions

- Commit as **lbo728**, English conventional commits with Korean bullets
- Create feature branches, PR to main/dev (see CLAUDE.md template)
- Push only when work chunk is complete, use "Merge Pull Request" (not squash)

## Key Paths

| Path                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `app/`                 | Next.js App Router pages & API |
| `components/`          | React components               |
| `hooks/`               | Custom React hooks             |
| `lib/`                 | Utilities, types, API client   |
| `lib/prisma.ts`        | Prisma client singleton        |
| `prisma/schema.prisma` | Database schema                |
| `__tests__/`           | Test files                     |

## Important Conventions

- Always import Prisma from `@/lib/prisma`
- Path alias: `@/*` maps to project root
- Client components need `"use client"` directive
- Use `cn()` for conditional Tailwind classes
- Toast notifications via Sonner
- State management via React Query (no Redux/Zustand)
