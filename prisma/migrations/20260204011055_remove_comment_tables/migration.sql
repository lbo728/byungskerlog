/*
  Warnings:

  - You are about to drop the column `readAt` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommentReaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "CommentReaction" DROP CONSTRAINT "CommentReaction_commentId_fkey";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "readAt",
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "CommentReaction";

-- DropEnum
DROP TYPE "ReactionType";
