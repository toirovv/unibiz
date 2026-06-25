import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { sales } from "./sales";
import { customers } from "./customers";

export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  saleId: uuid("sale_id")
    .references(() => sales.id)
    .notNull()
    .unique(),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").default(0),
  remainingAmount: integer("remaining_amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").default("ACTIVE"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
