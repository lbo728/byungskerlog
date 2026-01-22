# Database Migration Guide

Prisma Migrate를 사용한 안전한 데이터베이스 스키마 변경 가이드입니다.

## 목차

1. [빠른 시작](#빠른-시작)
2. [일반적인 시나리오](#일반적인-시나리오)
3. [안전한 마이그레이션 패턴](#안전한-마이그레이션-패턴)
4. [CI/CD 통합](#cicd-통합)
5. [트러블슈팅](#트러블슈팅)

---

## 빠른 시작

### 새로운 테이블 추가

```bash
# 1. prisma/schema.prisma 수정
model NewTable {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}

# 2. 마이그레이션 생성 (dev 환경)
npx prisma migrate dev --name add_new_table

# 3. 생성된 SQL 확인
cat prisma/migrations/<timestamp>_add_new_table/migration.sql

# 4. 커밋
git add prisma/
git commit -m "feat: add NewTable model"

# 5. PR 생성 → main 머지 → 자동 배포
```

### 기존 테이블에 컬럼 추가

```bash
# 1. schema.prisma 수정
model User {
  // ...
  phoneNumber String?  // nullable 컬럼 추가
}

# 2. 마이그레이션 생성
npx prisma migrate dev --name add_phone_number

# 3. 확인 및 커밋
git add prisma/
git commit -m "feat: add phone number to User"
```

---

## 일반적인 시나리오

### 1. Nullable 컬럼 추가 (안전)

```prisma
model Post {
  id      String  @id
  title   String
  excerpt String?  // ✅ nullable - 기존 레코드는 NULL
}
```

**생성되는 SQL:**
```sql
ALTER TABLE "Post" ADD COLUMN "excerpt" TEXT;
```

**영향:**
- ✅ 기존 데이터 영향 없음
- ✅ 앱 재시작 불필요

### 2. Non-Nullable 컬럼 추가 (기본값 필요)

```prisma
model Post {
  id        String   @id
  published Boolean  @default(false)  // ✅ default 값 지정
}
```

**생성되는 SQL:**
```sql
ALTER TABLE "Post" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
```

**주의:**
- ⚠️  기존 레코드에 자동으로 `false` 적용
- ✅ 데이터 손실 없음

### 3. 컬럼 삭제 (3단계 안전 패턴)

**❌ 잘못된 방법:**
```prisma
model User {
  id   String @id
  // name String  // 바로 삭제 - 위험!
}
```

**✅ 올바른 방법:**

**Week 1: 코드에서 사용 중단**
```typescript
// ❌ 더 이상 사용하지 않음
// const userName = user.name;

// ✅ 새로운 방식 사용
const userName = user.displayName;
```

**Week 2: 컬럼명 변경 (soft delete)**
```prisma
model User {
  id                       String @id
  _deprecated_name_20260122 String?  // 기존 name을 deprecated로 rename
  displayName              String   // 새 컬럼
}
```

```bash
npx prisma migrate dev --name deprecate_user_name
```

**Week 4: 실제 삭제 (검증 후)**
```prisma
model User {
  id          String @id
  displayName String
  // _deprecated_name_20260122 제거
}
```

```bash
npx prisma migrate dev --name remove_deprecated_name
```

### 4. 컬럼 타입 변경 (Expand-Contract 패턴)

**시나리오:** `status`를 TEXT에서 ENUM으로 변경

**Step 1 - Expand (확장):**
```prisma
model Post {
  status     String           // 기존 컬럼 유지
  statusNew  PostStatus?      // 새 타입 컬럼 추가

  @@map("posts")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

```bash
npx prisma migrate dev --name add_status_enum_column
```

**Step 2 - Migrate Data (데이터 이전):**
```bash
# 데이터 마이그레이션 스크립트 작성
cat > scripts/migrate-status-enum.ts << 'TS'
import { prisma } from '@/lib/prisma';

async function main() {
  const posts = await prisma.post.findMany();
  
  for (const post of posts) {
    const newStatus = 
      post.status === 'draft' ? 'DRAFT' :
      post.status === 'published' ? 'PUBLISHED' :
      'ARCHIVED';
    
    await prisma.post.update({
      where: { id: post.id },
      data: { statusNew: newStatus },
    });
  }
}

main().catch(console.error);
TS

# 실행
npx tsx scripts/migrate-status-enum.ts
```

**Step 3 - Switch (전환):**
```typescript
// 코드에서 statusNew 사용하도록 변경
const post = await prisma.post.findUnique({
  where: { id },
  select: { statusNew: true },  // status → statusNew
});
```

**Step 4 - Contract (축소):**
```prisma
model Post {
  status PostStatus  // statusNew → status로 rename

  @@map("posts")
}
```

```bash
# 마이그레이션 생성 (SQL 수동 수정 필요)
npx prisma migrate dev --name finalize_status_enum --create-only

# 생성된 migration.sql 수정
cat > prisma/migrations/<timestamp>_finalize_status_enum/migration.sql << 'SQL'
-- Drop old column, rename new column
ALTER TABLE "posts" DROP COLUMN "status";
ALTER TABLE "posts" RENAME COLUMN "statusNew" TO "status";
ALTER TABLE "posts" ALTER COLUMN "status" SET NOT NULL;
SQL

# 적용
npx prisma migrate dev
```

### 5. 관계 변경 (1:N → M:N)

**Before:**
```prisma
model Post {
  id       String  @id
  authorId String
  author   User    @relation(fields: [authorId], references: [id])
}

model User {
  id    String @id
  posts Post[]
}
```

**After:**
```prisma
model Post {
  id      String @id
  authors User[]  // M:N 관계
}

model User {
  id    String @id
  posts Post[]
}
```

**마이그레이션:**
```bash
npx prisma migrate dev --name change_post_author_to_many_to_many --create-only

# 수동 SQL 작성 (데이터 보존)
cat > prisma/migrations/<timestamp>_change_post_author_to_many_to_many/migration.sql << 'SQL'
-- Create junction table
CREATE TABLE "_PostToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Migrate existing data
INSERT INTO "_PostToUser" ("A", "B")
SELECT "id" AS "A", "authorId" AS "B"
FROM "Post"
WHERE "authorId" IS NOT NULL;

-- Drop old foreign key
ALTER TABLE "Post" DROP COLUMN "authorId";

-- Create indexes
CREATE UNIQUE INDEX "_PostToUser_AB_unique" ON "_PostToUser"("A", "B");
CREATE INDEX "_PostToUser_B_index" ON "_PostToUser"("B");

-- Add foreign keys
ALTER TABLE "_PostToUser" ADD CONSTRAINT "_PostToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PostToUser" ADD CONSTRAINT "_PostToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
SQL

# 적용
npx prisma migrate dev
```

---

## 안전한 마이그레이션 패턴

### 1. 항상 Nullable로 시작

```prisma
// ✅ Good: 단계적 적용
model User {
  email String?  // 1단계: nullable로 추가
}

// 나중에 데이터 채운 후
model User {
  email String  // 2단계: NOT NULL로 변경
}
```

### 2. 기본값 사용

```prisma
// ✅ Good: 기본값으로 안전하게
model Post {
  viewCount Int @default(0)
  featured  Boolean @default(false)
}
```

### 3. 인덱스는 별도 마이그레이션

```bash
# Step 1: 컬럼 추가
npx prisma migrate dev --name add_email_column

# Step 2: 인덱스 추가 (별도 마이그레이션)
npx prisma migrate dev --name add_email_index
```

**이유:**
- 대량 데이터에서 인덱스 생성은 시간 소요
- 실패 시 롤백 용이

### 4. 외래 키 제약은 마지막에

```sql
-- 1. 컬럼 추가 (제약 없이)
ALTER TABLE "Post" ADD COLUMN "authorId" TEXT;

-- 2. 데이터 채우기
UPDATE "Post" SET "authorId" = 'default-user-id' WHERE "authorId" IS NULL;

-- 3. 제약 추가
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" 
  FOREIGN KEY ("authorId") REFERENCES "User"("id");
```

---

## CI/CD 통합

### GitHub Actions 워크플로우

프로젝트에는 다음 3개의 워크플로우가 설정되어 있습니다:

#### 1. `ci.yml` - PR 검증

```yaml
# PR 생성 시 자동 실행
# - schema.prisma 변경 감지
# - migration 파일 존재 확인
# - 위험한 SQL 패턴 검사 (DROP, TRUNCATE 등)
```

#### 2. `deploy-staging.yml` - Staging 배포

```yaml
# dev 브랜치 푸시 시 실행
# - Neon dev branch에 마이그레이션 적용
# - 빌드 및 테스트
```

#### 3. `deploy.yml` - Production 배포

```yaml
# main 브랜치 머지 시 실행
# - Neon main branch에 마이그레이션 적용
# - 프로덕션 빌드 및 배포
```

### Vercel 환경 변수 설정

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. 다음 변수 추가:

| Variable | Environment | Value |
|----------|-------------|-------|
| `DATABASE_URL` | Production | Neon main branch pooled URL |
| `DATABASE_URL_UNPOOLED` | Production | Neon main branch direct URL |
| `DATABASE_URL` | Preview | Neon dev branch pooled URL (optional) |

---

## 트러블슈팅

### "Migration already applied" 에러

```bash
# 상태 확인
npx prisma migrate status

# 수동으로 적용했다면 마크
npx prisma migrate resolve --applied <migration_name>
```

### Schema drift 감지

```bash
# 원인: DB 스키마와 Prisma 스키마 불일치
npx prisma migrate status
# Output: "The following migrations have not yet been applied"

# 해결: 마이그레이션 적용
npx prisma migrate deploy
```

### Dev DB 초기화 필요

```bash
# WARNING: 모든 데이터 삭제됨!
npx prisma migrate reset

# 또는 Neon Console에서 dev 브랜치 재생성
```

### Production에서 마이그레이션 실패

1. 즉시 롤백 ([ROLLBACK-PROCEDURE.md](./ROLLBACK-PROCEDURE.md) 참조)
2. 로그 확인:
   ```bash
   npx prisma migrate status
   # 실패한 마이그레이션 확인
   ```
3. 수동 수정 후:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

---

## 체크리스트

### 마이그레이션 전

- [ ] `.env.local`이 dev 브랜치를 가리키는지 확인
- [ ] `schema.prisma` 변경 사항 검토
- [ ] 마이그레이션 이름이 명확한지 확인 (`add_user_profile` ✅, `update` ❌)

### 마이그레이션 후

- [ ] 생성된 SQL 파일 리뷰
- [ ] 위험한 SQL 패턴 확인 (DROP, TRUNCATE, ALTER TYPE)
- [ ] 로컬에서 테스트 (npm run dev)
- [ ] Prisma Studio로 데이터 확인

### PR 생성 시

- [ ] `prisma/schema.prisma` + `prisma/migrations/**` 함께 커밋
- [ ] PR 설명에 마이그레이션 이유 명시
- [ ] 위험도 표시 (Low/Medium/High)
- [ ] 롤백 계획 작성 (High 위험도의 경우)

### Production 배포 후

- [ ] GitHub Actions 로그 확인
- [ ] `prisma migrate status` 실행
- [ ] 프로덕션 앱 동작 확인
- [ ] 에러 로그 모니터링 (처음 10분)

---

## 추가 자료

- [Prisma Migrate 공식 문서](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Neon Branching 가이드](https://neon.tech/docs/introduction/branching)
- [AGENTS.md - Database Environment](../AGENTS.md#database-environment-critical)
- [ROLLBACK-PROCEDURE.md](./ROLLBACK-PROCEDURE.md)
