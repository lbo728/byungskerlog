# BYU-43: SEO 빡시게 잡기

## Context

### Original Request

Linear 이슈 BYU-43 - SEO 최적화 작업. 한글 검색어로 사이트가 검색 상단에 노출되도록 개선.

### Interview Summary

**사용자 요청**:

1. 사이트 설명에서 '이병우'를 '병스커'로 변경
2. 검색어 최적화: '병스커로그', '병스커', '기술블로그', '개발블로그', '병로그' 검색 시 상단 노출
3. 기존 SEO audit에서 발견된 이슈 수정

**현재 상태**:

- Google 검색: "byungskerlog" → 검색됨, "병스커로그" → 미노출
- Naver 검색: 유사한 상황
- '이병우' 텍스트가 7개 파일에 19곳 존재

### Branch Strategy

```
dev
 └── daily/2026-01-24
      └── feature/byu-43-seo-optimization (현재 브랜치)
```

---

## Work Objectives

### Core Objective

한글 검색어(병스커로그, 병스커, 기술블로그 등)로 검색 시 사이트가 Google/Naver 상단에 노출되도록 SEO 최적화

### Concrete Deliverables

- 7개 파일에서 '이병우' → '병스커' 변경
- keywords 메타데이터 강화
- Sitemap 확장 (short posts, series, products 포함)
- RSS Feed 구현
- og-image.png 생성

### Definition of Done

- [ ] `grep -r "이병우" app/ components/` 결과 0건
- [ ] sitemap.xml에 /short/_, /series/_, /products 포함
- [ ] /feed.xml 접근 가능
- [ ] /og-image.png 파일 존재

### Must Have

- 모든 '이병우' 텍스트 → '병스커' 변경
- 한글 검색 키워드 메타데이터 강화
- sitemap 완전성

### Must NOT Have (Guardrails)

- 영문 브랜드명 "Byungsker" 변경 금지
- 기존 SEO 설정 삭제 금지
- 불필요한 키워드 스팸 금지

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO (수동 검증)
- **User wants tests**: Manual-only
- **QA approach**: 수동 검증 + curl 테스트

---

## Task Flow

```
Task 1 (이병우→병스커) → Task 2 (키워드 강화)
                           ↓
Task 3 (Sitemap) ←→ Task 4 (RSS Feed) [parallel]
                           ↓
                      Task 5 (og-image)
                           ↓
                      Task 6 (커밋)
```

## Parallelization

| Group | Tasks | Reason             |
| ----- | ----- | ------------------ |
| A     | 3, 4  | 독립적인 기능 추가 |

| Task | Depends On | Reason                               |
| ---- | ---------- | ------------------------------------ |
| 2    | 1          | 키워드 강화 전 텍스트 변경 완료 필요 |
| 5    | -          | 독립적                               |
| 6    | 1-5        | 모든 변경사항 완료 후 커밋           |

---

## TODOs

- [ ] 1. '이병우'를 '병스커'로 변경 (7개 파일)

  **What to do**:
  - `app/layout.tsx`:
    - line 36: "이병우의 기술 블로그" → "병스커의 기술 블로그"
    - line 42: keywords에서 "이병우" 제거
    - line 51-53: authors/creator/publisher "이병우 (Byungsker)" → "병스커 (Byungsker)"
    - line 67: OG description 변경
    - line 80: Twitter description 변경
  - `app/page.tsx`:
    - line 13: "이병우의 기술 블로그" → "병스커의 기술 블로그"
  - `app/about/page.tsx`:
    - line 15, 21: "이병우(Byungsker)" → "병스커(Byungsker)"
    - line 76: Person schema name 변경
  - `app/posts/[slug]/page.tsx`:
    - line 60, 71: authors 변경
  - `app/short/[slug]/page.tsx`:
    - line 62, 73: authors 변경
  - `app/feed.xml/route.ts`:
    - line 50: description 변경
  - `components/seo/StructuredData.tsx`:
    - line 50, 68: description 변경
    - line 93: author name 변경

  **Must NOT do**:
  - "Byungsker" 영문명 변경 금지
  - "@byungsker" 트위터 핸들 변경 금지

  **Parallelizable**: NO (기본 작업)

  **References**:
  - `app/layout.tsx:36-80` - 메인 메타데이터
  - `components/seo/StructuredData.tsx:50-93` - 구조화 데이터

  **Acceptance Criteria**:
  - [ ] `grep -r "이병우" app/ components/ --include="*.tsx" --include="*.ts"` → 0건
  - [ ] 빌드 성공: `npm run build` (에러 없음)

  **Commit**: YES
  - Message: `fix(seo): replace 이병우 with 병스커 across site metadata`
  - Files: `app/layout.tsx`, `app/page.tsx`, `app/about/page.tsx`, `app/posts/[slug]/page.tsx`, `app/short/[slug]/page.tsx`, `app/feed.xml/route.ts`, `components/seo/StructuredData.tsx`

---

- [ ] 2. 검색 키워드 메타데이터 강화

  **What to do**:
  - `app/layout.tsx` keywords 배열 수정:
    ```typescript
    keywords: [
      // 핵심 브랜드 키워드 (최상단 배치)
      "병스커",
      "Byungsker",
      "병스커로그",
      "byungskerlog",
      "병스커 블로그",
      "byungsker 블로그",
      "병로그",
      // 카테고리 키워드
      "기술블로그",
      "개발블로그",
      "기술 블로그",
      "개발 블로그",
      // 주제 키워드
      "소프트웨어 개발",
      "제품 주도 개발",
      "Product-Led Development",
      "스타트업",
      "프론트엔드",
      "웹개발",
      "Next.js",
      "React",
      "TypeScript",
    ],
    ```
  - Title template 수정: `"%s"` → `"%s | Byungsker Log"`
  - OG/Twitter title 일관성 확인

  **Must NOT do**:
  - 50개 이상 키워드 추가 (스팸으로 인식될 수 있음)

  **Parallelizable**: NO (Task 1 완료 후)

  **References**:
  - `app/layout.tsx:37-50` - 현재 keywords 배열
  - `app/layout.tsx:31-34` - title template

  **Acceptance Criteria**:
  - [ ] keywords 배열에 "병스커로그", "기술블로그", "개발블로그", "병로그" 포함
  - [ ] title template이 사이트명 포함

  **Commit**: YES
  - Message: `feat(seo): enhance Korean search keywords for better discoverability`
  - Files: `app/layout.tsx`

---

- [ ] 3. Sitemap 확장

  **What to do**:
  - `app/sitemap.ts` 수정:
    1. 정적 페이지에 `/short-posts`, `/series`, `/products` 추가
    2. Short posts 동적 URL 추가 (type: "SHORT")
    3. Series 동적 URL 추가

  ```typescript
  // 추가할 정적 페이지
  { url: `${siteUrl}/short-posts`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  { url: `${siteUrl}/series`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  { url: `${siteUrl}/products`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },

  // Short posts 쿼리
  const shortPosts = await prisma.post.findMany({
    where: { published: true, type: "SHORT" },
    select: { slug: true, updatedAt: true },
  });

  // Series 쿼리
  const series = await prisma.series.findMany({
    select: { slug: true, updatedAt: true },
  });
  ```

  **Must NOT do**:
  - 비공개 포스트 포함 금지
  - /admin, /api 경로 포함 금지

  **Parallelizable**: YES (with Task 4)

  **References**:
  - `app/sitemap.ts` - 현재 sitemap 구현
  - `prisma/schema.prisma` - Post, Series 모델

  **Acceptance Criteria**:
  - [ ] `curl https://byungskerlog.vercel.app/sitemap.xml | grep short-posts` → 존재
  - [ ] `curl https://byungskerlog.vercel.app/sitemap.xml | grep series` → 존재
  - [ ] `curl https://byungskerlog.vercel.app/sitemap.xml | grep products` → 존재

  **Commit**: YES
  - Message: `feat(seo): expand sitemap to include short posts, series, and products`
  - Files: `app/sitemap.ts`

---

- [ ] 4. RSS Feed 구현 (이미 존재하면 확인만)

  **What to do**:
  - `app/feed.xml/route.ts` 파일 확인/생성
  - RSS 2.0 표준 준수
  - 최근 20개 포스트 포함
  - llms.txt에 명시된 URL과 일치 확인

  **Must NOT do**:
  - 비공개 포스트 포함 금지

  **Parallelizable**: YES (with Task 3)

  **References**:
  - `app/feed.xml/route.ts` - 이미 존재할 수 있음
  - `public/llms.txt:51` - RSS URL 참조

  **Acceptance Criteria**:
  - [ ] `curl https://byungskerlog.vercel.app/feed.xml` → 유효한 RSS XML 반환
  - [ ] XML 내 `<channel>`, `<item>` 요소 존재

  **Commit**: YES (새로 생성한 경우)
  - Message: `feat(seo): implement RSS feed for blog posts`
  - Files: `app/feed.xml/route.ts`

---

- [ ] 5. og-image.png 생성/확인

  **What to do**:
  - `public/og-image.png` 파일 존재 확인
  - 없으면 `public/img-og-logo.png`를 복사하거나 새로 생성
  - 또는 `app/layout.tsx`의 OG image URL을 동적 생성기로 변경

  **References**:
  - `public/` 폴더 - 현재 이미지 파일들
  - `app/opengraph-image.tsx` - 동적 OG 이미지 생성기

  **Acceptance Criteria**:
  - [ ] `/og-image.png` 접근 가능 또는 동적 생성 확인

  **Commit**: YES
  - Message: `fix(seo): ensure og-image.png exists for social sharing`
  - Files: `public/og-image.png` 또는 `app/layout.tsx`

---

- [ ] 6. 검증 및 최종 커밋

  **What to do**:
  - `npm run build` 실행하여 빌드 성공 확인
  - 로컬에서 sitemap.xml 확인
  - 모든 변경사항 검토

  **Acceptance Criteria**:
  - [ ] 빌드 성공
  - [ ] 모든 TODO 완료

  **Commit**: NO (이미 개별 커밋 완료)

---

## Commit Strategy

| After Task | Message                                                                  | Files                     | Verification |
| ---------- | ------------------------------------------------------------------------ | ------------------------- | ------------ |
| 1          | `fix(seo): replace 이병우 with 병스커 across site metadata`              | 7 files                   | grep 검증    |
| 2          | `feat(seo): enhance Korean search keywords for better discoverability`   | layout.tsx                | 빌드         |
| 3          | `feat(seo): expand sitemap to include short posts, series, and products` | sitemap.ts                | curl 검증    |
| 4          | `feat(seo): implement RSS feed for blog posts`                           | feed.xml/route.ts         | curl 검증    |
| 5          | `fix(seo): ensure og-image.png exists for social sharing`                | public/\* 또는 layout.tsx | 빌드         |

---

## Success Criteria

### Verification Commands

```bash
# 이병우 텍스트 제거 확인
grep -r "이병우" app/ components/ --include="*.tsx" --include="*.ts"
# Expected: 0건

# 빌드 성공
npm run build
# Expected: 에러 없음

# Sitemap 확인 (로컬)
curl http://localhost:3000/sitemap.xml | grep -E "(short-posts|series|products)"
# Expected: 모두 포함

# RSS Feed 확인 (로컬)
curl http://localhost:3000/feed.xml | head -20
# Expected: 유효한 RSS XML
```

### Final Checklist

- [ ] 모든 '이병우' → '병스커' 변경 완료
- [ ] 한글 검색 키워드 추가 완료
- [ ] Sitemap에 모든 콘텐츠 유형 포함
- [ ] RSS Feed 동작
- [ ] OG 이미지 접근 가능
- [ ] 빌드 성공
