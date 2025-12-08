-- 관리자 계정 생성 SQL
-- Neon 대시보드의 SQL Editor에서 실행하세요

-- 1. Admin 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 관리자 계정 삽입 (비밀번호: qwer1234!! 를 bcrypt로 해싱한 값)
-- bcrypt hash for "qwer1234!!" with salt rounds 10
INSERT INTO "Admin" ("id", "username", "password", "name", "email")
VALUES (
    'admin_' || gen_random_uuid()::text,
    'admin',
    '$2a$10$YourHashedPasswordHere',  -- 이 부분은 아래 스크립트로 생성해야 함
    'Admin',
    'admin@byungskerlog.com'
)
ON CONFLICT ("username") 
DO UPDATE SET 
    "password" = EXCLUDED."password",
    "updatedAt" = CURRENT_TIMESTAMP;
