# iOS Standalone Mode Pull-to-Refresh 구현

## Context

### Original Request
- **Linear Issue**: BYU-237 - [Home] iOS 웹앱의 경우 PTR 구현하기
- **User Context**: iPhone에서 Chrome → "홈 화면 추가"로 블로그 사용 중
- **Problem**: Standalone 모드에서는 브라우저 UI가 없어서 새로고침 불가
- **Constraint**: PWA 설정(manifest, service worker) 없이 PTR만 구현

### Interview Summary
**Key Discussions**:
- iOS Safari standalone 모드에서는 native PTR이 명시적으로 비활성화됨
- 따라서 반드시 custom PTR 구현 필요
- iOS에서 Chrome "홈 화면 추가"는 실제로 Safari WebView로 열림

**Research Findings**:
- Standalone 감지: `window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches`
- 기존 코드베이스에 `SwipeDrawer.tsx` 터치 이벤트 패턴 존재
- 검증된 OSS 프로젝트들(frigate, zammad, DIM 등)에서 동일 패턴 사용

### Metis Review
**Identified Gaps** (addressed):
- 라이브러리 신뢰성 문제 → 커스텀 구현으로 변경
- 적용 범위 불명확 → 홈 페이지만 적용 (추후 확장 가능)
- 새로고침 방식 미정 → `router.refresh()` 사용
- Edge case 미고려 → debounce, offline 에러 처리 추가

---

## Work Objectives

### Core Objective
iOS "홈 화면 추가" standalone 모드에서 아래로 당겨서 새로고침할 수 있는 Pull-to-Refresh 기능 구현

### Concrete Deliverables
- `hooks/useStandaloneMode.ts` - Standalone 모드 감지 훅
- `hooks/usePullToRefresh.ts` - PTR 터치 로직 훅
- `components/common/PullToRefresh.tsx` - PTR 래퍼 컴포넌트
- `app/page.tsx` 수정 - 홈 페이지에 PTR 적용
- `app/globals.css` 수정 - PTR 관련 스타일

### Definition of Done
- [ ] Standalone 모드에서 홈 페이지 아래로 당기면 새로고침 동작
- [ ] 일반 브라우저에서는 PTR UI 미표시
- [ ] 기존 SwipeDrawer 기능 정상 동작
- [ ] `npm run build` 성공
- [ ] TypeScript 에러 없음

### Must Have
- Standalone 모드 감지 (iOS Safari + PWA display-mode)
- 스크롤 최상단에서만 PTR 트리거
- 새로고침 중 로딩 인디케이터
- 60fps 애니메이션
- debounce로 스팸 방지

### Must NOT Have (Guardrails)
- manifest.json 생성 금지
- Service Worker 등록 금지
- SwipeDrawer.tsx 수정 금지
- Admin 페이지 적용 금지
- 전역 터치 이벤트 핸들러 금지 (컴포넌트 스코프 내에서만)
- 외부 PTR 라이브러리 사용 금지 (신뢰성 문제)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: none

### If Manual QA Only

**CRITICAL**: 자동화된 테스트 없이 수동 검증 필수

**Evidence Required:**
- iOS 실기기 스크린샷/녹화
- 빌드 출력 로그
- 콘솔 에러 확인

---

## Task Flow

```
Task 1 (useStandaloneMode) 
    ↓
Task 2 (usePullToRefresh)
    ↓
Task 3 (PullToRefresh 컴포넌트)
    ↓
Task 4 (CSS 스타일)
    ↓
Task 5 (홈 페이지 적용)
    ↓
Task 6 (빌드 & 수동 QA)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | usePullToRefresh가 useStandaloneMode 사용 |
| 3 | 2 | 컴포넌트가 훅들 사용 |
| 4 | - | CSS는 독립적 (Task 3과 병렬 가능) |
| 5 | 3, 4 | 컴포넌트와 스타일 필요 |
| 6 | 5 | 적용 완료 후 테스트 |

---

## TODOs

- [ ] 1. Standalone 모드 감지 훅 생성

  **What to do**:
  - `hooks/useStandaloneMode.ts` 파일 생성
  - iOS Safari standalone (`window.navigator.standalone`) 감지
  - PWA display-mode standalone 감지
  - SSR 안전하게 처리 (typeof window 체크)

  **Must NOT do**:
  - window 객체 직접 접근 (SSR 에러)
  - 전역 상태 사용

  **Parallelizable**: NO (첫 번째 태스크)

  **References**:

  **Pattern References** (existing code to follow):
  - `components/ui/SwipeDrawer.tsx:19-21` - useSyncExternalStore를 사용한 SSR-safe mounted 체크 패턴
  - `components/ui/SwipeDrawer.tsx:145-149` - mounted 상태 체크 후 이벤트 리스너 등록 패턴

  **API/Type References** (contracts to implement):
  - `window.navigator.standalone` - iOS Safari 전용 프로퍼티 (boolean | undefined)
  - `window.matchMedia('(display-mode: standalone)')` - MediaQueryList 반환

  **External References**:
  - GitHub: `frigate/web/src/utils/isPWA.ts` - standalone 감지 참고 구현
  - GitHub: `zammad/app/frontend/shared/utils/pwa.ts` - Vue지만 동일 로직

  **WHY Each Reference Matters**:
  - SwipeDrawer의 mounted 패턴을 따라야 hydration mismatch 방지
  - OSS 프로젝트들의 검증된 standalone 감지 로직 활용

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 파일 생성 확인: `ls hooks/useStandaloneMode.ts`
  - [ ] TypeScript 에러 확인: `npx tsc --noEmit` → 에러 없음
  - [ ] 빌드 확인: `npm run build` → 성공

  **Commit**: YES
  - Message: `feat(hooks): add useStandaloneMode hook for iOS standalone detection`
  - Files: `hooks/useStandaloneMode.ts`
  - Pre-commit: `npm run build`

---

- [ ] 2. Pull-to-Refresh 터치 로직 훅 생성

  **What to do**:
  - `hooks/usePullToRefresh.ts` 파일 생성
  - touchstart, touchmove, touchend 이벤트 핸들링
  - 스크롤 위치 0에서만 PTR 활성화
  - pull distance 계산 및 threshold 체크
  - isRefreshing 상태 관리
  - debounce 적용 (연속 PTR 방지)
  - cleanup 함수로 메모리 누수 방지

  **Must NOT do**:
  - document에 전역 이벤트 리스너 등록 (컴포넌트 ref에만)
  - SwipeDrawer 터치 영역(오른쪽 30px)과 겹치는 로직
  - passive: false 남용 (성능 저하)

  **Parallelizable**: NO (Task 1 의존)

  **References**:

  **Pattern References** (existing code to follow):
  - `components/ui/SwipeDrawer.tsx:56-109` - touchstart/touchmove/touchend 핸들링 패턴
  - `components/ui/SwipeDrawer.tsx:151-158` - 이벤트 리스너 등록/해제 패턴 (passive 옵션 포함)
  - `components/ui/SwipeDrawer.tsx:45-46` - useRef로 터치 상태 관리 패턴

  **API/Type References**:
  - `TouchEvent.touches[0].clientY` - 터치 Y 좌표
  - `window.scrollY` - 현재 스크롤 위치

  **External References**:
  - GitHub 검색: `touchstart touchmove pull refresh` 패턴 참고
  - MDN: Touch events - passive 옵션 설명

  **WHY Each Reference Matters**:
  - SwipeDrawer의 터치 이벤트 패턴이 이미 검증되어 있음
  - passive 옵션 올바른 사용으로 스크롤 성능 유지

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 파일 생성 확인: `ls hooks/usePullToRefresh.ts`
  - [ ] TypeScript 에러 확인: `npx tsc --noEmit` → 에러 없음
  - [ ] 빌드 확인: `npm run build` → 성공

  **Commit**: YES
  - Message: `feat(hooks): add usePullToRefresh hook with touch gesture handling`
  - Files: `hooks/usePullToRefresh.ts`
  - Pre-commit: `npm run build`

---

- [ ] 3. PullToRefresh 래퍼 컴포넌트 생성

  **What to do**:
  - `components/common/PullToRefresh.tsx` 파일 생성
  - "use client" 디렉티브 추가
  - useStandaloneMode로 standalone 여부 체크
  - usePullToRefresh로 터치 로직 연결
  - 로딩 인디케이터 UI 구현 (iOS 스타일 스피너)
  - pull progress에 따른 인디케이터 위치/크기 변화
  - children을 래핑하는 구조

  **Must NOT do**:
  - standalone 아닐 때 불필요한 DOM 렌더링
  - 복잡한 애니메이션 (CSS transform만 사용)
  - 전역 스타일 오염

  **Parallelizable**: NO (Task 2 의존)

  **References**:

  **Pattern References** (existing code to follow):
  - `components/ui/SwipeDrawer.tsx:1` - "use client" 디렉티브
  - `components/ui/SwipeDrawer.tsx:31-32` - useSyncExternalStore로 mounted 체크
  - `components/ui/SwipeDrawer.tsx:177` - mounted 체크 후 early return null
  - `components/ui/SwipeDrawer.tsx:179-202` - createPortal 사용 (필요시 참고)

  **API/Type References**:
  - `React.ReactNode` - children 타입
  - Props interface 정의 필요: `{ children, onRefresh, disabled? }`

  **External References**:
  - CSS spinner: iOS ActivityIndicator 스타일 참고
  - framer-motion: `useSpring`, `useTransform` (선택적, SwipeDrawer 패턴)

  **WHY Each Reference Matters**:
  - SwipeDrawer와 일관된 코드 스타일 유지
  - Client component 패턴 동일하게 적용

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 파일 생성 확인: `ls components/common/PullToRefresh.tsx`
  - [ ] TypeScript 에러 확인: `npx tsc --noEmit` → 에러 없음
  - [ ] 빌드 확인: `npm run build` → 성공

  **Commit**: YES
  - Message: `feat(components): add PullToRefresh wrapper component`
  - Files: `components/common/PullToRefresh.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 4. PTR 관련 CSS 스타일 추가

  **What to do**:
  - `app/globals.css`에 PTR 관련 스타일 추가
  - iOS 스타일 스피너 애니메이션 (@keyframes spin)
  - pull indicator 위치/크기 스타일
  - dark mode 대응 (CSS 변수 또는 media query)
  - overscroll-behavior: none (PTR 영역에서 브라우저 기본 동작 방지)

  **Must NOT do**:
  - 기존 스타일 수정
  - !important 남용
  - 하드코딩된 색상 (CSS 변수 사용)

  **Parallelizable**: YES (Task 3과 병렬 가능)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/globals.css:488-506` - scrollbar 커스텀 스타일 패턴
  - `app/globals.css:121` - overflow 관련 스타일

  **External References**:
  - iOS HIG: Activity Indicator 스펙 (28px, 1s rotation)
  - `react-use-pull-to-refresh` README: CSS 변수 참고

  **WHY Each Reference Matters**:
  - 기존 globals.css 스타일 컨벤션 따라야 함
  - iOS 네이티브와 유사한 UX 제공

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 스타일 추가 확인: `grep "ptr-" app/globals.css` → 매칭 결과 있음
  - [ ] 빌드 확인: `npm run build` → 성공

  **Commit**: YES
  - Message: `style: add pull-to-refresh indicator styles`
  - Files: `app/globals.css`
  - Pre-commit: `npm run build`

---

- [ ] 5. 홈 페이지에 PullToRefresh 적용

  **What to do**:
  - `app/page.tsx`를 Client Component로 분리 필요 여부 검토
  - PullToRefresh 컴포넌트로 콘텐츠 래핑
  - onRefresh 콜백에서 `router.refresh()` 호출
  - 또는 별도의 Client 래퍼 컴포넌트 생성

  **Must NOT do**:
  - Server Component의 metadata, revalidate 설정 제거
  - 기존 AdSense, Suspense 구조 변경
  - 불필요한 re-render 유발

  **Parallelizable**: NO (Task 3, 4 의존)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/page.tsx:22-36` - 현재 홈 페이지 구조
  - `app/layout.tsx:159-165` - main 콘텐츠 래핑 구조
  - `components/post/PostActions.tsx:46` - `router.refresh()` 사용 패턴

  **API/Type References**:
  - `next/navigation`: `useRouter` - refresh() 메서드
  - React Query: 필요시 `invalidateQueries` (현재는 router.refresh로 충분)

  **WHY Each Reference Matters**:
  - 기존 Server Component 구조 유지하면서 PTR 추가해야 함
  - PostActions에서 이미 router.refresh() 패턴 사용 중

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 파일 수정 확인: `git diff app/page.tsx` → PullToRefresh import 확인
  - [ ] 빌드 확인: `npm run build` → 성공
  - [ ] 로컬 테스트: `npm run dev` → 홈 페이지 정상 로드

  **Commit**: YES
  - Message: `feat(home): integrate PullToRefresh on home page`
  - Files: `app/page.tsx` (또는 새 래퍼 컴포넌트)
  - Pre-commit: `npm run build`

---

- [ ] 6. 빌드 확인 및 수동 QA

  **What to do**:
  - 전체 빌드 성공 확인
  - Vercel Preview 배포 후 실기기 테스트
  - iOS Safari standalone 모드에서 PTR 동작 확인
  - 일반 브라우저에서 PTR UI 미표시 확인
  - SwipeDrawer와 충돌 없음 확인

  **Must NOT do**:
  - 테스트 없이 main 브랜치 머지
  - 시뮬레이터만으로 테스트 완료 처리 (실기기 필수)

  **Parallelizable**: NO (마지막 태스크)

  **References**:

  **Test Scenarios**:
  1. iPhone Safari → 설정 → 홈 화면에 추가 → 앱 실행
  2. 홈 페이지에서 아래로 당기기 → 스피너 표시 → 새로고침
  3. 스크롤 후 당기기 → PTR 미작동 확인
  4. SwipeDrawer 열기 → 정상 동작 확인
  5. Desktop Chrome → PTR UI 미표시 확인

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 빌드: `npm run build` → 성공
  - [ ] Using Playwright browser (선택적):
    - Navigate to: Vercel Preview URL
    - Action: 페이지 로드 확인
    - Screenshot: `.sisyphus/evidence/ptr-desktop.png`
  - [ ] iOS 실기기 테스트 (필수):
    - Standalone 모드에서 PTR 동작: 스크린샷/녹화
    - 일반 Safari에서 PTR UI 미표시: 스크린샷

  **Commit**: NO (테스트 태스크)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(hooks): add useStandaloneMode hook for iOS standalone detection` | hooks/useStandaloneMode.ts | npm run build |
| 2 | `feat(hooks): add usePullToRefresh hook with touch gesture handling` | hooks/usePullToRefresh.ts | npm run build |
| 3 | `feat(components): add PullToRefresh wrapper component` | components/common/PullToRefresh.tsx | npm run build |
| 4 | `style: add pull-to-refresh indicator styles` | app/globals.css | npm run build |
| 5 | `feat(home): integrate PullToRefresh on home page` | app/page.tsx (또는 래퍼) | npm run build |

---

## Success Criteria

### Verification Commands
```bash
# 빌드 확인
npm run build  # Expected: 성공, 에러 없음

# TypeScript 체크
npx tsc --noEmit  # Expected: 에러 없음

# 로컬 개발 서버
npm run dev  # Expected: 정상 실행
```

### Final Checklist
- [ ] Standalone 모드에서 PTR 동작 (iOS 실기기)
- [ ] 일반 브라우저에서 PTR UI 미표시
- [ ] 기존 SwipeDrawer 정상 동작
- [ ] 빌드 성공
- [ ] TypeScript 에러 없음
- [ ] manifest.json 없음 확인
- [ ] Service Worker 없음 확인
