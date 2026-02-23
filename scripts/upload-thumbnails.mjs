import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const prisma = new PrismaClient();
const THUMB_DIR = '/Users/byungskersmacbook/Downloads/velog-thumb';
const BLOB_TOKEN = 'vercel_blob_rw_tbycrxioKyfLikTK_phal5650UG12CVrLX7zvdGNEGoBl5u';

// NFC 정규화 함수
const nfc = (str) => str.normalize('NFC');

// 수동 매핑 (파일명 → DB 제목의 핵심 키워드)
const MANUAL_MAP = {
  '2023년-회고': '2023년 회고',
  '2024년-2분기-회고- 숏폼-늘리기': '2분기 회고',
  '2024년-나름-순조로웠던-1분기-회고록': '2024년 나름 순조로웠던 1분기',
  '2024년-프론트엔드-개발자로서의-1년째-연말-회고': '프론트엔드 개발자로서의 1년',
  '2025년-1분기-회고': '2025년 1분기 회고',
  '365일간-매일-짧은-글쓰기를-하며=느낀점': '365일간',
  'Figmable-CLI-배포': 'Figmable CLI',
  'Flutter-Web에서-iframe을-전역-관리': 'iframe을 전역 관리',
  'Fluttrer-Web에서-Javascript': 'Javascript 유연하게',
  'GPT-API를-활용한-인공지능-앱-개발-서평': 'GPT API를 활용한',
  'TeoConf2024-스피커 후기': 'TeoConf2024',
  'flutter에-design-테마-만들기': 'Design Theme',
  'mom-투표-서비스-개발의시작': '개발의 시작',
  'mom-투표서비스-데이터-설계': '데이터 설계',
  'mom-투표서비스-시작': '프로젝트 시작',
  '개발자-기술면접-노트': '기술면접 노트',
  '그림으로-이해하는-알고리즘-리뷰': '그림으로 이해하는 알고리즘',
  '글또-프론트엔드-모바일-반상회-발표-후기': '반상회 발표 후기',
  '나에게-성장이란-의미는': '성장의 의미',
  '데이터-삽질-끝에-UX': '데이터 삽질',
  '러닝-랭체인-리뷰': '러닝 랭체인',
  '맥북과-아이폰의-Chrome이-서로 달랐다': 'Chrome이 서로 달랐다',
  '멀티패러다임-프로그래밍-리뷰': '멀티패러다임',
  '모두의-네트워크-기초-리뷰': '모두의 네트워크',
  '변수-역할-프레임워크': '변수 역할',
  '스프링-부트-개발자-온보딩': '온보딩 가이드',
  '실무에서-SQL을-다루는-기술': 'SQL을 다루는',
  '안드로이드에서-PWA의-크롬-뱃지-제거하기': 'PWA의 크롬 뱃지',
  '요즘-개발자를-위한-시스템-설계': '시스템 설계 수업',
  '웹앱에서-스플래시-만들기': '스플래시 스크린',
  '이펙티브-소프트웨어-아키텍처-리뷰': '이펙티브 소프트웨어',
  '인지-과학': '인지 과학',
  '지금까지의-삶의-지도 ': '삶의 지도',
  '지금까지의-삶의-지도': '삶의 지도',
  '짧고-빠르게-Storybook-도입': 'Storybook 도입',
  '커넥트 에브리원-시즌-4-첫-번째-모임': '시즌 4 첫 번째',
  '커넥트-에브리원-시즌-4-세 번째 모임': '시즌 4 세 번째',
  '커넥트-에브리원-시즌6-첫번째': '시즌 6 첫 번째',
  '코드-너머-회사보다': '코드 너머',
  '테오의-트레바리-커넥트-에브리원-시즌-3': '시즌 3',
  '테오의-트레바리-커넥트-에브리원': '커넥트 에브리원',
  '프런트엔드-레벨을-높이는-자바스크립트': '자바스크립트 퀴즈북',
  '플랫폼-엔지니어링-리뷰': '플랫폼 엔지니어링',
  '핸드오프-1': null, // 해당 글 없음
  '핸드오프-2': null, // 해당 글 없음
};

// NFC로 정규화된 매핑 생성
const NORMALIZED_MAP = {};
for (const [key, value] of Object.entries(MANUAL_MAP)) {
  NORMALIZED_MAP[nfc(key)] = value;
}

async function main() {
  // 1. 모든 Post 가져오기
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, thumbnail: true },
    where: { type: 'LONG' }
  });
  
  console.log(`📚 DB에서 ${posts.length}개의 포스트 발견\n`);
  
  // 2. 썸네일 파일 목록
  const files = readdirSync(THUMB_DIR).filter(f => 
    ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extname(f).toLowerCase())
  );
  
  console.log(`🖼️  ${files.length}개의 썸네일 파일 발견\n`);
  
  // 3. 매칭
  const results = [];
  
  for (const file of files) {
    const fileNameWithoutExt = nfc(file.replace(/\.[^/.]+$/, '').trim());
    const keyword = NORMALIZED_MAP[fileNameWithoutExt];
    
    if (keyword === null) {
      console.log(`⏭️  스킵 (매핑 없음): ${file}`);
      continue;
    }
    
    if (!keyword) {
      console.log(`❓ 매핑 필요: ${fileNameWithoutExt}`);
      continue;
    }
    
    // 키워드로 포스트 찾기
    const matchedPost = posts.find(p => p.title.includes(keyword));
    
    if (matchedPost) {
      results.push({
        file,
        postId: matchedPost.id,
        postTitle: matchedPost.title,
        currentThumbnail: matchedPost.thumbnail
      });
    } else {
      console.log(`❌ DB에서 못 찾음: ${file} (키워드: "${keyword}")`);
    }
  }
  
  console.log(`\n✅ ${results.length}개 매칭 성공\n`);
  console.log('--- 매칭 결과 ---\n');
  
  for (const r of results) {
    const status = r.currentThumbnail ? '🔄 덮어쓰기' : '🆕 새로 추가';
    console.log(`${status} ${r.file}`);
    console.log(`   → ${r.postTitle}\n`);
  }
  
  // 4. 업로드 진행
  console.log('\n--- 업로드 시작 ---\n');
  
  let uploaded = 0;
  
  for (const r of results) {
    const filePath = join(THUMB_DIR, r.file);
    const fileBuffer = readFileSync(filePath);
    const ext = extname(r.file).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[ext] || 'image/jpeg';
    
    try {
      // Vercel Blob에 업로드
      const blob = await put(`thumbnails/${r.postId}${ext}`, fileBuffer, {
        access: 'public',
        token: BLOB_TOKEN,
        contentType
      });
      
      // DB 업데이트
      await prisma.post.update({
        where: { id: r.postId },
        data: { thumbnail: blob.url }
      });
      
      console.log(`✅ ${r.postTitle}`);
      console.log(`   ${blob.url}\n`);
      uploaded++;
    } catch (err) {
      console.error(`❌ 실패: ${r.postTitle}`, err.message);
    }
  }
  
  console.log(`\n--- 완료 ---`);
  console.log(`업로드: ${uploaded}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
