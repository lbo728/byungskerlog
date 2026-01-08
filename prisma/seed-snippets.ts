import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultSnippets = [
  {
    name: "구분선",
    content: "---",
    shortcut: "Ctrl+Shift+D",
    order: 1,
  },
  {
    name: "좌상단 코너",
    content: "┌",
    shortcut: "Ctrl+Shift+[",
    order: 2,
  },
  {
    name: "우하단 코너",
    content: "┘",
    shortcut: "Ctrl+Shift+]",
    order: 3,
  },
];

async function main() {
  console.log("Seeding default snippets...");

  for (const snippet of defaultSnippets) {
    const existing = await prisma.customSnippet.findFirst({
      where: { content: snippet.content },
    });

    if (!existing) {
      await prisma.customSnippet.create({
        data: snippet,
      });
      console.log(`Created snippet: ${snippet.name}`);
    } else {
      console.log(`Snippet already exists: ${snippet.name}`);
    }
  }

  console.log("Snippet seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
