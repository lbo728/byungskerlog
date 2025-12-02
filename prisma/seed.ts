import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제
  await prisma.post.deleteMany();

  // 더미 데이터 생성
  await prisma.post.createMany({
    data: [
      {
        slug: "hello-world",
        title: "Hello World",
        content: "# Hello World\n\nThis is my first post using Next.js 16 and Prisma.",
        excerpt: "My first post...",
        published: true,
      },
      {
        slug: "nextjs-16-features",
        title: "Next.js 16 Features",
        content: "# Next.js 16 Features\n\nNext.js 16 introduces many new features including...",
        excerpt: "Exploring Next.js 16...",
        published: true,
      },
      {
        slug: "prisma-with-sqlite",
        title: "Using Prisma with SQLite",
        content: "# Prisma with SQLite\n\nSQLite is a great database for local development...",
        excerpt: "Local development with SQLite...",
        published: false, // 비공개 포스트
      },
    ],
  });

  console.log("Seed data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
