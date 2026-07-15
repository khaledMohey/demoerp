-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "purchaseLineId" TEXT,
    "supplierId" TEXT,
    "quantity" DECIMAL NOT NULL,
    "remaining" DECIMAL NOT NULL,
    "unitCost" DECIMAL NOT NULL,
    "sellPrice" DECIMAL NOT NULL DEFAULT 0,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockBatch_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockBatch_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockBatch_purchaseLineId_fkey" FOREIGN KEY ("purchaseLineId") REFERENCES "PurchaseLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockBatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleLineId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unitCost" DECIMAL NOT NULL,
    "lineCost" DECIMAL NOT NULL,
    CONSTRAINT "SaleAllocation_saleLineId_fkey" FOREIGN KEY ("saleLineId") REFERENCES "SaleLine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleAllocation_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PurchaseLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unitCost" DECIMAL NOT NULL,
    "sellPrice" DECIMAL NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL NOT NULL,
    CONSTRAINT "PurchaseLine_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseLine" ("id", "itemId", "lineTotal", "purchaseId", "quantity", "unitCost") SELECT "id", "itemId", "lineTotal", "purchaseId", "quantity", "unitCost" FROM "PurchaseLine";
DROP TABLE "PurchaseLine";
ALTER TABLE "new_PurchaseLine" RENAME TO "PurchaseLine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StockBatch_itemId_receivedAt_idx" ON "StockBatch"("itemId", "receivedAt");

-- CreateIndex
CREATE INDEX "StockBatch_itemId_remaining_idx" ON "StockBatch"("itemId", "remaining");
