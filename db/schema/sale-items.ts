import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sales } from "./sales";
import { products } from "./products";

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  serialNumber: text("serial_number").notNull(),
  unitPrice: integer("unit_price").notNull(),
});
