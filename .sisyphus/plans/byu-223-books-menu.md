# BYU-223: 내가 읽은 책 메뉴

## Context

### Original Request

> [신메뉴] 내가 읽은 책만 모아놓은 메뉴
> 각 도서를 클릭하면 관련글 목록도 보임

### Interview Summary

**Key Discussions**:

- Book 모델: DB에 생성 (title, author, coverImage, readAt, summary)
- Book-Post 관계: 1책 = N글 (외래키, Post.bookId optional)
- 메뉴 위치: 헤더 내비게이션
- 접근 권한: 공개 (모든 방문자)
- 책 관리: /books 페이지에서 추가/수정 (관리자용 버튼)
- 관련글 표시: /books/[slug] 별도 상세 페이지
- 테스트 전략: TDD with vitest

**Research Findings**:

- 현재 DB에 Book 모델 없음 (완전 새로 생성)
- Series 패턴 참조 가능 (`app/api/series/route.ts`, `app/series/page.tsx`)
- Header.tsx에 `navItems` 배열로 메뉴 관리 (line 33-40)
- vitest + mockPrisma 테스트 인프라 존재

### Metis Review

**Identified Gaps** (addressed):

- Book.slug 필요 여부 → YES, Series 패턴 따라 slug 추가
- readAt 필드 타입 → DateTime (정확한 날짜, 가장 유연)
- coverImage 저장 방식 → URL 입력만 (scope 유지)
- 책 삭제 시 Post.bookId 처리 → onDelete: SetNull (안전)
- 관련글 표시 방식 → 별도 상세 페이지 /books/[slug]

---

## Work Objectives

### Core Objective

내가 읽은 책 목록을 보여주는 /books 페이지와 책별 상세 페이지(/books/[slug])를 구현하여, 방문자가 책과 관련 글을 쉽게 탐색할 수 있게 한다.

### Concrete Deliverables

- `prisma/schema.prisma`: Book 모델 추가, Post에 bookId 외래키 추가
- `app/api/books/route.ts`: GET(목록), POST(생성) API
- `app/api/books/[id]/route.ts`: GET(상세), PUT(수정), DELETE(삭제) API
- `app/books/page.tsx`: 책 목록 페이지
- `app/books/[slug]/page.tsx`: 책 상세 페이지 (관련글 목록 포함)
- `components/layout/Header.tsx`: '책' 메뉴 추가
- `components/books/BookCard.tsx`: 책 카드 컴포넌트
- `components/books/BookFormModal.tsx`: 책 추가/수정 모달
- `__tests__/api/books.test.ts`: API 테스트

### Definition of Done

- [ ] `npm run build` 성공
- [ ] `npm test -- --run __tests__/api/books.test.ts` 전체 통과
- [ ] /books 페이지에서 책 목록 확인 가능
- [ ] 책 클릭 시 /books/[slug] 상세 페이지로 이동
- [ ] 상세 페이지에서 관련글 목록 표시
- [ ] 관리자만 책 추가/수정/삭제 가능

### Must Have

- Book 모델: id, title, author, slug, coverImage, readAt, summary, createdAt, updatedAt
- Post.bookId 외래키 (optional, onDelete: SetNull)
- /books 목록 페이지 (공개)
- /books/[slug] 상세 페이지 (관련글 목록)
- 헤더에 '책' 메뉴
- 관리자용 CRUD 기능
- TDD 테스트

### Must NOT Have (Guardrails)

- ❌ 책 검색/필터 기능 (v2)
- ❌ 책 카테고리/장르 분류 (v2)
- ❌ 외부 API 연동 (Google Books, Open Library)
- ❌ 이미지 업로드 기능 (URL 입력만)
- ❌ 글 작성 시 책 선택 UI (별도 이슈)
- ❌ 통계/분석 (조회수, 인기 순위)
- ❌ Book 모델에 ISBN, 출판사, 페이지수 등 추가 필드

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (vitest + @testing-library)
- **User wants tests**: TDD
- **Framework**: vitest

### TDD Workflow

Each TODO follows RED-GREEN-REFACTOR:

**Task Structure:**

1. **RED**: Write failing test first
   - Test file: `__tests__/api/books.test.ts`
   - Test command: `npm test -- --run __tests__/api/books.test.ts`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `npm test -- --run __tests__/api/books.test.ts`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `npm test -- --run __tests__/api/books.test.ts`
   - Expected: PASS (still)

---

## Task Flow

```
Task 0 (DB Schema)
       ↓
Task 1 (Mock Setup)
       ↓
Task 2-5 (API Tests + Implementation) → parallel within CRUD
       ↓
Task 6 (Books List Page)
       ↓
Task 7 (Book Detail Page)
       ↓
Task 8 (Header Menu)
       ↓
Task 9 (Book Form Modal)
       ↓
Task 10 (Integration)
```

## Parallelization

| Group | Tasks | Reason                   |
| ----- | ----- | ------------------------ |
| A     | 2, 3  | GET list와 POST는 독립적 |
| B     | 4, 5  | PUT과 DELETE는 독립적    |

| Task | Depends On | Reason                    |
| ---- | ---------- | ------------------------- |
| 1    | 0          | Mock에 Book 모델 필요     |
| 2-5  | 1          | 테스트에 Mock 필요        |
| 6    | 2          | 페이지에 API 필요         |
| 7    | 6          | 상세 페이지는 목록 다음   |
| 8    | 6          | 메뉴는 페이지 있어야 의미 |
| 9    | 6          | 모달은 페이지에서 사용    |
| 10   | All        | 통합 검증                 |

---

## TODOs

- [x] 0. Prisma Schema 업데이트 - Book 모델 추가

  **What to do**:
  - Book 모델 생성: id, title, author, slug(unique), coverImage, readAt, summary, createdAt, updatedAt
  - Post 모델에 bookId 필드 추가 (optional)
  - Book-Post 관계 설정 (1:N, onDelete: SetNull)
  - `@@index([bookId])` 추가
  - Migration 실행: `npx prisma migrate dev --name add_book_model`

  **Must NOT do**:
  - ISBN, 출판사, 페이지수 등 추가 필드 넣지 않기
  - category, genre 필드 추가하지 않기

  **Parallelizable**: NO (첫 번째 작업)

  **References**:
  - `prisma/schema.prisma:42-50` - Series 모델 구조 (slug, unique 패턴)
  - `prisma/schema.prisma:11-40` - Post 모델 (외래키 추가 위치)
  - `AGENTS.md:Database Environment` - Prisma migration 워크플로우

  **Acceptance Criteria**:
  - [ ] `npx prisma migrate dev --name add_book_model` 성공
  - [ ] `npx prisma generate` 성공
  - [ ] Prisma Studio에서 Book 테이블 확인 가능

  **Commit**: YES
  - Message: `feat(db): add Book model and Post.bookId relation`
  - Files: `prisma/schema.prisma`, `prisma/migrations/*`
  - Pre-commit: `npx prisma validate`

---

- [x] 1. Mock Prisma에 Book 모델 추가

  **What to do**:
  - `__tests__/mocks/prisma.ts`에 book 모델 mock 추가
  - findMany, findUnique, findFirst, create, update, delete 메서드 포함

  **Must NOT do**:
  - 실제 DB 연결하지 않기

  **Parallelizable**: NO (depends on 0)

  **References**:
  - `__tests__/mocks/prisma.ts` - 기존 mock 구조 (series, post 등)
  - `__tests__/api/series.test.ts:1-30` - mock import 패턴

  **Acceptance Criteria**:
  - [ ] mockPrisma.book 객체 존재
  - [ ] TypeScript 타입 에러 없음

  **Commit**: YES (with Task 2)
  - Message: `test(books): add book mock and GET list test`
  - Files: `__tests__/mocks/prisma.ts`

---

- [x] 2. [TDD] GET /api/books - 책 목록 조회

  **What to do**:
  - **RED**: `__tests__/api/books.test.ts` 생성, GET 목록 테스트 작성
    - 성공 케이스: 책 목록 반환 (관련글 수 포함)
    - 빈 목록 케이스: 빈 배열 반환
  - **GREEN**: `app/api/books/route.ts` GET 핸들러 구현
    - Book 목록 조회 (posts.\_count 포함)
    - readAt DESC 정렬
  - **REFACTOR**: 코드 정리

  **Must NOT do**:
  - 검색/필터 파라미터 추가하지 않기
  - 페이지네이션 구현하지 않기

  **Parallelizable**: YES (with Task 3)

  **References**:
  - `app/api/series/route.ts:8-25` - GET 핸들러 패턴
  - `__tests__/api/series.test.ts:20-60` - GET 테스트 패턴
  - `lib/api/errors.ts` - ApiError, handleApiError 사용법

  **Acceptance Criteria**:
  - [ ] **RED**: `npm test -- --run __tests__/api/books.test.ts` → GET 테스트 FAIL
  - [ ] **GREEN**: 같은 명령 → GET 테스트 PASS
  - [ ] curl 확인: `curl http://localhost:3000/api/books` → 200 + JSON 배열

  **Commit**: YES
  - Message: `feat(api): add GET /api/books endpoint with tests`
  - Files: `app/api/books/route.ts`, `__tests__/api/books.test.ts`
  - Pre-commit: `npm test -- --run __tests__/api/books.test.ts`

---

- [x] 3. [TDD] POST /api/books - 책 생성

  **What to do**:
  - **RED**: POST 테스트 작성
    - 성공 케이스: 책 생성 + 201 반환
    - 인증 실패: 401 반환
    - 유효성 검사 실패: 400 반환 (title 필수)
    - 중복 slug: 409 반환
  - **GREEN**: `app/api/books/route.ts` POST 핸들러 구현
    - getAuthUser()로 관리자 확인
    - title로 slug 자동 생성
    - 중복 slug 시 숫자 suffix 추가
  - **REFACTOR**: 코드 정리

  **Must NOT do**:
  - 이미지 업로드 처리하지 않기 (URL만 받기)

  **Parallelizable**: YES (with Task 2)

  **References**:
  - `app/api/series/route.ts:27-55` - POST 핸들러 패턴 (인증 체크)
  - `__tests__/api/series.test.ts:62-120` - POST 테스트 패턴
  - `lib/api/errors.ts:ApiError.unauthorized()` - 401 에러

  **Acceptance Criteria**:
  - [ ] **RED**: POST 테스트 FAIL
  - [ ] **GREEN**: POST 테스트 PASS
  - [ ] 비인증 요청 시 401 반환
  - [ ] title 없이 요청 시 400 반환

  **Commit**: YES
  - Message: `feat(api): add POST /api/books endpoint with auth`
  - Files: `app/api/books/route.ts`, `__tests__/api/books.test.ts`
  - Pre-commit: `npm test -- --run __tests__/api/books.test.ts`

---

- [x] 4. [TDD] GET/PUT /api/books/[id] - 책 상세 조회 및 수정

  **What to do**:
  - **RED**: 테스트 작성
    - GET 성공: 책 상세 + 관련 posts 반환
    - GET 404: 존재하지 않는 책
    - PUT 성공: 책 수정
    - PUT 401: 비인증
    - PUT 404: 존재하지 않는 책
  - **GREEN**: `app/api/books/[id]/route.ts` 구현
  - **REFACTOR**: 코드 정리

  **Must NOT do**:
  - 관련 posts 수정하지 않기

  **Parallelizable**: YES (with Task 5)

  **References**:
  - `app/api/series/[id]/route.ts` - 상세 API 패턴 (존재 시)
  - `__tests__/api/series.test.ts` - 상세 테스트 패턴

  **Acceptance Criteria**:
  - [ ] **RED**: GET/PUT 테스트 FAIL
  - [ ] **GREEN**: GET/PUT 테스트 PASS
  - [ ] GET: 책 정보 + 관련 posts 배열 반환

  **Commit**: YES
  - Message: `feat(api): add GET/PUT /api/books/[id] endpoints`
  - Files: `app/api/books/[id]/route.ts`, `__tests__/api/books.test.ts`
  - Pre-commit: `npm test -- --run __tests__/api/books.test.ts`

---

- [x] 5. [TDD] DELETE /api/books/[id] - 책 삭제

  **What to do**:
  - **RED**: DELETE 테스트 작성
    - 성공: 204 반환
    - 401: 비인증
    - 404: 존재하지 않는 책
  - **GREEN**: DELETE 핸들러 구현
    - 관련 Post.bookId는 자동으로 null 설정 (onDelete: SetNull)
  - **REFACTOR**: 코드 정리

  **Must NOT do**:
  - 관련 Post 삭제하지 않기 (SetNull만)

  **Parallelizable**: YES (with Task 4)

  **References**:
  - `app/api/series/[id]/route.ts` - DELETE 패턴
  - Prisma onDelete: SetNull 동작 확인

  **Acceptance Criteria**:
  - [ ] **RED**: DELETE 테스트 FAIL
  - [ ] **GREEN**: DELETE 테스트 PASS
  - [ ] 삭제 후 관련 Post.bookId가 null인지 확인

  **Commit**: YES
  - Message: `feat(api): add DELETE /api/books/[id] endpoint`
  - Files: `app/api/books/[id]/route.ts`, `__tests__/api/books.test.ts`
  - Pre-commit: `npm test -- --run __tests__/api/books.test.ts`

---

- [x] 6. /books 페이지 - 책 목록

  **What to do**:
  - `app/books/page.tsx` 생성 (Server Component)
  - 책 목록 그리드 레이아웃
  - BookCard 컴포넌트 생성 (coverImage, title, author, 관련글 수)
  - 빈 상태 UI: "아직 등록된 책이 없습니다"
  - 관리자에게만 "책 추가" 버튼 표시
  - Metadata 설정

  **Must NOT do**:
  - 검색/필터 UI 추가하지 않기
  - 무한 스크롤/페이지네이션 추가하지 않기

  **Parallelizable**: NO (depends on 2)

  **References**:
  - `app/series/page.tsx` - 목록 페이지 구조, Metadata 패턴
  - `components/series/SeriesCard.tsx` - 카드 컴포넌트 패턴 (존재 시)
  - `app/page.tsx` - 메인 페이지 레이아웃 참조

  **Acceptance Criteria**:
  - [ ] `/books` 접근 시 책 목록 표시
  - [ ] 각 책에 coverImage, title, author, 관련글 수 표시
  - [ ] 책이 없을 때 빈 상태 메시지 표시
  - [ ] 관리자 로그인 시 "책 추가" 버튼 표시

  **Manual Verification**:
  - [ ] 브라우저에서 `http://localhost:3000/books` 접근
  - [ ] 책 카드 클릭 시 `/books/[slug]`로 이동 확인

  **Commit**: YES
  - Message: `feat(books): add books list page with BookCard component`
  - Files: `app/books/page.tsx`, `components/books/BookCard.tsx`
  - Pre-commit: `npm run build`

---

- [x] 7. /books/[slug] 페이지 - 책 상세 + 관련글

  **What to do**:
  - `app/books/[slug]/page.tsx` 생성 (Server Component)
  - 책 상세 정보 (coverImage, title, author, readAt, summary)
  - 관련글 목록 표시 (PostCard 재사용 또는 간단한 목록)
  - 관련글 없을 때: "이 책과 관련된 글이 없습니다"
  - 관리자에게만 "수정", "삭제" 버튼 표시
  - generateMetadata로 SEO 최적화

  **Must NOT do**:
  - 관련글 페이지네이션 추가하지 않기

  **Parallelizable**: NO (depends on 6)

  **References**:
  - `app/series/[slug]/page.tsx` - 상세 페이지 패턴 (존재 시)
  - `app/[slug]/page.tsx` - Post 상세 페이지 구조
  - `components/post/PostCard.tsx` - 글 카드 컴포넌트

  **Acceptance Criteria**:
  - [ ] `/books/[slug]` 접근 시 책 상세 정보 표시
  - [ ] 관련글 목록 표시 (또는 "관련글 없음" 메시지)
  - [ ] 관리자 로그인 시 수정/삭제 버튼 표시
  - [ ] 존재하지 않는 slug 시 404 페이지

  **Manual Verification**:
  - [ ] 브라우저에서 책 상세 페이지 접근
  - [ ] 관련글 클릭 시 해당 글로 이동 확인

  **Commit**: YES
  - Message: `feat(books): add book detail page with related posts`
  - Files: `app/books/[slug]/page.tsx`
  - Pre-commit: `npm run build`

---

- [x] 8. Header에 '책' 메뉴 추가

  **What to do**:
  - `components/layout/Header.tsx`의 navItems 배열에 '책' 추가
  - 경로: `/books`
  - 아이콘: Book 또는 BookOpen (lucide-react)

  **Must NOT do**:
  - 헤더 구조 대폭 변경하지 않기

  **Parallelizable**: NO (depends on 6)

  **References**:
  - `components/layout/Header.tsx:33-40` - navItems 배열 위치
  - lucide-react Book, BookOpen 아이콘

  **Acceptance Criteria**:
  - [ ] 헤더에 '책' 메뉴 표시
  - [ ] 클릭 시 `/books`로 이동
  - [ ] 현재 페이지가 /books일 때 active 스타일 적용

  **Manual Verification**:
  - [ ] 모든 페이지에서 헤더의 '책' 메뉴 확인
  - [ ] 모바일에서도 메뉴 표시 확인

  **Commit**: YES
  - Message: `feat(nav): add Books menu to header navigation`
  - Files: `components/layout/Header.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 9. BookFormModal - 책 추가/수정 모달

  **What to do**:
  - `components/books/BookFormModal.tsx` 생성
  - 입력 필드: title(필수), author, coverImage(URL), readAt, summary
  - 추가 모드 / 수정 모드 지원
  - react-hook-form + zod validation
  - 저장 시 API 호출 (POST or PUT)
  - 삭제 확인 모달 (수정 모드에서)

  **Must NOT do**:
  - 이미지 업로드 기능 구현하지 않기

  **Parallelizable**: NO (depends on 6)

  **References**:
  - `components/modals/AboutEditModal.tsx` - 모달 패턴
  - `components/ui/Dialog.tsx` - Dialog 컴포넌트
  - `lib/validations/` - zod 스키마 패턴 (존재 시)

  **Acceptance Criteria**:
  - [ ] "책 추가" 클릭 시 빈 폼 모달 표시
  - [ ] "수정" 클릭 시 기존 데이터로 채워진 모달 표시
  - [ ] title 없이 저장 시 validation 에러
  - [ ] 저장 성공 시 목록 새로고침

  **Manual Verification**:
  - [ ] 책 추가 후 목록에 표시 확인
  - [ ] 책 수정 후 변경사항 반영 확인
  - [ ] 책 삭제 후 목록에서 제거 확인

  **Commit**: YES
  - Message: `feat(books): add BookFormModal for CRUD operations`
  - Files: `components/books/BookFormModal.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 10. 통합 테스트 및 최종 검증

  **What to do**:
  - 전체 플로우 수동 테스트
  - E2E 시나리오:
    1. /books 접근 (빈 상태)
    2. 관리자 로그인
    3. 책 추가
    4. 목록에서 확인
    5. 상세 페이지 이동
    6. 책 수정
    7. 책 삭제
  - 빌드 확인: `npm run build`
  - 테스트 확인: `npm test`

  **Must NOT do**:
  - 새 기능 추가하지 않기

  **Parallelizable**: NO (마지막)

  **References**:
  - 모든 이전 Task

  **Acceptance Criteria**:
  - [ ] `npm run build` 성공
  - [ ] `npm test` 전체 통과
  - [ ] E2E 시나리오 수동 통과

  **Commit**: NO (이미 완료된 커밋들로 충분)

---

## Commit Strategy

| After Task | Message                                                | Files                              | Verification          |
| ---------- | ------------------------------------------------------ | ---------------------------------- | --------------------- |
| 0          | `feat(db): add Book model and Post.bookId relation`    | prisma/\*                          | `npx prisma validate` |
| 1+2        | `feat(api): add GET /api/books endpoint with tests`    | api/books/_, tests/_               | `npm test`            |
| 3          | `feat(api): add POST /api/books endpoint with auth`    | api/books/\*                       | `npm test`            |
| 4          | `feat(api): add GET/PUT /api/books/[id] endpoints`     | api/books/[id]/\*                  | `npm test`            |
| 5          | `feat(api): add DELETE /api/books/[id] endpoint`       | api/books/[id]/\*                  | `npm test`            |
| 6          | `feat(books): add books list page with BookCard`       | app/books/_, components/books/_    | `npm run build`       |
| 7          | `feat(books): add book detail page with related posts` | app/books/[slug]/\*                | `npm run build`       |
| 8          | `feat(nav): add Books menu to header navigation`       | components/layout/Header.tsx       | `npm run build`       |
| 9          | `feat(books): add BookFormModal for CRUD operations`   | components/books/BookFormModal.tsx | `npm run build`       |

---

## Success Criteria

### Verification Commands

```bash
npm run build        # Expected: 빌드 성공
npm test             # Expected: 전체 테스트 통과
npm run dev          # Expected: 서버 정상 실행
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] /books 페이지 정상 동작
- [ ] /books/[slug] 상세 페이지 정상 동작
- [ ] 헤더에 '책' 메뉴 표시
- [ ] 관리자 CRUD 기능 동작
