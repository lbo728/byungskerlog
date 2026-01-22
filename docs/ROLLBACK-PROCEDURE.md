# Database Migration Rollback Procedure

이 문서는 Prisma 마이그레이션 실패 시 롤백 절차를 안내합니다.

## 🚨 긴급 상황 판단

### 즉시 롤백이 필요한 경우

- ❌ 마이그레이션 실행 중 에러 발생
- ❌ 프로덕션 서비스 장애 발생
- ❌ 데이터 손실 감지
- ❌ 스키마 드리프트로 인한 앱 크래시

### 모니터링이 필요한 경우

- ⚠️  마이그레이션은 성공했으나 앱 동작 이상
- ⚠️  성능 저하 감지
- ⚠️  특정 기능 오작동

---

## 방법 1: Prisma Migrate 롤백 (권장)

### 1-1. 마이그레이션 상태 확인

```bash
# Production DB 상태 확인
export $(grep -E "^DATABASE_URL=" .env | xargs)
npx prisma migrate status
```

출력 예시:
```
Following migrations have been applied:
  20260122_init
  20260122_add_user_profile ← 문제 있는 마이그레이션
```

### 1-2. 롤백 마이그레이션 생성

```bash
# 로컬 dev 환경에서 작업
# 1. 문제 있는 마이그레이션의 역순 SQL 작성
cat > prisma/migrations/20260122_rollback_user_profile/migration.sql << 'SQL'
-- Revert: 20260122_add_user_profile

ALTER TABLE "User" DROP COLUMN IF EXISTS "profileUrl";
DROP TABLE IF EXISTS "UserProfile";
SQL

# 2. 마이그레이션 히스토리에 추가
npx prisma migrate resolve --applied 20260122_rollback_user_profile
```

### 1-3. Production 적용

```bash
# GitHub Actions에서 자동 실행되거나 수동 실행
export $(grep -E "^DATABASE_URL=" .env | xargs)
npx prisma migrate deploy
```

**장점:**
- ✅ 마이그레이션 히스토리 유지
- ✅ 추적 가능
- ✅ 팀 협업 용이

**단점:**
- ⚠️  롤백 SQL을 수동 작성해야 함
- ⚠️  복잡한 마이그레이션은 역순 작성이 어려움

---

## 방법 2: Neon Branch Point-in-Time Recovery (빠른 복구)

Neon은 7일간의 PITR(Point-in-Time Recovery)을 제공합니다.

### 2-1. 마이그레이션 전 시점 확인

```bash
# 마이그레이션 실행 시간 확인 (GitHub Actions 로그 또는 로컬 기록)
# 예: 2026-01-22 10:30:00 KST
```

### 2-2. Neon Console에서 복구

1. [Neon Console](https://console.neon.tech) 접속
2. 프로젝트 선택 → **Branches** 탭
3. `main` 브랜치 선택 → **Restore** 버튼
4. 복구 시점 선택:
   - Timestamp: `2026-01-22 10:29:00 UTC` (마이그레이션 직전)
   - 또는 LSN (Log Sequence Number) 지정
5. **Restore to a new branch** 선택
   - 새 브랜치명: `main-recovery-20260122`
6. **Restore** 클릭

### 2-3. 복구된 브랜치 검증

```bash
# 복구된 브랜치 연결 문자열 복사
export DATABASE_URL="postgresql://...main-recovery-20260122..."

# 데이터 확인
npx prisma studio

# 또는 SQL로 확인
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

### 2-4. Production으로 전환

**옵션 A: Neon Branch 스위칭 (빠름)**

1. Neon Console → **Branches**
2. `main-recovery-20260122` → **Set as primary**
3. Vercel/GitHub Secrets의 `DATABASE_URL` 업데이트
4. Vercel 재배포

**옵션 B: 데이터 마이그레이션 (안전)**

```bash
# 복구된 브랜치에서 덤프
pg_dump $DATABASE_URL_RECOVERY > backup.sql

# 원래 main 브랜치에 복원
export DATABASE_URL="postgresql://...ep-old-poetry-a16nvu2i..."
psql $DATABASE_URL < backup.sql
```

**장점:**
- ✅ 빠른 복구 (수 초~수 분)
- ✅ 데이터 손실 없음
- ✅ 마이그레이션 실수 완전 회복

**단점:**
- ⚠️  7일 이내 데이터만 복구 가능
- ⚠️  복구 시점 이후 변경사항 손실

---

## 방법 3: Git Revert + 재배포 (코드 롤백)

마이그레이션 자체보다 **코드 변경**이 문제일 경우

### 3-1. 문제 커밋 확인

```bash
git log --oneline -10
# 예: abc1234 feat: add user profile feature
```

### 3-2. Revert 커밋 생성

```bash
git revert abc1234
git push origin main
```

### 3-3. GitHub Actions가 자동 배포

```
1. CI가 자동 실행
2. 마이그레이션 체크 (변경 없음)
3. 빌드 및 배포
```

**주의:** 이 방법은 **코드만 롤백**하며, **DB 스키마는 롤백되지 않습니다.**

---

## 방법 4: 수동 SQL 실행 (최후의 수단)

### 4-1. 문제 있는 마이그레이션 확인

```bash
cat prisma/migrations/20260122_add_user_profile/migration.sql
```

### 4-2. 역순 SQL 작성

```sql
-- 원본 마이그레이션
ALTER TABLE "User" ADD COLUMN "profileUrl" TEXT;
CREATE TABLE "UserProfile" (...);

-- 롤백 SQL
ALTER TABLE "User" DROP COLUMN "profileUrl";
DROP TABLE "UserProfile";
```

### 4-3. Production DB에 직접 실행

```bash
export $(grep -E "^DATABASE_URL_UNPOOLED=" .env | xargs)
psql $DATABASE_URL_UNPOOLED << 'SQL'
BEGIN;

ALTER TABLE "User" DROP COLUMN IF EXISTS "profileUrl";
DROP TABLE IF EXISTS "UserProfile";

COMMIT;
SQL
```

### 4-4. Prisma 마이그레이션 히스토리 동기화

```bash
# 문제 마이그레이션을 "rolled back"로 표시
npx prisma migrate resolve --rolled-back 20260122_add_user_profile
```

**위험:**
- ❌ 마이그레이션 히스토리 불일치 가능
- ❌ 팀원 간 스키마 드리프트 발생 가능
- ❌ 추적 어려움

---

## 롤백 후 체크리스트

### 1. 데이터 무결성 확인

```bash
# Prisma Studio로 데이터 확인
npx prisma studio

# 또는 SQL로 확인
psql $DATABASE_URL -c "SELECT * FROM \"_prisma_migrations\" ORDER BY finished_at DESC LIMIT 5;"
```

### 2. 앱 동작 확인

```bash
# 로컬에서 테스트
npm run dev

# Production 확인
curl https://yourdomain.com/api/health
```

### 3. 마이그레이션 상태 확인

```bash
npx prisma migrate status
# Expected: "Database schema is up to date!"
```

### 4. 팀 공유

```
1. Slack/Discord에 롤백 사실 공지
2. 원인 분석 문서 작성
3. 재발 방지 대책 수립
```

---

## 예방 조치

### 1. 마이그레이션 전 백업

```bash
# Neon Branch 생성 (백업용)
# Neon Console → Create Branch → Name: backup-before-migration
```

### 2. Staging 먼저 테스트

```bash
# dev 브랜치에 푸시 → Staging 자동 배포
git push origin dev

# 검증 후 main 머지
git checkout main
git merge dev
git push origin main
```

### 3. 마이그레이션 SQL 리뷰

```bash
# PR에서 migration.sql 파일 반드시 확인
# - DROP 문 확인
# - ALTER TYPE 확인
# - 데이터 손실 가능성 확인
```

---

## 긴급 연락

- **Neon Status**: https://neonstatus.com
- **Vercel Status**: https://www.vercel-status.com
- **GitHub Status**: https://www.githubstatus.com

---

## 추가 자료

- [Neon Point-in-Time Recovery](https://neon.tech/docs/introduction/point-in-time-restore)
- [Prisma Migrate Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Migration Rollback Guide](./MIGRATION-GUIDE.md#rollback)
