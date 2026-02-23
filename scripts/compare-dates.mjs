import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// velog 데이터 (GraphQL에서 가져온 것)
const velogData = [
  { title: "스프링 부트 개발자 온보딩 가이드 리뷰", date: "2025-12-28T14:21:45.268Z" },
  { title: "개발자 기술면접 노트 리뷰", date: "2025-11-30T08:35:11.397Z" },
  { title: "요즘 개발자를 위한 시스템 설계 수업 리뷰", date: "2025-11-22T14:27:40.989Z" },
  { title: "프런트엔드 레벨을 높이는 자바스크립트 퀴즈북 리뷰", date: "2025-10-26T12:14:40.619Z" },
  { title: "데이터 삽질 끝에 UX가 보였다 리뷰", date: "2025-09-28T14:57:42.528Z" },
  { title: "코드 너머, 회사보다 오래 남을 개발자 리뷰", date: "2025-08-31T12:14:58.939Z" },
  { title: "실무에서 SQL을 다루는 기술", date: "2025-07-27T08:29:16.757Z" },
  { title: "테오의 트레바리, 커넥트 에브리원 시즌 6 첫 번째 모임", date: "2025-07-10T00:22:11.270Z" },
  { title: "러닝 랭체인 리뷰", date: "2025-06-29T07:16:36.904Z" },
  { title: "멀티패러다임 프로그래밍 리뷰", date: "2025-05-30T15:19:28.390Z" },
  { title: "2025년 1분기 회고 - 발표도 하고, 이것저것 만들고", date: "2025-05-06T11:44:54.665Z" },
  { title: "이펙티브 소프트웨어 아키텍처 리뷰", date: "2025-04-27T11:52:11.997Z" },
  { title: "플랫폼 엔지니어링 리뷰", date: "2025-04-25T13:35:07.192Z" },
  { title: "피그마 무료 플랜에서 컬러 코드 추출 자동화하기! (feat. Figmable CLI 배포)", date: "2025-03-16T11:44:53.394Z" },
  { title: "GPT API를 활용한 인공지능 앱 개발 서평", date: "2025-02-28T12:14:41.419Z" },
  { title: "365일간, 매일 짧은 \n글쓰기를 하며 느낀점", date: "2025-02-26T14:15:17.561Z" },
  { title: "글또 프론트엔드 모바일 반상회 발표 후기!", date: "2025-02-16T14:36:32.464Z" },
  { title: "TeoConf2024 스피커 후기", date: "2025-02-10T11:11:37.168Z" },
  { title: "글또 X 코드트리 1개월 후기", date: "2025-02-02T14:59:20.227Z" },
  { title: "짧고 빠르게 Storybook 도입하기!", date: "2025-01-19T14:06:04.185Z" },
  { title: "테오의 트레바리, 커넥트 에브리원 시즌 4 세 번째 모임", date: "2025-01-18T13:20:52.975Z" },
  { title: "맥북과 아이폰의 Chrome이 서로 달랐다?!", date: "2025-01-03T01:05:42.557Z" },
  { title: "2024년, 프론트엔드 개발자로서의 1년 째를 맞은 연말 회고", date: "2024-12-22T14:48:08.478Z" },
  { title: "변수 역할 프레임워크: 11개의 변수 역할로 단번에 코드 이해하기", date: "2024-11-24T14:49:22.207Z" },
  { title: "Fluttrer Web에서 Javascript 유연하게 사용하기 (feat. JS interop의 A to Z)", date: "2024-11-10T13:06:30.972Z" },
  { title: "인지 과학으로 알아보는, Git 브랜치에서 1개의 컨텍스트만 유지해야하는 이유", date: "2024-10-23T13:11:29.512Z" },
  { title: "테오의 트레바리, 커넥트 에브리원 시즌 4 첫 번째 모임", date: "2024-10-18T08:32:44.965Z" },
  { title: "Flutter Web에서 iframe을 전역 관리하기 위해 알게된 싱글톤 패턴", date: "2024-10-13T14:56:34.378Z" },
  { title: "테오의 트레바리, 커넥트 에브리원 시즌 3", date: "2024-10-07T14:55:38.311Z" },
  { title: "그림으로 이해하는 알고리즘 리뷰", date: "2024-09-29T10:23:00.518Z" },
  { title: "지금까지의 삶의 지도", date: "2024-09-21T09:04:20.772Z" },
  { title: "2024년, 2분기 회고: 숏폼 늘리기", date: "2024-07-13T14:12:42.483Z" },
  { title: "나에게 맞춘 성장의 의미는", date: "2024-07-06T12:17:35.253Z" },
  { title: "안드로이드에서 PWA의 크롬 뱃지 제거하기", date: "2024-06-15T14:04:24.491Z" },
  { title: "웹앱에서 스플래시 스크린 만들기", date: "2024-06-14T15:20:15.088Z" },
  { title: "모두의 네트워크 기초 리뷰", date: "2024-05-20T15:32:27.455Z" },
  { title: "2024년 나름 순조로웠던 1분기 회고록", date: "2024-04-01T16:22:42.431Z" },
  { title: "Flutter에 Design Theme 만들기", date: "2024-02-26T02:44:15.291Z" },
  { title: "[MOM 투표 서비스] 데이터 설계 우여곡절기", date: "2024-02-14T14:52:45.664Z" },
  { title: "테오의 트레바리 : 커넥트 에브리원", date: "2024-02-13T04:23:17.115Z" },
  { title: "[MOM 투표 서비스] 개발의 시작", date: "2024-01-29T14:14:01.851Z" },
  { title: "[MOM 투표 서비스] 프로젝트 시작", date: "2024-01-18T13:35:06.184Z" },
  { title: "신입 프론트엔드 개발자가 된 디자이너의 2023년 회고", date: "2024-01-02T00:21:04.536Z" },
];

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

async function main() {
  const dbPosts = await prisma.post.findMany({
    select: { id: true, title: true, createdAt: true },
    where: { type: 'LONG' }
  });

  const mismatches = [];
  const matched = [];

  for (const velog of velogData) {
    const velogDate = new Date(velog.date);
    
    // DB에서 매칭되는 포스트 찾기
    const dbPost = dbPosts.find(p => p.title === velog.title);
    
    if (!dbPost) {
      console.log(`❓ DB에 없음: ${velog.title}`);
      continue;
    }

    const dbDate = dbPost.createdAt;
    const velogDateStr = formatDate(velogDate);
    const dbDateStr = formatDate(dbDate);

    if (velogDateStr !== dbDateStr) {
      mismatches.push({
        id: dbPost.id,
        title: velog.title,
        velog: velogDateStr,
        db: dbDateStr,
        velogFull: velog.date
      });
    } else {
      matched.push({ title: velog.title, date: velogDateStr });
    }
  }

  console.log('\n=== 날짜 불일치 목록 ===\n');
  console.log(`총 ${mismatches.length}개 불일치\n`);
  
  for (const m of mismatches) {
    console.log(`📝 ${m.title.slice(0, 40)}...`);
    console.log(`   velog: ${m.velog} → DB: ${m.db}`);
    console.log();
  }

  console.log('\n=== 일치하는 것 ===\n');
  console.log(`총 ${matched.length}개 일치\n`);
  for (const m of matched) {
    console.log(`✅ ${m.title.slice(0, 50)} (${m.date})`);
  }

  // 업데이트 실행 여부 확인
  if (process.argv.includes('--fix')) {
    console.log('\n\n=== 날짜 수정 시작 ===\n');
    for (const m of mismatches) {
      await prisma.post.update({
        where: { id: m.id },
        data: { createdAt: new Date(m.velogFull) }
      });
      console.log(`✅ 수정됨: ${m.title.slice(0, 40)}... → ${m.velog}`);
    }
    console.log(`\n총 ${mismatches.length}개 수정 완료!`);
  } else {
    console.log('\n\n💡 수정하려면 --fix 옵션을 추가하세요');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
