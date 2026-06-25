import { integer, pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    category: text("category"),
    purchasePrice: integer("purchase_price").notNull(),
    salePrice: integer("sale_price").notNull(),
    currentStock: integer("current_stock").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.tenantId, table.sku)],
);
