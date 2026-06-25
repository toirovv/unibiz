import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { customers } from "./customers";

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  totalAmount: integer("total_amount").notNull(),
  paymentType: text("payment_type").notNull(),
  status: text("status").default("COMPLETED"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
