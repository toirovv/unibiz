import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { products } from "./products";

export const productSerials = pgTable(
  "product_serials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    serialNumber: text("serial_number").notNull(),
    status: text("status").default("AVAILABLE").notNull(),
    saleId: uuid("sale_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.tenantId, table.serialNumber)],
);
