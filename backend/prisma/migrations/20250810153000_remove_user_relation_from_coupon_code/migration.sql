-- Step 1: Create a temporary table with the new structure
CREATE TABLE "CouponCode_new" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "code" TEXT NOT NULL UNIQUE,
  "chat_id" TEXT NOT NULL,
  "uses_count" INTEGER NOT NULL DEFAULT 0,
  "max_uses" INTEGER NOT NULL DEFAULT 1,
  "used_at" DATETIME,
  "is_sent" BOOLEAN NOT NULL DEFAULT false,
  "sales_rule_id" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Step 2: Copy data from old table to new table, converting user_id to chat_id
INSERT INTO "CouponCode_new" (
  "id", "code", "chat_id", "uses_count", "max_uses", "used_at", "is_sent", "sales_rule_id", "createdAt", "updatedAt"
)
SELECT 
  c."id", 
  c."code", 
  u."chat_id", 
  c."uses_count", 
  c."max_uses", 
  c."used_at", 
  c."is_sent", 
  c."sales_rule_id", 
  c."createdAt", 
  c."updatedAt"
FROM "CouponCode" c
JOIN "User" u ON c."user_id" = u."id";

-- Step 3: Drop the old table
DROP TABLE "CouponCode";

-- Step 4: Rename the new table
ALTER TABLE "CouponCode_new" RENAME TO "CouponCode"; 