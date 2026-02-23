# Comment to Giscus Migration - Learnings

## 2026-02-04 Session

### 성공한 패턴

1. **Git Tag 아카이빙**
   - `git tag archive/self-hosted-comments` 생성 후 파일 삭제
   - 복구 가능한 형태로 유지 (tag에서 checkout 가능)
   - 14개 파일 완전 삭제 가능

2. **Prisma Migration**
   - `npx prisma migrate dev --name remove_comment_tables` 자동 생성 및 적용
   - schema.prisma에서 Comment, CommentReaction, ReactionType enum 제거
   - 마이그레이션 파일은 git history에 남음 (추적 가능)

3. **Giscus 컴포넌트 구현**
   - @giscus/react@3.1.0 설치 간단
   - "use client" 지시문 필수 (클라이언트 컴포넌트)
   - slug를 mapping term으로 사용하여 포스트별 고유 댓글 스레드 생성

4. **PostDetail 통합**
   - Comments 컴포넌트 제거 후 Giscus 추가
   - import 추가 + 렌더링 추가만으로 완료
   - TypeScript 타입 안전성 유지

5. **E2E 테스트 + 문서화**
   - Playwright 테스트 작성 간단
   - RECOVERY-GUIDE.md로 복구 절차 명확히 문서화
   - 향후 복구 필요시 단계별 가이드 제공

### 주의사항

1. **Playwright 타입 설치**
   - @playwright/test 패키지 필요 (e2e 테스트 작성시)
   - npm install -D @playwright/test 필수

2. **Giscus 설정값 플레이스홀더**
   - repo, repoId, categoryId는 사용자가 giscus.app에서 확인 후 입력
   - 현재는 플레이스홀더 상태로 유지

3. **마이그레이션 적용 상태**
   - 로컬 dev 환경에서는 자동 적용
   - 프로덕션 배포시 `npx prisma migrate deploy` 필요

### 커밋 메시지 패턴

```
chore: archive self-hosted comment system
chore(db): remove comment tables via migration
feat: add Giscus comment component
feat: integrate Giscus into post detail page
test: add Giscus E2E test and recovery guide
```

### 다음 단계 (사용자 수행)

1. GitHub에 `byungskerlog-comments` repo 생성
2. Discussions 활성화
3. giscus.app에서 설정 생성
4. Giscus.tsx의 repo/repoId/categoryId 업데이트
5. 배포

### 복구 절차 (필요시)

```bash
# 코드 복구
git checkout archive/self-hosted-comments -- components/comment/ hooks/useComments.ts ...

# DB 복구
npx prisma migrate dev --name restore_comment_tables
```

## 완료 상태

- ✅ 5/5 Tasks 완료
- ✅ 모든 검증 통과
- ✅ 문서화 완료
- ⏳ Giscus 설정값 입력 대기 (사용자 액션)
