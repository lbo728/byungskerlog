# Comment System Migration: Self-hosted to Giscus

## TL;DR

> **Quick Summary**: 자체 구현 댓글 시스템을 아카이빙하고 Giscus(GitHub Discussions 기반)로 교체
>
> **Deliverables**:
>
> - 기존 댓글 코드 삭제 (Git tag로 복구 가능)
> - Comment/CommentReaction DB 테이블 삭제
> - Giscus 컴포넌트 구현 및 적용
> - 복구 가이드 문서
>
> **Estimated Effort**: Medium (2-3시간)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

---

## Context

### Original Request

자체 구현 댓글 시스템을 아카이빙하고 Giscus 방식으로 변경

### Interview Summary

**Key Discussions**:

- 아카이빙: Git tag 후 코드 삭제 + DB 마이그레이션 (동의)
- Giscus repo: 별도 댓글 전용 repo 생성
- 테스트: Playwright E2E
- 복구 가이드: 반드시 포함

### Current System Files (to be archived)

| Category       | Files                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Components** | `components/comment/CommentSkeleton.tsx`, `CommentList.tsx`, `CommentForm.tsx`, `CommentItem.tsx`, `CommentReactions.tsx`, `components/post/Comments.tsx` |
| **Hooks**      | `hooks/useComments.ts`                                                                                                                                    |
| **Types**      | `lib/types/comment.ts`                                                                                                                                    |
| **API Client** | `lib/api/comments.ts`                                                                                                                                     |
| **Utils**      | `lib/comment-identity.ts`                                                                                                                                 |
| **API Routes** | `app/api/comments/route.ts`, `app/api/comments/[id]/route.ts`, `app/api/comments/[id]/reactions/route.ts`                                                 |
| **Tests**      | `__tests__/api/comments.test.ts`                                                                                                                          |

**Usage Point**: `components/post/PostDetail.tsx` imports `Comments`

---

## Work Objectives

### Core Objective

자체 댓글 시스템을 Giscus로 교체하면서 복구 가능한 형태로 아카이빙

### Concrete Deliverables

- Git tag `archive/self-hosted-comments` 생성
- 14개 파일 삭제
- Prisma migration으로 Comment 관련 테이블 삭제
- `components/post/Giscus.tsx` 컴포넌트 생성
- `PostDetail.tsx`에 Giscus 적용
- Playwright E2E 테스트

### Definition of Done

- [x] `git tag archive/self-hosted-comments` 존재
- [x] `npx prisma migrate status` - 마이그레이션 적용됨
- [x] 블로그 포스트 페이지에서 Giscus 댓글 위젯 표시
- [x] Playwright 테스트 통과

### Must Have

- 복구 가이드 (Task 5)
- Git tag 생성 후 삭제 (순서 중요)
- Giscus repo 설정 가이드

### Must NOT Have (Guardrails)

- 기존 댓글 데이터 GitHub로 마이그레이션 시도 (불가능, scope out)
- Post 모델 외 다른 모델 수정
- 블로그 기능 외 수정

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: Playwright 사용
- **User wants tests**: YES (Playwright E2E)
- **Framework**: Playwright

### Playwright E2E 검증

```typescript
// e2e/giscus.spec.ts
test("Giscus 댓글 위젯이 포스트에 표시됨", async ({ page }) => {
  await page.goto("/posts/[any-published-post]");
  await expect(page.locator(".giscus-frame")).toBeVisible();
});
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Git tag 생성 + 코드 삭제
└── Task 2: (병렬 불가 - Task 1 이후)

Wave 2 (After Task 2):
├── Task 3: Giscus 컴포넌트 구현
└── Task 4: (Task 3 이후)

Wave 3 (Final):
└── Task 5: E2E 테스트 + 복구 가이드
```

### Dependency Matrix

| Task | Depends On | Blocks |
| ---- | ---------- | ------ |
| 1    | None       | 2      |
| 2    | 1          | 3      |
| 3    | 2          | 4      |
| 4    | 3          | 5      |
| 5    | 4          | None   |

---

## TODOs

- [x] 1. Git Tag 생성 및 댓글 코드 삭제

  **What to do**:
  1. Git tag 생성: `git tag archive/self-hosted-comments`
  2. 다음 파일들 삭제:
     - `components/comment/` 전체 폴더
     - `components/post/Comments.tsx`
     - `hooks/useComments.ts`
     - `lib/types/comment.ts`
     - `lib/api/comments.ts`
     - `lib/comment-identity.ts`
     - `app/api/comments/` 전체 폴더
     - `__tests__/api/comments.test.ts`
  3. `components/post/PostDetail.tsx`에서 Comments import 및 사용 제거 (임시 주석 또는 삭제)
  4. TypeScript 컴파일 에러 없는지 확인

  **Must NOT do**:
  - Tag 생성 전에 파일 삭제하지 않기
  - Post 모델 수정 (다음 Task에서 처리)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
    - `git-master`: Git tag 생성 및 파일 삭제 작업

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (첫 번째)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - `components/post/PostDetail.tsx:14` - Comments import 위치
  - `prisma/schema.prisma:34` - Post.comments 관계 (다음 task에서 제거)

  **Acceptance Criteria**:

  ```bash
  # Git tag 확인
  git tag -l | grep archive/self-hosted-comments
  # Expected: archive/self-hosted-comments

  # 파일 삭제 확인
  ls components/comment/ 2>&1
  # Expected: No such file or directory

  # TypeScript 컴파일
  npx tsc --noEmit
  # Expected: 에러 없음 (Comments 제거로 인한 에러 해결 후)
  ```

  **Commit**: YES
  - Message: `chore: archive self-hosted comment system`
  - Files: 삭제된 파일들 + PostDetail.tsx
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 2. Prisma Migration - Comment 테이블 삭제

  **What to do**:
  1. `prisma/schema.prisma`에서 제거:
     - `Post.comments` 관계 (34번 줄)
     - `Comment` 모델 전체 (172-192줄)
     - `CommentReaction` 모델 전체 (194-206줄)
     - `ReactionType` enum (208-213줄)
  2. 마이그레이션 생성 및 적용:
     ```bash
     npx prisma migrate dev --name remove_comment_tables
     ```
  3. Prisma Client 재생성 확인

  **Must NOT do**:
  - `--accept-data-loss` 플래그 사용하지 않기 (Prisma가 자동으로 처리)
  - 다른 모델 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - DB 마이그레이션은 특별한 skill 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `prisma/schema.prisma:34` - Post.comments 관계
  - `prisma/schema.prisma:168-213` - Comment System Models 섹션
  - `AGENTS.md` - Prisma migration 가이드라인

  **Acceptance Criteria**:

  ```bash
  # 마이그레이션 상태 확인
  npx prisma migrate status
  # Expected: "Database schema is up to date!"

  # schema.prisma에 Comment 없는지 확인
  grep -c "model Comment" prisma/schema.prisma
  # Expected: 0

  # Prisma generate 성공
  npx prisma generate
  # Expected: 성공
  ```

  **Commit**: YES
  - Message: `chore(db): remove comment tables via migration`
  - Files: `prisma/schema.prisma`, `prisma/migrations/*`
  - Pre-commit: `npx prisma migrate status`

---

- [x] 3. Giscus 컴포넌트 구현

  **What to do**:
  1. 패키지 설치: `npm install @giscus/react`
  2. `components/post/Giscus.tsx` 생성:

     ```tsx
     "use client";

     import GiscusComponent from "@giscus/react";

     interface GiscusProps {
       slug: string; // 포스트 slug를 mapping에 사용
     }

     export function Giscus({ slug }: GiscusProps) {
       return (
         <GiscusComponent
           repo="[OWNER]/[REPO]" // 별도 댓글 repo
           repoId="[REPO_ID]" // giscus.app에서 확인
           category="Comments"
           categoryId="[CATEGORY_ID]" // giscus.app에서 확인
           mapping="specific"
           term={slug}
           strict="0"
           reactionsEnabled="1"
           emitMetadata="0"
           inputPosition="top"
           theme="preferred_color_scheme"
           lang="ko"
         />
       );
     }
     ```

  3. 실제 repo/repoId/categoryId는 giscus.app 설정 후 채우기

  **Must NOT do**:
  - 블로그 repo를 Giscus repo로 사용하지 않기 (별도 repo 사용 결정됨)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:
  - https://giscus.app - Giscus 설정 생성기
  - @giscus/react 공식 문서

  **Setup Guide** (사용자 액션 필요):
  1. GitHub에 별도 repo 생성 (예: `byungskerlog-comments`)
  2. repo Settings → Features → Discussions 활성화
  3. Discussions에 "Comments" 카테고리 생성 (Announcement 타입)
  4. https://giscus.app 에서 설정 생성
  5. 생성된 값으로 컴포넌트 업데이트

  **Acceptance Criteria**:

  ```bash
  # 패키지 설치 확인
  npm ls @giscus/react
  # Expected: @giscus/react@x.x.x

  # 컴포넌트 파일 존재
  ls components/post/Giscus.tsx
  # Expected: 파일 존재

  # TypeScript 컴파일
  npx tsc --noEmit
  # Expected: 에러 없음
  ```

  **Commit**: YES
  - Message: `feat: add Giscus comment component`
  - Files: `components/post/Giscus.tsx`, `package.json`, `package-lock.json`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 4. PostDetail에 Giscus 적용

  **What to do**:
  1. `components/post/PostDetail.tsx` 수정:
     - `import { Giscus } from "./Giscus";`
     - 기존 Comments 위치에 `<Giscus slug={post.slug} />` 추가
  2. 로컬에서 포스트 페이지 확인

  **Must NOT do**:
  - Giscus 외 다른 컴포넌트 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References**:
  - `components/post/PostDetail.tsx` - 수정 대상
  - `components/post/Giscus.tsx` - import할 컴포넌트

  **Acceptance Criteria**:

  **Playwright 자동화 검증**:

  ```
  # Agent executes via playwright browser automation:
  1. npm run dev (개발 서버 실행)
  2. Navigate to: http://localhost:3000/posts/[published-post-slug]
  3. Wait for: selector ".giscus" or "giscus-frame" to be visible (최대 10초)
  4. Assert: Giscus iframe이 로드됨
  5. Screenshot: .sisyphus/evidence/task-4-giscus-loaded.png
  ```

  **Commit**: YES
  - Message: `feat: integrate Giscus into post detail page`
  - Files: `components/post/PostDetail.tsx`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 5. Playwright E2E 테스트 + 복구 가이드

  **What to do**:
  1. Playwright 테스트 작성 `e2e/giscus.spec.ts`:

     ```typescript
     import { test, expect } from "@playwright/test";

     test.describe("Giscus Comments", () => {
       test("포스트 페이지에 Giscus 위젯이 표시됨", async ({ page }) => {
         // 실제 published 포스트 URL로 변경
         await page.goto("/posts/[slug]");

         // Giscus iframe 로드 대기
         const giscusFrame = page.locator(".giscus-frame");
         await expect(giscusFrame).toBeVisible({ timeout: 15000 });
       });
     });
     ```

  2. 프로젝트 루트에 `RECOVERY-GUIDE.md` 작성 (또는 기존 docs 폴더에)

  **Recovery Guide 내용**:

  ```markdown
  # Comment System Recovery Guide

  ## 코드 복구

  git checkout archive/self-hosted-comments -- components/comment/
  git checkout archive/self-hosted-comments -- components/post/Comments.tsx
  git checkout archive/self-hosted-comments -- hooks/useComments.ts
  git checkout archive/self-hosted-comments -- lib/types/comment.ts
  git checkout archive/self-hosted-comments -- lib/api/comments.ts
  git checkout archive/self-hosted-comments -- lib/comment-identity.ts
  git checkout archive/self-hosted-comments -- app/api/comments/
  git checkout archive/self-hosted-comments -- **tests**/api/comments.test.ts

  ## DB 테이블 복구

  1. prisma/schema.prisma에 Comment, CommentReaction 모델 복원
  2. npx prisma migrate dev --name restore_comment_tables

  ## PostDetail.tsx 수정

  - Giscus import 제거
  - Comments import 복원
  ```

  **Must NOT do**:
  - 실제 복구 작업 실행 (가이드만 작성)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]
    - `playwright`: E2E 테스트 작성 및 실행

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final
  - **Blocks**: None
  - **Blocked By**: Task 4

  **References**:
  - Playwright 공식 문서
  - 프로젝트 기존 e2e 테스트 패턴 (있다면)

  **Acceptance Criteria**:

  ```bash
  # Playwright 테스트 실행
  npx playwright test e2e/giscus.spec.ts
  # Expected: 1 passed

  # 복구 가이드 파일 존재
  ls RECOVERY-GUIDE.md
  # Expected: 파일 존재
  ```

  **Commit**: YES
  - Message: `test: add Giscus E2E test and recovery guide`
  - Files: `e2e/giscus.spec.ts`, `RECOVERY-GUIDE.md`
  - Pre-commit: `npx playwright test e2e/giscus.spec.ts`

---

## Commit Strategy

| After Task | Message                                          | Key Files                             |
| ---------- | ------------------------------------------------ | ------------------------------------- |
| 1          | `chore: archive self-hosted comment system`      | 삭제된 파일들, PostDetail.tsx         |
| 2          | `chore(db): remove comment tables via migration` | schema.prisma, migrations/            |
| 3          | `feat: add Giscus comment component`             | Giscus.tsx, package.json              |
| 4          | `feat: integrate Giscus into post detail page`   | PostDetail.tsx                        |
| 5          | `test: add Giscus E2E test and recovery guide`   | e2e/giscus.spec.ts, RECOVERY-GUIDE.md |

---

## Success Criteria

### Verification Commands

```bash
# Git tag 존재
git tag -l | grep archive/self-hosted-comments

# DB 마이그레이션 완료
npx prisma migrate status

# Giscus 패키지 설치됨
npm ls @giscus/react

# TypeScript 컴파일 성공
npx tsc --noEmit

# Playwright 테스트 통과
npx playwright test e2e/giscus.spec.ts
```

### Final Checklist

- [x] Git tag `archive/self-hosted-comments` 생성됨
- [x] 자체 댓글 코드 14개 파일 삭제됨
- [x] Comment, CommentReaction 테이블 삭제됨
- [x] Giscus 컴포넌트가 포스트에 표시됨
- [x] Playwright E2E 테스트 통과
- [x] RECOVERY-GUIDE.md 작성됨

---

## User Action Required (Before Task 3)

Giscus 설정을 위해 다음 작업이 필요합니다:

1. **GitHub repo 생성**: `byungskerlog-comments` (또는 원하는 이름)
2. **Discussions 활성화**: repo Settings → Features → Discussions 체크
3. **카테고리 생성**: Discussions → Categories → New → "Comments" (Announcement 타입)
4. **giscus.app 설정**: https://giscus.app 에서 설정 생성 후 값 복사

이 정보가 있어야 Task 3에서 컴포넌트를 완성할 수 있습니다.
