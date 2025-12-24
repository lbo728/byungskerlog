import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function removeTimestampFromSlug(slug: string): Promise<string> {
  return slug.replace(/-\d{13}$/, "");
}

async function generateUniqueSlug(
  baseSlug: string,
  currentId: string,
  existingSlugs: Set<string>
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function main() {
  console.log("🚀 Starting slug migration...\n");

  const posts = await prisma.post.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${posts.length} posts to migrate.\n`);

  const existingSlugs = new Set<string>();
  const updates: { id: string; oldSlug: string; newSlug: string }[] = [];

  for (const post of posts) {
    const baseSlug = await removeTimestampFromSlug(post.slug);

    if (baseSlug === post.slug) {
      existingSlugs.add(post.slug);
      console.log(`⏭️  Skipping "${post.title}" - no timestamp found`);
      continue;
    }

    const newSlug = await generateUniqueSlug(baseSlug, post.id, existingSlugs);
    existingSlugs.add(newSlug);

    updates.push({
      id: post.id,
      oldSlug: post.slug,
      newSlug,
    });

    console.log(`📝 "${post.title}"`);
    console.log(`   Old: ${post.slug}`);
    console.log(`   New: ${newSlug}\n`);
  }

  if (updates.length === 0) {
    console.log("✅ No posts need migration.");
    return;
  }

  console.log(`\n🔄 Updating ${updates.length} posts...\n`);

  for (const update of updates) {
    await prisma.post.update({
      where: { id: update.id },
      data: { slug: update.newSlug },
    });
    console.log(`✓ Updated: ${update.oldSlug} → ${update.newSlug}`);
  }

  console.log("\n✅ Migration completed successfully!");
  console.log(`   Total posts processed: ${posts.length}`);
  console.log(`   Posts updated: ${updates.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
