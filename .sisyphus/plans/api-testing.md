# Next.js API Route Handler 테스트 구현

## Context

### Original Request

[BYU-285] Next.js에서 구현한 현재 API들에 테스트 코드를 만들 수 있는가

### Interview Summary

**Key Discussions**:

- 29개의 API 라우트가 존재하며, 테스트 인프라(Vitest + MSW)가 이미 구축되어 있음
- 기존 테스트 13개가 있으며, 주로 lib 유틸리티와 hooks 테스트
- API Route Handler를 직접 호출하여 테스트하는 방식 채택

**Research Findings**:

- 모든 API가 표준화된 패턴 사용 (ApiError, handleApiError)
- 인증: `getAuthUser()` from `@/lib/auth`
- DB: `prisma` from `@/lib/prisma`
- Metis 분석 결과: vitest 환경이 `jsdom`이나 API 테스트는 `node` 환경 필요

### Metis Review

**Identified Gaps** (addressed):

- 환경 설정 문제: `environmentMatchGlobs`로 API 테스트용 node 환경 분리
- Acceptance Criteria 부재: 각 API당 최소 3개 테스트 정의
- Edge cases: Prisma P2002 에러, 쿼리 파라미터 파싱 테스트 포함

---

## Work Objectives

### Core Objective

Next.js API Route Handler들에 단위 테스트를 추가하여 코드 품질과 안정성을 확보한다.

### Concrete Deliverables

- `__tests__/api/posts.test.ts` - Posts API 테스트
- `__tests__/api/comments.test.ts` - Comments API 테스트
- `__tests__/api/drafts.test.ts` - Drafts API 테스트
- `__tests__/api/series.test.ts` - Series API 테스트
- `__tests__/mocks/prisma.ts` - Prisma mock 설정
- `vitest.config.ts` 수정 - API 테스트용 환경 분리

### Definition of Done

- [ ] `npm test` 실행 시 모든 테스트 통과
- [ ] 기존 13개 테스트 깨지지 않음
- [ ] 각 API당 최소 3개 테스트 (성공, 인증실패, 유효성실패)
- [ ] 테스트 실행 시간 30초 이내

### Must Have

- Prisma, getAuthUser, revalidatePath 모킹
- Node 환경에서 API 테스트 실행
- 한글 테스트 설명 (기존 패턴 유지)
- 각 API당 최소 성공/실패 케이스

### Must NOT Have (Guardrails)

- 실제 DB 연결 (Prisma mock 필수)
- 기존 API 코드 수정
- MSW 핸들러 수정 (hooks 테스트용)
- 29개 전체 API 테스트 (우선순위 4개만: posts, comments, drafts, series)
- E2E 테스트 작성

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES
- **User wants tests**: YES (TDD 아닌 Tests-after)
- **Framework**: Vitest (이미 설정됨)

### If Manual QA Only

N/A - 자동화 테스트 추가가 목적

---

## Task Flow

```
Task 0 (환경 설정)
    ↓
Task 1 (Prisma mock 생성)
    ↓
Task 2, 3, 4, 5 (API 테스트들 - 병렬 가능)
    ↓
Task 6 (최종 검증)
```

## Parallelization

| Group | Tasks      | Reason                 |
| ----- | ---------- | ---------------------- |
| A     | 2, 3, 4, 5 | 각 API 테스트는 독립적 |

| Task       | Depends On | Reason                              |
| ---------- | ---------- | ----------------------------------- |
| 2, 3, 4, 5 | 0, 1       | 환경 설정과 Prisma mock이 먼저 필요 |
| 6          | 2, 3, 4, 5 | 모든 테스트 완료 후 검증            |

---

## TODOs

- [ ] 0. Vitest 환경 설정 분리

  **What to do**:
  - `vitest.config.ts`에 `environmentMatchGlobs` 추가
  - API 테스트는 `node` 환경, 기존 테스트는 `jsdom` 유지

  **Must NOT do**:
  - 기존 테스트 설정 변경으로 인한 테스트 실패
  - 불필요한 설정 추가

  **Parallelizable**: NO (다른 모든 태스크의 전제조건)

  **References**:

  **Pattern References**:
  - `vitest.config.ts:1-30` - 현재 Vitest 설정 (jsdom 환경)
  - `vitest.setup.ts:1-17` - MSW 서버 설정 패턴

  **Documentation References**:
  - Vitest docs: https://vitest.dev/config/#environmentmatchglobs

  **Acceptance Criteria**:
  - [ ] `vitest.config.ts`에 `environmentMatchGlobs` 설정 추가
  - [ ] `**/__tests__/api/**` 패턴이 `node` 환경으로 설정
  - [ ] `npm test` 실행 시 기존 13개 테스트 통과 확인
  - [ ] 실행 명령: `npm test` → Expected: 13 tests passed

  **Commit**: YES
  - Message: `test: configure vitest environment for API route tests`
  - Files: `vitest.config.ts`
  - Pre-commit: `npm test`

---

- [ ] 1. Prisma Mock 설정 생성

  **What to do**:
  - `__tests__/mocks/prisma.ts` 파일 생성
  - 모든 Prisma 모델에 대한 mock 함수 정의
  - `vi.mock('@/lib/prisma')` 패턴 사용

  **Must NOT do**:
  - 실제 DB 연결
  - 복잡한 mock 구현 (단순 vi.fn()으로 시작)

  **Parallelizable**: NO (API 테스트들의 전제조건)

  **References**:

  **Pattern References**:
  - `__tests__/mocks/server.ts:1-5` - MSW 서버 mock 패턴
  - `__tests__/mocks/handlers.ts:1-50` - mock 데이터 구조 패턴
  - `lib/prisma.ts:1-15` - Prisma 싱글톤 패턴

  **API/Type References**:
  - `prisma/schema.prisma` - 모델 정의 참고 (Post, Comment, Draft, Series)

  **External References**:
  - Vitest vi.mock: https://vitest.dev/api/vi.html#vi-mock

  **Acceptance Criteria**:
  - [ ] `__tests__/mocks/prisma.ts` 파일 생성됨
  - [ ] Post, Comment, Draft, Series 모델에 대한 mock 함수 정의
  - [ ] `prisma.post.findMany`, `prisma.post.create` 등 주요 메서드 mock
  - [ ] 실행 명령: `npm test` → Expected: 기존 테스트 통과 (신규 테스트 없음)

  **Commit**: YES
  - Message: `test: add Prisma mock for API route testing`
  - Files: `__tests__/mocks/prisma.ts`
  - Pre-commit: `npm test`

---

- [ ] 2. Posts API 테스트 작성

  **What to do**:
  - `__tests__/api/posts.test.ts` 파일 생성
  - GET /api/posts 테스트 (성공, 쿼리 파라미터)
  - POST /api/posts 테스트 (성공, 인증실패, 유효성실패)
  - getAuthUser, prisma, revalidatePath 모킹

  **Must NOT do**:
  - 실제 API 코드 수정
  - 과도한 엣지 케이스 (핵심만)
  - Short post 연동 생성 로직 테스트 (복잡)

  **Parallelizable**: YES (with 3, 4, 5)

  **References**:

  **Pattern References**:
  - `app/api/posts/route.ts:27-155` - POST 핸들러 구현
  - `app/api/posts/route.ts:157-366` - GET 핸들러 구현
  - `__tests__/lib/api/client.test.ts:1-50` - 테스트 구조 패턴
  - `__tests__/lib/api/errors.test.ts:1-50` - ApiError 테스트 패턴

  **API/Type References**:
  - `lib/api/errors.ts:ApiError` - 에러 응답 구조
  - `lib/auth.ts:getAuthUser` - 인증 함수 시그니처

  **Test References**:
  - `__tests__/hooks/usePosts.test.tsx` - React Query 테스트 구조 참고

  **Acceptance Criteria**:
  - [ ] `__tests__/api/posts.test.ts` 파일 생성됨
  - [ ] GET /api/posts 테스트 최소 2개 (성공, 쿼리 파라미터)
  - [ ] POST /api/posts 테스트 최소 3개 (성공, 인증실패, 필수필드누락)
  - [ ] 실행 명령: `npm test __tests__/api/posts.test.ts` → Expected: 5+ tests passed

  **Commit**: YES
  - Message: `test: add Posts API route handler tests`
  - Files: `__tests__/api/posts.test.ts`
  - Pre-commit: `npm test`

---

- [ ] 3. Comments API 테스트 작성

  **What to do**:
  - `__tests__/api/comments.test.ts` 파일 생성
  - GET /api/comments 테스트 (성공, postId 없음)
  - POST /api/comments 테스트 (성공, 필수필드누락, 존재하지않는 post)
  - getAuthUser, prisma 모킹

  **Must NOT do**:
  - Reactions 관련 테스트 (별도 라우트)
  - 대댓글 깊은 중첩 테스트

  **Parallelizable**: YES (with 2, 4, 5)

  **References**:

  **Pattern References**:
  - `app/api/comments/route.ts:78-137` - GET 핸들러
  - `app/api/comments/route.ts:139-213` - POST 핸들러
  - `__tests__/api/posts.test.ts` - (이전 태스크에서 생성된) 테스트 패턴

  **API/Type References**:
  - `lib/types/comment.ts:Comment` - 코멘트 타입 정의

  **Acceptance Criteria**:
  - [ ] `__tests__/api/comments.test.ts` 파일 생성됨
  - [ ] GET /api/comments 테스트 최소 2개 (성공, postId 없음 에러)
  - [ ] POST /api/comments 테스트 최소 3개 (성공, content 누락, 존재하지않는 post)
  - [ ] 실행 명령: `npm test __tests__/api/comments.test.ts` → Expected: 5+ tests passed

  **Commit**: YES
  - Message: `test: add Comments API route handler tests`
  - Files: `__tests__/api/comments.test.ts`
  - Pre-commit: `npm test`

---

- [ ] 4. Drafts API 테스트 작성

  **What to do**:
  - `__tests__/api/drafts.test.ts` 파일 생성
  - GET /api/drafts 테스트 (성공, 인증실패)
  - POST /api/drafts 테스트 (성공, 인증실패)
  - getAuthUser, prisma 모킹

  **Must NOT do**:
  - Draft 개별 조회/수정/삭제 (별도 라우트)

  **Parallelizable**: YES (with 2, 3, 5)

  **References**:

  **Pattern References**:
  - `app/api/drafts/route.ts` - Drafts 핸들러 구현
  - `__tests__/mocks/handlers.ts:95-114` - Draft mock 데이터

  **API/Type References**:
  - `lib/types/post.ts:Draft` - Draft 타입 정의

  **Acceptance Criteria**:
  - [ ] `__tests__/api/drafts.test.ts` 파일 생성됨
  - [ ] GET /api/drafts 테스트 최소 2개 (성공, 인증실패)
  - [ ] POST /api/drafts 테스트 최소 2개 (성공, 인증실패)
  - [ ] 실행 명령: `npm test __tests__/api/drafts.test.ts` → Expected: 4+ tests passed

  **Commit**: YES
  - Message: `test: add Drafts API route handler tests`
  - Files: `__tests__/api/drafts.test.ts`
  - Pre-commit: `npm test`

---

- [ ] 5. Series API 테스트 작성

  **What to do**:
  - `__tests__/api/series.test.ts` 파일 생성
  - GET /api/series 테스트 (성공)
  - POST /api/series 테스트 (성공, 인증실패, 필수필드누락)
  - getAuthUser, prisma 모킹

  **Must NOT do**:
  - Series 개별 CRUD (별도 라우트)

  **Parallelizable**: YES (with 2, 3, 4)

  **References**:

  **Pattern References**:
  - `app/api/series/route.ts` - Series 핸들러 구현
  - `__tests__/mocks/handlers.ts:78-93` - Series mock 데이터

  **API/Type References**:
  - `lib/types/post.ts:Series` - Series 타입 정의

  **Acceptance Criteria**:
  - [ ] `__tests__/api/series.test.ts` 파일 생성됨
  - [ ] GET /api/series 테스트 최소 1개 (성공)
  - [ ] POST /api/series 테스트 최소 3개 (성공, 인증실패, 필수필드누락)
  - [ ] 실행 명령: `npm test __tests__/api/series.test.ts` → Expected: 4+ tests passed

  **Commit**: YES
  - Message: `test: add Series API route handler tests`
  - Files: `__tests__/api/series.test.ts`
  - Pre-commit: `npm test`

---

- [ ] 6. 전체 테스트 검증 및 정리

  **What to do**:
  - 전체 테스트 실행하여 통과 확인
  - 테스트 커버리지 확인
  - 불필요한 console.log 제거

  **Must NOT do**:
  - 추가 API 테스트 작성
  - 과도한 리팩토링

  **Parallelizable**: NO (모든 태스크 완료 후)

  **References**:

  **Pattern References**:
  - `package.json` - test 스크립트 확인
  - `vitest.config.ts` - coverage 설정

  **Acceptance Criteria**:
  - [ ] `npm test` → 모든 테스트 통과 (기존 13개 + 신규 ~20개)
  - [ ] `npm run test:run` → 30초 이내 완료
  - [ ] 테스트 실패 없음

  **Commit**: YES (필요시)
  - Message: `test: finalize API route tests and cleanup`
  - Files: 수정된 테스트 파일들
  - Pre-commit: `npm test`

---

## Commit Strategy

| After Task | Message                                                  | Files                          | Verification |
| ---------- | -------------------------------------------------------- | ------------------------------ | ------------ |
| 0          | `test: configure vitest environment for API route tests` | vitest.config.ts               | npm test     |
| 1          | `test: add Prisma mock for API route testing`            | **tests**/mocks/prisma.ts      | npm test     |
| 2          | `test: add Posts API route handler tests`                | **tests**/api/posts.test.ts    | npm test     |
| 3          | `test: add Comments API route handler tests`             | **tests**/api/comments.test.ts | npm test     |
| 4          | `test: add Drafts API route handler tests`               | **tests**/api/drafts.test.ts   | npm test     |
| 5          | `test: add Series API route handler tests`               | **tests**/api/series.test.ts   | npm test     |
| 6          | `test: finalize API route tests and cleanup`             | (필요시)                       | npm test     |

---

## Success Criteria

### Verification Commands

```bash
npm test                    # Expected: All tests pass
npm run test:run            # Expected: Complete in <30s
npm run test:coverage       # Expected: API routes covered
```

### Final Checklist

- [ ] 기존 13개 테스트 통과
- [ ] 신규 API 테스트 ~20개 추가
- [ ] Posts, Comments, Drafts, Series API 커버
- [ ] Prisma mock 정상 동작
- [ ] Node 환경에서 API 테스트 실행
