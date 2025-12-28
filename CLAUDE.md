# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16-based personal blog application with admin capabilities. The blog supports markdown content with syntax highlighting, uses Neon PostgreSQL database via Prisma, and Stack Auth for authentication. Deployed on Vercel.

## Style Rules

- Tailwind로 Class 이름 작성 시, 첫번째 Class는 해당 DOM요소를 나타낼 수 있는 직관적인 이름을 붙여.
  e.g.,

```
<div className="about-preview-container flex flex-wrap gap-2 mb-2">
```

- html 작성 시 반드시 Semantic Tag 를 사용해.

## Git Rules

- 반드시 **lbo728** 계정으로 커밋, 푸시, PR을 진행해야해.
- 커밋 메세지는 영문 컨벤셔널 커밋으로 해야해.(단, description은 한글 불릿 포인트로 작성해.)
- 요청한 작업이 '덩어리' 단위라면 맥락에 맞추어 브랜치를 생성해서 작업해야해.
  - 맥락 별로 커밋을 만들며 진행해야해.
  - 작업 덩어리가 완료된다면 main(dev가 있다면 dev)브랜치를 향하는 PR을 생성해서 코멘트를 작성해야해.(하단 템플릿에서 인용문을 지우고 해당 내용을 작성하면돼. PR 이름은 브랜치 이름)
  ```
  > 이번 PR의 목적을 한 문장으로 요약해주세요.
  >
  > - 예: 사용자가 프로필 정보를 수정할 수 있는 기능을 추가했습니다.
  ```

## 📋 Changes

> 주요 변경사항을 bullet로 정리해주세요.
>
> - 예:
>   - `UserProfileEdit.tsx` 컴포넌트 추가
>   - `/api/user/profile` PUT 엔드포인트 연결
>   - Validation 로직 추가

## 🧠 Context & Background

> 이 변경이 필요한 이유를 설명해주세요.
> 관련된 이슈나 문서 링크를 첨부해도 좋아요.
>
> - 예: 유저 피드백에 따라 프로필 수정 기능이 필요했습니다. (#45)

## ✅ How to Test

> 테스트 방법을 단계별로 작성해주세요.
>
> - 예:
>   1. `/profile/edit` 페이지로 이동
>   2. 이름 수정 후 저장 클릭
>   3. 수정 내용이 DB에 반영되는지 확인

## 🧾 Screenshots or Videos (Optional)

> UI 변경이 있을 경우, Before / After 이미지를 첨부해주세요.
> 또는 Loom, GitHub Video를 추가해도 좋아요.

## 🔗 Related Issues

> 연관된 이슈를 연결해주세요.
>
> - 예:
>   - Closes: #123
>   - Related: #456

## 🙌 Additional Notes (Optional)

> 기타 참고사항, TODO, 리뷰어에게 요청사항 등을 작성해주세요. - 예: 스타일 관련 부분은 별도 PR로 분리 예정입니다.

````
- git push는 요청한 **작업 덩어리**가 전부 완료된 경우에만 수행해야한다. (한 커밋이 완료되었다고 바로 푸시하지 말 것)
- git push 후 CI 확인 워크플로우는 `~/.claude/skills/git-ci-workflow/SKILL.md` 참조
- main 브랜치에서의 푸시는 반드시, dev나 feature 등 서브 브랜치를 병합하는 푸시만 있어야해. 어떤 작업을 요청하면 반드시 브랜치를 생성해서 작업하고 승인되어야만 main 브랜치에서 푸시된다는 의미지.

## Code Rules

나에게 리뷰할 때만 주석을 포함해서 알려주고, 커밋 및 푸시 시점에는 주석은 삭제해야해.

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
````

## Architecture

### Database & ORM

- **Prisma**: Located in `prisma/schema.prisma`
- **Generated Client**: Uses default path at `node_modules/@prisma/client`
- **Singleton Pattern**: Prisma client is exported from `lib/prisma.ts` to prevent multiple instances in development
- **Models**:
  - `Post`: Blog posts with slug-based routing, markdown content, published status
    - `PostType` enum: `LONG` (일반 포스트) / `SHORT` (짧은 글)
    - `subSlug`: 검색 최적화를 위한 보조 slug (optional, unique)
    - `thumbnail`: 썸네일 이미지 URL
    - `tags`: 태그 배열
    - `excerpt`: 발췌문
    - Relations: `series`, `views`
  - `Series`: 포스트 시리즈 그룹핑 (name, slug, description)
  - `PostView`: 조회수 추적 (postId, viewedAt, ipAddress, userAgent)
  - `Page`: 정적 페이지 (About 등) 관리
  - `Draft`: 임시저장 글 (authorId 기반)

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
- `/posts` - All posts listing page
- `/posts/[slug]` - Dynamic post pages (LONG type)
- `/short-posts` - Short posts listing page
- `/short/[slug]` - Short post detail page (SHORT type)
- `/series` - Series listing page
- `/series/[slug]` - Series detail with posts
- `/tags` - Tags listing page
- `/about` - About page (editable via Page model)
- `/products` - Products showcase page
- `/admin/login` - Admin login page
- `/admin/write` - Post creation/editing page (TipTap editor)
- `/admin/posts` - Admin post management
- `/admin/drafts` - Admin draft management
- `/unauthorized` - Unauthorized access page
- `/handler/sign-in`, `/handler/sign-up` - Stack Auth handler pages
- `/sitemap.ts` - Dynamic sitemap generation
- `/robots.ts` - robots.txt configuration
- `/feed.xml` - RSS feed

**API Routes**:

Posts:
- `GET/POST /api/posts` - List/Create posts
- `GET/PUT/DELETE /api/posts/[id]` - Individual post CRUD
- `POST /api/posts/[id]/sub-slug` - Generate sub-slug for SEO

Post Stats:
- `POST /api/posts-by-slug/[slug]/views` - Increment view count
- `GET /api/posts-by-slug/[slug]/stats` - Get post statistics

Series:
- `GET/POST /api/series` - List/Create series
- `GET/PUT/DELETE /api/series/[id]` - Individual series CRUD

Drafts:
- `GET/POST /api/drafts` - List/Create drafts
- `GET/PUT/DELETE /api/drafts/[id]` - Individual draft CRUD

Others:
- `GET /api/tags` - List all tags with counts
- `GET /api/visitors` - Visitor count
- `GET/PUT /api/pages/[slug]` - Page content (About etc.)
- `POST /api/upload` - Image upload to Vercel Blob
- `POST /api/upload/thumbnail` - Thumbnail upload
- `GET /api/og` - Dynamic OG image generation
- `DELETE /api/auth/delete-unauthorized` - Delete unauthorized users

**Key Features**:

- **Editor**: TipTap rich text editor with markdown support (replacing legacy markdown editor)
- **Post Types**: LONG (일반 글) and SHORT (짧은 글) 지원
- **Series**: 포스트를 시리즈로 그룹핑 가능
- **View Tracking**: IP/User-Agent 기반 조회수 추적
- **Draft System**: 임시저장 기능
- **SEO**:
  - Dynamic Open Graph image generation
  - Structured data (JSON-LD)
  - Sitemap & RSS feed
  - Sub-slug for search optimization
- Markdown rendering with syntax highlighting (react-markdown + react-syntax-highlighter)
- Automatic heading IDs for ToC navigation (scroll offset: `scroll-mt-24`)
- On-demand revalidation after post creation
- Tailwind CSS with dark mode support
- GitHub comments via Giscus (GitHub Discussions based)
- Drag & drop image upload (Vercel Blob storage)
- **Analytics**:
  - Contribution graph (GitHub style)
  - Reading time estimation
  - Visitor counter
- **AdSense**: Google AdSense integration

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
- **State Management**: React Query (@tanstack/react-query) for server state
- **Toast Notifications**: Sonner

Custom components:
- `MarkdownRenderer`: Renders markdown with custom styling and syntax highlighting
- `ThemeProvider` / `ThemeToggle`: Dark mode support
- `Toc` / `MobileToc` / `WriteToc`: Table of Contents variants
- `Header` / `Footer`: Layout components
- `PostDetail` / `PostListClient`: Post display components
- `PostsPageClient` / `ShortPostsPageClient` / `TagsPageClient`: Page client components
- `ContributionGraph`: GitHub-style contribution graph
- `ReadingProgress`: Reading progress bar
- `ViewTracker` / `VisitorCount`: Analytics components
- `PublishModal` / `SubSlugModal` / `AboutEditModal`: Modal dialogs
- `SeriesSelect`: Series dropdown selector
- `ThumbnailUploader`: Thumbnail upload with preview
- `LinkCard` / `ProductCard`: Card components
- `FloatingActionButton`: Mobile floating action button
- `StructuredData`: SEO structured data component

TipTap Editor (`components/tiptap/`):
- `embed-card-extension.tsx`: Custom embed card extension
- `link-modal.tsx`: Link insertion modal

Legacy (deprecated):
- `components/legacy/`: Old markdown editor components

### Lib Directory (`lib/`)

Utility modules:
- `prisma.ts`: Prisma client singleton
- `auth.ts`: Authentication utilities
- `post-data.ts`: Post data fetching functions
- `excerpt.ts`: Excerpt generation from content
- `reading-time.ts`: Reading time calculation
- `image-optimizer.ts`: Image optimization utilities
- `syntax-theme.ts`: Code syntax highlighting theme
- `utils.ts`: General utilities (cn for classnames)
- `types.ts` / `types/`: TypeScript type definitions

### Environment Setup

Required environment variables:

Database:
- `DATABASE_URL` - Neon PostgreSQL connection string (pooled)
- `DATABASE_URL_UNPOOLED` - Direct connection for migrations

Stack Auth:
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Stack Auth project ID
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Stack Auth publishable key
- `STACK_SECRET_SERVER_KEY` - Stack Auth secret key (server-side only)

Giscus Comments:
- `NEXT_PUBLIC_GISCUS_REPO` - GitHub repository (e.g., `lbo728/byungskerlog`)
- `NEXT_PUBLIC_GISCUS_REPO_ID` - Repository ID (from giscus.app)
- `NEXT_PUBLIC_GISCUS_CATEGORY` - Discussion category name
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID` - Category ID (from giscus.app)

Storage:
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

SEO & Analytics:
- `NEXT_PUBLIC_SITE_URL` - Site URL (default: https://byungskerlog.vercel.app)
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` - Google AdSense client ID (optional)

### Database Provider

Uses **Neon PostgreSQL** (serverless Postgres):

- Requires both pooled and direct connection URLs
- Schema changes via `prisma db push` (development)
- Consider migrations for production (`prisma migrate`)

### Key Dependencies

Core:
- `next` (v16) - React framework
- `react` (v19) - UI library
- `prisma` / `@prisma/client` - Database ORM
- `@stackframe/stack` - Authentication

Editor:
- `@tiptap/*` - Rich text editor
- `tiptap-markdown` - Markdown support for TipTap
- `lowlight` - Code syntax highlighting in editor

State & Forms:
- `@tanstack/react-query` - Server state management
- `react-hook-form` / `@hookform/resolvers` - Form handling
- `zod` - Schema validation

UI:
- `tailwindcss` - CSS framework
- Radix UI primitives (`@radix-ui/*`) - Accessible components
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `next-themes` - Theme management

Content:
- `react-markdown` - Markdown rendering
- `react-syntax-highlighter` - Code highlighting
- `rehype-raw` / `rehype-sanitize` - HTML processing
- `remark-gfm` - GitHub Flavored Markdown

Analytics & Misc:
- `@giscus/react` - GitHub Discussions comments
- `@vercel/blob` - File storage
- `recharts` - Charts
- `gsap` - Animations
- `date-fns` - Date utilities
