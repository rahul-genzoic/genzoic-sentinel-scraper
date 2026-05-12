/*
  Warnings:

  - You are about to drop the column `found_at` on the `contacts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "found_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "title" DROP NOT NULL;
