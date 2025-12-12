import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, slug: true, published: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(posts, null, 2));
  await prisma.$disconnect();
}

main();
