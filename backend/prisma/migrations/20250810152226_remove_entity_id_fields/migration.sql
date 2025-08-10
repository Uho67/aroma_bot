/*
  Warnings:

  - You are about to drop the column `entity_id` on the `SalesRule` table. All the data in the column will be lost.
  - You are about to drop the column `entity_id` on the `CouponCode` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalesRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SalesRule" ("createdAt", "description", "id", "image", "max_uses", "name", "updatedAt") SELECT "createdAt", "description", "id", "image", "max_uses", "name", "updatedAt" FROM "SalesRule";
DROP TABLE "SalesRule";
ALTER TABLE "new_SalesRule" RENAME TO "SalesRule";
CREATE TABLE "new_CouponCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_at" DATETIME,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sales_rule_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CouponCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CouponCode_sales_rule_id_fkey" FOREIGN KEY ("sales_rule_id") REFERENCES "SalesRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CouponCode" ("code", "createdAt", "id", "is_sent", "max_uses", "sales_rule_id", "updatedAt", "used_at", "user_id", "uses_count") SELECT "code", "createdAt", "id", "is_sent", "max_uses", "sales_rule_id", "updatedAt", "used_at", "user_id", "uses_count" FROM "CouponCode";
DROP TABLE "CouponCode";
ALTER TABLE "new_CouponCode" RENAME TO "CouponCode";
CREATE UNIQUE INDEX "CouponCode_code_key" ON "CouponCode"("code");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
