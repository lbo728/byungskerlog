#!/bin/bash

# ========================================
# Initial Migration Setup Script
# ========================================
# 
# Purpose: 현재 스키마를 baseline migration으로 설정
# - 프로덕션 DB에 영향 없음 (마이그레이션만 기록)
# - 이후 모든 스키마 변경은 prisma migrate dev로 관리
#
# Usage:
#   chmod +x scripts/init-migrations.sh
#   ./scripts/init-migrations.sh
#
# ========================================

set -e  # Exit on error

echo "============================================"
echo "🚀 Prisma Migration Initialization"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if migrations directory already exists
if [ -d "prisma/migrations" ]; then
    echo -e "${YELLOW}⚠️  Warning: prisma/migrations/ directory already exists${NC}"
    echo ""
    read -p "Do you want to DELETE existing migrations and start fresh? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${RED}❌ Aborted${NC}"
        exit 1
    fi
    rm -rf prisma/migrations
    echo -e "${GREEN}✅ Deleted existing migrations${NC}"
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Please create .env.local with DATABASE_URL pointing to dev branch"
    exit 1
fi

# Verify dev database connection
echo "📡 Verifying database connection..."
DEV_DB=$(grep -E "^DATABASE_URL=" .env.local | grep "ep-wandering-tree-a11ymokd" || true)
if [ -z "$DEV_DB" ]; then
    echo -e "${YELLOW}⚠️  Warning: DATABASE_URL in .env.local doesn't point to dev branch${NC}"
    echo "Expected: ep-wandering-tree-a11ymokd"
    echo "Found: $(grep -E "^DATABASE_URL=" .env.local | head -1)"
    echo ""
    read -p "Continue anyway? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${RED}❌ Aborted${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Using development database (dev branch)${NC}"
echo ""

# Step 1: Create baseline migration
echo "📝 Step 1: Creating baseline migration..."
echo ""
echo "This will:"
echo "  1. Generate SQL for current schema"
echo "  2. Create prisma/migrations/ directory"
echo "  3. Mark migration as applied (no DB changes)"
echo ""

npx prisma migrate dev --name init --create-only

echo ""
echo -e "${GREEN}✅ Migration file created${NC}"
echo ""

# Step 2: Review generated SQL
MIGRATION_DIR=$(ls -td prisma/migrations/*_init 2>/dev/null | head -1)
if [ -z "$MIGRATION_DIR" ]; then
    echo -e "${RED}❌ Error: Could not find migration directory${NC}"
    exit 1
fi

echo "📄 Generated migration SQL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$MIGRATION_DIR/migration.sql"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Does this SQL look correct? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}❌ Aborted - please review schema.prisma${NC}"
    exit 1
fi

# Step 3: Mark as applied without executing (baselining)
echo ""
echo "📌 Step 2: Marking migration as applied (baselining)..."
echo ""
echo "This tells Prisma: 'DB already has this schema, don't run SQL'"
echo ""

npx prisma migrate resolve --applied init

echo ""
echo -e "${GREEN}✅ Migration marked as applied${NC}"
echo ""

# Step 4: Verify migration status
echo "🔍 Step 3: Verifying migration status..."
echo ""

npx prisma migrate status

echo ""
echo "============================================"
echo -e "${GREEN}✅ Migration initialization complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Commit migration files:"
echo "     git add prisma/migrations prisma/schema.prisma"
echo "     git commit -m \"chore: initialize prisma migrations\""
echo ""
echo "  2. For future schema changes, use:"
echo "     npx prisma migrate dev --name <description>"
echo ""
echo "  3. Production deployment will use:"
echo "     npx prisma migrate deploy (via GitHub Actions)"
echo ""
