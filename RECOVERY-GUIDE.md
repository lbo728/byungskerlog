# Comment System Recovery Guide

## 개요

자체 구현 댓글 시스템에서 Giscus로 마이그레이션하였습니다.
기존 시스템으로 복구해야 하는 경우 다음 단계를 따르세요.

## 코드 복구

다음 명령으로 자체 댓글 시스템 코드를 복구할 수 있습니다:

```bash
# 컴포넌트 복구
git checkout archive/self-hosted-comments -- components/comment/
git checkout archive/self-hosted-comments -- components/post/Comments.tsx

# 훅 및 타입 복구
git checkout archive/self-hosted-comments -- hooks/useComments.ts
git checkout archive/self-hosted-comments -- lib/types/comment.ts

# API 관련 복구
git checkout archive/self-hosted-comments -- lib/api/comments.ts
git checkout archive/self-hosted-comments -- lib/comment-identity.ts
git checkout archive/self-hosted-comments -- app/api/comments/

# 테스트 복구
git checkout archive/self-hosted-comments -- __tests__/api/comments.test.ts
```

## DB 테이블 복구

### 1. prisma/schema.prisma 복구

위의 git checkout으로 Comment, CommentReaction 모델이 복구됩니다.

또는 수동으로 추가:

```prisma
model Comment {
  id         String   @id @default(cuid())
  content    String   @db.Text
  postId     String
  authorId   String
  authorName String?
  authorImage String?
  parentId   String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent     Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies    Comment[] @relation("CommentReplies")
  reactions  CommentReaction[]

  @@index([postId])
  @@index([authorId])
  @@index([parentId])
  @@index([createdAt])
}

model CommentReaction {
  id        String       @id @default(cuid())
  commentId String
  userId    String
  type      ReactionType
  createdAt DateTime     @default(now())

  comment   Comment      @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId, type])
  @@index([commentId])
  @@index([userId])
}

enum ReactionType {
  LIKE
  LOVE
  CELEBRATE
  INSIGHTFUL
}
```

### 2. 마이그레이션 생성 및 적용

```bash
npx prisma migrate dev --name restore_comment_tables
```

## PostDetail.tsx 수정

```typescript
// Giscus import 제거
// import { Giscus } from "./Giscus";

// Comments import 복원
import { Comments } from "./Comments";

// 렌더링 부분에서
// <Giscus slug={post.slug} /> 를 제거하고
// <Comments postId={post.id} /> 로 변경
```

## 검증

복구 완료 후 다음을 확인하세요:

```bash
npx tsc --noEmit
npm run dev  # 개발 서버 실행 후 포스트 페이지에서 댓글 표시 확인
```
