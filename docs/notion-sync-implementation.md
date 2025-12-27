# Notion 자동 블로그 업로드 기능 구현 계획

> BYU-124: Notion에서 글 작성 완료 시 자동으로 블로그에 업로드

## 1. 개요

### 목표
Notion 데이터베이스에서 `Status = Published`로 변경된 페이지를 자동으로 블로그에 동기화

### 전체 흐름
```
Notion 데이터베이스 → Vercel Cron (30분마다) → /api/notion/sync → Post DB 저장
```

## 2. Notion 설정

### 2.1 Integration 생성
1. https://www.notion.so/my-integrations 접속
2. "New integration" 클릭
3. 이름: `byungskerlog-sync`
4. Capabilities: Read content, Update content
5. Integration Token 복사 → `NOTION_API_KEY`

### 2.2 데이터베이스 스키마

| 속성 | 타입 | 용도 | 필수 |
|------|------|------|------|
| Title | Title | 포스트 제목 | ✅ |
| Slug | Text | URL 슬러그 | ✅ |
| Excerpt | Text | 요약문 | |
| Tags | Multi-select | 태그 목록 | |
| Type | Select | LONG / SHORT | ✅ |
| Status | Select | Draft / Published / Synced | ✅ |
| Thumbnail | URL | 썸네일 이미지 URL | |
| Series | Select | 시리즈 이름 | |

### 2.3 Status 값 설명
- `Draft`: 작성 중
- `Published`: 동기화 대상 (이 상태일 때 블로그로 전송)
- `Synced`: 동기화 완료

### 2.4 데이터베이스에 Integration 연결
1. Notion 데이터베이스 우측 상단 `...` 클릭
2. "Connections" → "byungskerlog-sync" 추가
3. 데이터베이스 URL에서 ID 복사 → `NOTION_DATABASE_ID`

## 3. 필요 패키지

```bash
npm install @notionhq/client notion-to-md
```

## 4. 환경 변수

```env
# .env.local
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_SYNC_SECRET=your-random-secret-key
```

## 5. 구현 파일 구조

```
lib/
├── notion.ts              # Notion API 클라이언트
└── notion-to-post.ts      # Notion → Post 변환기

app/api/notion/
└── sync/
    └── route.ts           # 동기화 API

vercel.json                # Cron 설정
```

## 6. 상세 구현

### 6.1 Notion 클라이언트 (`lib/notion.ts`)

```typescript
import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function getPublishedPages() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: "Status",
      select: { equals: "Published" },
    },
  });
  return response.results;
}

export async function markAsSynced(pageId: string) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: "Synced" } },
    },
  });
}
```

### 6.2 콘텐츠 변환기 (`lib/notion-to-post.ts`)

```typescript
import { NotionToMarkdown } from "notion-to-md";
import { notion } from "./notion";
import { put } from "@vercel/blob";

const n2m = new NotionToMarkdown({ notionClient: notion });

export async function convertPageToPost(pageId: string) {
  const page = await notion.pages.retrieve({ page_id: pageId });

  // 블록 → Markdown 변환
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  let content = n2m.toMarkdownString(mdBlocks).parent;

  // 이미지 처리 (Notion 임시 URL → Vercel Blob)
  content = await processImages(content);

  // 속성 추출
  return {
    title: getPropertyValue(page, "Title"),
    slug: getPropertyValue(page, "Slug"),
    content,
    excerpt: getPropertyValue(page, "Excerpt"),
    tags: getMultiSelectValues(page, "Tags"),
    type: getPropertyValue(page, "Type") || "LONG",
    thumbnail: getPropertyValue(page, "Thumbnail"),
    notionPageId: pageId,
  };
}

async function processImages(markdown: string): Promise<string> {
  const imageRegex = /!\[([^\]]*)\]\((https:\/\/[^)]+)\)/g;
  let result = markdown;
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const [fullMatch, alt, url] = match;

    // Notion S3 URL인 경우만 처리
    if (url.includes("secure.notion-static.com") || url.includes("prod-files-secure")) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = `notion/${Date.now()}-${Math.random().toString(36).slice(2)}.${getExtension(url)}`;

        const { url: permanentUrl } = await put(filename, blob, {
          access: "public",
        });

        result = result.replace(fullMatch, `![${alt}](${permanentUrl})`);
      } catch (error) {
        console.error("Image processing failed:", url, error);
      }
    }
  }

  return result;
}

function getExtension(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|gif|webp)/i);
  return match ? match[1] : "png";
}

function getPropertyValue(page: any, name: string): string | null {
  const prop = page.properties[name];
  if (!prop) return null;

  switch (prop.type) {
    case "title":
      return prop.title[0]?.plain_text || null;
    case "rich_text":
      return prop.rich_text[0]?.plain_text || null;
    case "select":
      return prop.select?.name || null;
    case "url":
      return prop.url || null;
    default:
      return null;
  }
}

function getMultiSelectValues(page: any, name: string): string[] {
  const prop = page.properties[name];
  if (!prop || prop.type !== "multi_select") return [];
  return prop.multi_select.map((s: any) => s.name);
}
```

### 6.3 동기화 API (`app/api/notion/sync/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublishedPages, markAsSynced } from "@/lib/notion";
import { convertPageToPost } from "@/lib/notion-to-post";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  // 인증 확인
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.NOTION_SYNC_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pages = await getPublishedPages();
    const results: string[] = [];
    const errors: string[] = [];

    for (const page of pages) {
      try {
        const postData = await convertPageToPost(page.id);

        if (!postData.slug) {
          errors.push(`Page ${page.id}: Missing slug`);
          continue;
        }

        // Series 처리
        let seriesId = null;
        if (postData.series) {
          const series = await prisma.series.upsert({
            where: { name: postData.series },
            create: { name: postData.series },
            update: {},
          });
          seriesId = series.id;
        }

        // Post upsert (slug 기준)
        await prisma.post.upsert({
          where: { slug: postData.slug },
          create: {
            slug: postData.slug,
            title: postData.title!,
            content: postData.content,
            excerpt: postData.excerpt,
            tags: postData.tags,
            type: postData.type as "LONG" | "SHORT",
            thumbnail: postData.thumbnail,
            published: true,
            seriesId,
          },
          update: {
            title: postData.title!,
            content: postData.content,
            excerpt: postData.excerpt,
            tags: postData.tags,
            type: postData.type as "LONG" | "SHORT",
            thumbnail: postData.thumbnail,
            seriesId,
          },
        });

        // Notion Status → Synced
        await markAsSynced(page.id);
        results.push(postData.slug);
      } catch (error) {
        errors.push(`Page ${page.id}: ${error}`);
      }
    }

    // 캐시 무효화
    if (results.length > 0) {
      revalidatePath("/");
      revalidatePath("/posts");
      revalidatePath("/short-posts");
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      slugs: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Cron Job에서 GET으로 호출할 수 있도록
export async function GET(request: NextRequest) {
  return POST(request);
}
```

### 6.4 Vercel Cron 설정 (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/notion/sync",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**주의**: Cron에서 호출 시 Authorization 헤더 추가 필요. Vercel 대시보드에서 설정하거나, 별도 인증 로직 필요.

## 7. 관리자 UI (선택)

### 수동 동기화 버튼 추가

```typescript
// app/admin/write/page.tsx 또는 별도 페이지

async function handleSync() {
  const response = await fetch("/api/notion/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTION_SYNC_SECRET}`,
    },
  });
  const result = await response.json();
  // 결과 표시
}
```

## 8. 구현 순서

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | Notion Integration 생성 및 데이터베이스 설정 | 30분 |
| 2 | 환경 변수 설정 | 10분 |
| 3 | 패키지 설치 | 5분 |
| 4 | `lib/notion.ts` 구현 | 30분 |
| 5 | `lib/notion-to-post.ts` 구현 | 1시간 |
| 6 | `app/api/notion/sync/route.ts` 구현 | 1시간 |
| 7 | Vercel Cron 설정 | 15분 |
| 8 | 테스트 및 디버깅 | 2시간 |
| 9 | (선택) 관리자 UI | 1시간 |

## 9. 사용 시나리오

1. **Notion에서 글 작성** → Status: Draft
2. **글 완료 후 속성 입력**
   - Slug: `my-new-post`
   - Type: LONG 또는 SHORT
   - Tags: 원하는 태그 선택
   - (선택) Thumbnail, Series
3. **Status를 Published로 변경**
4. **30분 내 자동 동기화** (또는 수동 버튼 클릭)
5. **동기화 완료 후 Status가 Synced로 변경**
6. **블로그에서 확인**

## 10. 주의사항

### 10.1 이미지 처리
- Notion 이미지 URL은 1시간 후 만료됨
- 반드시 Vercel Blob에 영구 저장 필요

### 10.2 중복 방지
- `slug` 기준 upsert로 중복 생성 방지
- 같은 slug로 여러 번 동기화해도 업데이트됨

### 10.3 Rate Limit
- Notion API: 3 requests/second
- 대량 동기화 시 딜레이 추가 필요

### 10.4 에러 처리
- 개별 페이지 실패 시 다른 페이지는 계속 처리
- 에러 로그 저장 권장

## 11. 향후 개선 방안

1. **실시간 동기화**: Make/Zapier를 통한 Webhook 연동
2. **동기화 이력**: 별도 테이블에 동기화 로그 저장
3. **미리보기**: 동기화 전 미리보기 기능
4. **양방향 동기화**: 블로그 → Notion 역동기화 (복잡)
