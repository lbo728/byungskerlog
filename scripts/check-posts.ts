import { prisma } from '../lib/prisma'
async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, slug: true, published: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log(JSON.stringify(posts, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
