/*
  Warnings:

  - You are about to drop the `BotSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN "button_action" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BotSettings";
PRAGMA foreign_keys=on;
