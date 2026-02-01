# Fix Publish Cache Invalidation

## TL;DR

> **Quick Summary**: 발행 후 Home/Post/Short 메뉴에서 새 포스트가 바로 보이지 않는 문제를 캐시 무효화 범위 확장으로 해결
>
> **Deliverables**:
>
> - `app/admin/write/page.tsx`의 `handlePublishSuccess` 함수 수정
>
> **Estimated Effort**: Quick (5분 미만)
> **Parallel Execution**: NO - 단일 파일 수정
> **Critical Path**: Task 1 (유일한 작업)

---

## Context

### Original Request

admin/write에서 발행 완료하면 바로 Home에 해당 포스트가 보여야하고, Post 타입이었다면 Post 메뉴에서, Short 타입이었다면 Short 메뉴에서도 바로 보여야함. 현재는 강제 새로고침을 해야만 보임.

### 문제 분석

`handlePublishSuccess`에서 `queryKeys.posts.lists()`만 무효화하여 `["posts", "list"]`만 캐시가 무효화됨.

하지만 실제 화면들은 다른 쿼리 키를 사용:

- Home: `queryKeys.posts.homeLatest()` → `["posts", "home", "latest"]`
- Short 메뉴: `queryKeys.shortPosts.list(page)` → `["short-posts", "list", page]`

이 쿼리들은 `["posts", "list"]`의 하위가 아니므로 무효화되지 않음.

---

## Work Objectives

### Core Objective

발행 후 모든 관련 화면(Home, Post 목록, Short 목록)에서 새 포스트가 즉시 표시되도록 캐시 무효화 범위 확장

### Concrete Deliverables

- `app/admin/write/page.tsx` L476-483 수정

### Definition of Done

- [ ] 발행 후 Home 페이지에서 새 포스트 즉시 표시
- [ ] 발행 후 Post 메뉴에서 새 포스트 즉시 표시
- [ ] 발행 후 Short 메뉴에서 Short 타입 포스트 즉시 표시

### Must Have

- `queryKeys.posts.all` 무효화 (모든 posts 관련 쿼리 무효화)
- `queryKeys.shortPosts.all` 무효화 (모든 short-posts 관련 쿼리 무효화)
- `queryKeys.tags.all` 무효화 (태그 목록 갱신)

### Must NOT Have (Guardrails)

- 불필요한 전역 캐시 무효화 (`queryClient.clear()` 등)
- 기존 `router.refresh()` 제거하지 않음

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO (이 프로젝트에 E2E 테스트 없음)
- **User wants tests**: Manual verification
- **QA approach**: Manual verification

---

## Execution Strategy

### Single Task - No Parallelization

---

## TODOs

- [ ] 1. handlePublishSuccess 캐시 무효화 범위 확장

  **What to do**:
  - `app/admin/write/page.tsx`의 `handlePublishSuccess` 함수 수정
  - `queryKeys.posts.lists()` → `queryKeys.posts.all`로 변경
  - `queryKeys.shortPosts.all` 추가
  - `queryKeys.tags.all` 추가

  **Must NOT do**:
  - 다른 로직 변경 금지
  - `router.refresh()` 제거 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일, 3줄 변경의 trivial 작업
  - **Skills**: [`git-master`]
    - `git-master`: 커밋 작성에 필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: N/A (단일 작업)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **수정 대상 파일**:
  - `app/admin/write/page.tsx:476-483` - handlePublishSuccess 함수 위치

  **Query Keys 정의**:
  - `lib/queryKeys.ts:29-42` - posts 쿼리 키 계층 구조
  - `lib/queryKeys.ts:44-48` - shortPosts 쿼리 키 계층 구조

  **참고할 올바른 패턴**:
  - `hooks/usePostMutations.ts:53-55` - useCreatePost에서 이미 올바르게 무효화하는 패턴

  ```typescript
  queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
  ```

  **변경 전 코드**:

  ```typescript
  const handlePublishSuccess = (slug: string) => {
    clearAutoSave();
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    const path = modalPostType === "SHORT" ? `/short/${slug}` : `/posts/${slug}`;
    router.push(path);
    router.refresh();
    toast.success(isEditMode ? "포스트가 수정되었습니다." : "포스트가 업로드 되었습니다.");
  };
  ```

  **변경 후 코드**:

  ```typescript
  const handlePublishSuccess = (slug: string) => {
    clearAutoSave();
    // 최상위 키로 무효화하여 모든 하위 쿼리(posts.list, posts.home 등)를 무효화
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    const path = modalPostType === "SHORT" ? `/short/${slug}` : `/posts/${slug}`;
    router.push(path);
    router.refresh();
    toast.success(isEditMode ? "포스트가 수정되었습니다." : "포스트가 업로드 되었습니다.");
  };
  ```

  **Acceptance Criteria**:

  **Automated Verification (using playwright skill)**:

  ```
  # 테스트 시나리오 1: Long Post 발행 후 Home 확인
  1. Navigate to: http://localhost:3000/admin/write
  2. Fill: title input with "테스트 포스트 [timestamp]"
  3. Fill: editor with "테스트 내용입니다."
  4. Click: 발행하기 button
  5. Wait for: PublishModal to appear
  6. Click: 발행하기 button in modal
  7. Wait for: navigation to /posts/[slug]
  8. Navigate to: http://localhost:3000 (Home)
  9. Assert: "테스트 포스트 [timestamp]" text appears on page (without refresh)
  10. Screenshot: .sisyphus/evidence/task-1-home-check.png

  # 테스트 시나리오 2: Short Post 발행 후 Short 메뉴 확인
  1. Navigate to: http://localhost:3000/admin/write
  2. Fill: title input with "테스트 Short [timestamp]"
  3. Fill: editor with "Short 테스트 내용"
  4. Click: 발행하기 button
  5. Wait for: PublishModal to appear
  6. Click: "Short Post" radio button
  7. Click: 발행하기 button in modal
  8. Wait for: navigation to /short/[slug]
  9. Navigate to: http://localhost:3000/short (Short 메뉴)
  10. Assert: "테스트 Short [timestamp]" text appears on page (without refresh)
  11. Screenshot: .sisyphus/evidence/task-1-short-check.png
  ```

  **Evidence to Capture:**
  - [ ] Screenshot of Home page showing new post immediately after publish
  - [ ] Screenshot of Short page showing new short post immediately after publish

  **Commit**: YES
  - Message: `fix(write): expand cache invalidation scope for immediate post visibility`
  - Files: `app/admin/write/page.tsx`
  - Pre-commit: N/A (no tests)

---

## Commit Strategy

| After Task | Message                                                                     | Files                    | Verification        |
| ---------- | --------------------------------------------------------------------------- | ------------------------ | ------------------- |
| 1          | `fix(write): expand cache invalidation scope for immediate post visibility` | app/admin/write/page.tsx | Manual browser test |

---

## Success Criteria

### Final Checklist

- [ ] 발행 후 새로고침 없이 Home에서 새 포스트 표시
- [ ] 발행 후 새로고침 없이 /posts에서 새 Post 표시
- [ ] 발행 후 새로고침 없이 /short에서 새 Short Post 표시
- [ ] 기존 동작(router.refresh, toast 등) 유지
