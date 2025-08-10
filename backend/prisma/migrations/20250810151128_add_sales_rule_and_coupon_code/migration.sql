-- CreateTable
CREATE TABLE "SalesRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CouponCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity_id" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "SalesRule_entity_id_key" ON "SalesRule"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "CouponCode_entity_id_key" ON "CouponCode"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "CouponCode_code_key" ON "CouponCode"("code");
