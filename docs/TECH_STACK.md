# Byungskerlog 기술 스택 총정리

## 1. 프레임워크 & 런타임

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 16.0.7 | App Router 기반 풀스택 프레임워크. SSR/SSG, API Routes, 이미지 최적화 |
| **React** | 19.2.0 | UI 라이브러리. Server Components + Client Components 혼합 사용 |
| **TypeScript** | 5.x | 타입 안정성 및 DX 향상 |

---

## 2. 데이터베이스 & ORM

| 기술 | 용도 | 사용 방식 |
|------|------|-----------|
| **Neon PostgreSQL** | 서버리스 PostgreSQL | Pooled + Direct 연결 지원 |
| **Prisma** | ORM | 스키마 정의, 마이그레이션, 타입 안전한 쿼리 |

**모델 구조**:
- `Post`: 블로그 포스트 (LONG/SHORT 타입 구분)
- `Series`: 시리즈 그룹핑
- `PostView`: 조회수 추적 (IP, UserAgent 기록)
- `Page`: 정적 페이지 (About 등)
- `Draft`: 임시 저장 글

---

## 3. 인증

| 기술 | 용도 |
|------|------|
| **Stack Auth** (@stackframe/stack) | 인증 시스템. 미들웨어로 `/admin/*` 라우트 보호 |

---

## 4. 에디터 (작성)

| 기술 | 용도 | 사용 방식 |
|------|------|-----------|
| **TipTap** | WYSIWYG 에디터 | `@tiptap/react`, `@tiptap/starter-kit` |
| **tiptap-markdown** | 마크다운 변환 | TipTap ↔ Markdown 양방향 변환 |
| **lowlight** | 코드 하이라이팅 | `@tiptap/extension-code-block-lowlight`와 연동 |

**커스텀 확장**:
- `EmbedCard`: 링크 임베드 카드
- `LinkModal`: 링크 삽입 모달

---

## 5. 마크다운 렌더링 (읽기)

| 기술 | 용도 |
|------|------|
| **react-markdown** | 마크다운 → React 컴포넌트 변환 |
| **remark-gfm** | GitHub Flavored Markdown 지원 (테이블, 체크박스 등) |
| **rehype-raw** | 마크다운 내 HTML 태그 허용 |
| **rehype-sanitize** | XSS 방지를 위한 HTML 정제 |
| **react-syntax-highlighter** | 코드 블록 구문 강조 |

---

## 6. 상태 관리 & 데이터 페칭

| 기술 | 용도 | 사용 방식 |
|------|------|-----------|
| **TanStack Query** (React Query) | 서버 상태 관리 | 시리즈 목록, 포스트 데이터 캐싱 및 뮤테이션 |
| **React Hook Form** | 폼 상태 관리 | 글쓰기 폼, 모달 폼 |
| **Zod** | 스키마 검증 | `@hookform/resolvers`와 연동하여 폼 유효성 검사 |

---

## 7. UI 컴포넌트

| 기술 | 용도 |
|------|------|
| **shadcn/ui** | 기본 UI 컴포넌트 (Button, Dialog, Select 등) |
| **Radix UI** | shadcn/ui의 기반. 접근성 준수 헤드리스 컴포넌트 |
| **Lucide React** | 아이콘 라이브러리 |

---

## 8. 스타일링

| 기술 | 용도 |
|------|------|
| **Tailwind CSS** (v4) | 유틸리티 퍼스트 CSS |
| **@tailwindcss/typography** | `.prose` 클래스로 마크다운 스타일링 |
| **tailwind-merge** | 조건부 클래스 병합 |
| **class-variance-authority (CVA)** | 컴포넌트 variants 관리 |
| **next-themes** | 다크모드/라이트모드 테마 전환 |
| **tw-animate-css** | Tailwind 애니메이션 유틸리티 |

---

## 9. 애니메이션

| 기술 | 용도 | 사용 위치 |
|------|------|-----------|
| **GSAP** | 고성능 애니메이션 | 스크롤 기반 인터랙션, 페이지 전환 효과 |

---

## 10. 차트 & 시각화

| 기술 | 용도 | 사용 위치 |
|------|------|-----------|
| **Recharts** | 차트 라이브러리 | Admin 대시보드 통계 |
| **ContributionGraph** (커스텀) | GitHub 스타일 기여 그래프 | About 페이지 |

---

## 11. 유틸리티

| 기술 | 용도 |
|------|------|
| **date-fns** | 날짜 포맷팅 및 조작 |
| **clsx** | 조건부 className 조합 |
| **sonner** | 토스트 알림 |

---

## 12. 파일 업로드 & 스토리지

| 기술 | 용도 |
|------|------|
| **Vercel Blob** | 이미지 업로드 스토리지. 드래그&드롭 이미지 업로드 지원 |

---

## 13. SEO & 분석

| 기술 | 용도 |
|------|------|
| **StructuredData** (커스텀) | JSON-LD 스키마 (Article, Person, WebSite) |
| **Giscus** (@giscus/react) | GitHub Discussions 기반 댓글 시스템 |
| **ViewTracker / VisitorCount** | 조회수 추적 및 표시 |
| **AdSense** (커스텀) | Google AdSense 광고 |

---

## 14. 개발 도구

| 기술 | 용도 |
|------|------|
| **ESLint** | 코드 린팅 |
| **Prettier** | 코드 포맷팅 |
| **tsx** | TypeScript 실행 (스크립트용) |
| **React Query Devtools** | 캐시 상태 디버깅 |

---

## 15. 배포

| 플랫폼 | 용도 |
|--------|------|
| **Vercel** | 호스팅, CI/CD, Preview Deployments |

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐│
│  │ TipTap  │  │ React   │  │ Recharts│  │ React Query     ││
│  │ Editor  │  │ Markdown│  │ Charts  │  │ (Server State)  ││
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘│
│       │            │            │                 │         │
│       └────────────┴────────────┴─────────────────┘         │
│                            │                                │
│                     ┌──────┴──────┐                        │
│                     │   Next.js   │                        │
│                     │ App Router  │                        │
│                     └──────┬──────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                        서버/API                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐│
│  │ Stack   │  │ Prisma  │  │ Vercel  │  │ API Routes      ││
│  │ Auth    │  │ ORM     │  │ Blob    │  │ /api/*          ││
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘│
└───────┼────────────┼────────────┼────────────────┼──────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Stack Auth  │ │    Neon     │ │   Vercel    │ │   Giscus    │
│   Cloud     │ │ PostgreSQL  │ │    Blob     │ │  (GitHub)   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 핵심 설계 패턴

1. **Server Components 우선**: 데이터 페칭은 서버에서, 인터랙션이 필요한 부분만 `"use client"`
2. **도메인 기반 폴더 구조**: 컴포넌트를 layout, post, editor 등으로 그룹핑
3. **Barrel Exports**: `index.ts`로 깔끔한 import 경로 제공
4. **Dual Editor Strategy**: 작성은 TipTap (WYSIWYG), 읽기는 react-markdown
