# Development Environment Setup Guide

이 문서는 Byungskerlog 프로젝트의 개발 환경(Development)과 프로덕션 환경(Production)을 분리하여 설정하는 방법을 안내합니다.

## 개요

프로젝트는 다음과 같이 환경을 분리합니다:

| 구분 | Database (Neon) | Storage (Vercel Blob) |
|------|-----------------|----------------------|
| Production | `main` branch | Production Store |
| Development | `dev` branch | Dev Store |

## 1. Neon Database 설정

### 1.1 Dev 브랜치 생성

Neon의 브랜치 기능을 사용하면 프로덕션 데이터의 copy-on-write 복제본을 즉시 생성할 수 있습니다.

1. [Neon Console](https://console.neon.tech) 접속
2. 프로젝트 선택 → **Branches** 탭
3. **Create Branch** 클릭
4. 설정:
   - **Branch name**: `dev`
   - **Parent branch**: `main` (현재 프로덕션)
   - **Include data up to**: `Head` (최신 데이터 포함)
5. **Create Branch** 클릭

### 1.2 연결 문자열 복사

브랜치 생성 후:

1. `dev` 브랜치 선택
2. **Connection Details** 확인
3. 다음 두 가지 연결 문자열 복사:
   - **Pooled connection** (일반 쿼리용): `postgresql://...pooler...`
   - **Direct connection** (마이그레이션용): `postgresql://...` (pooler 없음)

### 1.3 환경 변수 설정

로컬 `.env.local` 파일에 dev 브랜치 연결 문자열 입력:

```bash
# Development Database (Neon dev branch)
DATABASE_URL="postgresql://neondb_owner:password@ep-xxx-dev-pooler.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:password@ep-xxx-dev.region.aws.neon.tech/neondb?sslmode=require"
```

## 2. Vercel Blob Storage 설정

### 2.1 Dev Store 생성

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Storage**
2. **Create Database** → **Blob** 선택
3. 설정:
   - **Name**: `byungskerlog-blob-dev`
   - **Region**: 기존 Store와 동일 권장
4. **Create** 클릭

### 2.2 토큰 복사

Store 생성 후:

1. 생성된 Store 선택
2. **Quickstart** 또는 **Settings** 탭
3. `BLOB_READ_WRITE_TOKEN` 값 복사

### 2.3 환경 변수 설정

로컬 `.env.local` 파일에 dev 토큰 입력:

```bash
# Development Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_dev_xxxxxxxx"
```

## 3. Vercel 배포 환경 설정 (선택사항)

Vercel 대시보드에서 환경별로 다른 값을 설정할 수 있습니다:

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. 각 변수에 대해:
   - **Production**: 프로덕션 DB/Blob 값
   - **Preview**: Dev DB/Blob 값 (PR 미리보기용)
   - **Development**: Dev DB/Blob 값

## 4. 사용 시나리오

### 로컬 개발

```bash
# .env.local에 dev 환경 변수 설정 후
npm run dev
```

로컬에서는 dev 브랜치 DB와 dev Blob Store 사용

### 프로덕션 배포

```bash
# Vercel에 자동 배포 시 Production 환경 변수 사용
git push origin main
```

Vercel Production 환경에서는 main 브랜치 DB와 Production Blob Store 사용

### PR 미리보기 (Preview)

PR 생성 시 Vercel Preview 배포가 생성되며, Preview 환경 변수(dev) 사용

## 5. 주의사항

### Neon 브랜치

- **Free tier 제한**: 프로젝트당 최대 10개 브랜치
- **스토리지**: 브랜치당 0.5GB (Free tier)
- **데이터 동기화**: 브랜치는 생성 시점의 스냅샷이며, 이후 변경은 독립적

### Vercel Blob

- **Free tier 제한**: 총 1GB 스토리지, 10GB/월 전송
- **Store 분리**: dev와 production Store는 완전히 독립적
- **URL**: 각 Store에 업로드된 파일은 서로 다른 URL

### 마이그레이션

데이터베이스 스키마 변경 시:

```bash
# dev 환경에서 먼저 테스트
npx prisma db push

# 문제 없으면 production에 적용 (환경 변수 교체 후)
npx prisma db push
```

## 6. 비용

| 서비스 | Free Tier | 초과 시 |
|--------|-----------|---------|
| Neon (브랜치) | 10개/프로젝트 | $1.50/월/브랜치 |
| Vercel Blob | 1GB + 10GB 전송 | $0.023/GB 스토리지 |

## 참고 자료

- [Neon Branching 문서](https://neon.com/docs/introduction/branching)
- [Neon Pricing](https://neon.com/pricing)
- [Vercel Blob 문서](https://vercel.com/docs/vercel-blob)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
