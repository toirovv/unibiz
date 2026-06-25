"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

function getTable(type: string) {
  switch (type) {
    case "customers":
      return schema.customers;
    case "products":
      return schema.products;
    case "sales":
      return schema.sales;
    case "purchases":
      return schema.purchases;
    case "debts":
      return schema.debts;
    default:
      return null;
  }
}

export async function exportData(
  type: "customers" | "products" | "sales" | "purchases" | "debts"
) {
  try {
    const tenantId = await requireTenant();
    const table = getTable(type);
    if (!table) return { success: false, error: `Unknown type: ${type}` };
    const data = await db
      .select()
      .from(table)
      .where(eq(table.tenantId, tenantId));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function importData(type: string, data: Record<string, unknown>[]) {
  try {
    const tenantId = await requireTenant();
    const table = getTable(type);
    if (!table) return { success: false, error: `Unknown type: ${type}` };
    if (!data || data.length === 0) {
      return { success: false, error: "No data provided" };
    }
    const rows = data.map((row) => ({
      ...row,
      tenantId,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }));
    const imported = await db.insert(table).values(rows).returning();
    return { success: true, data: imported, count: imported.length };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function exportBackup() {
  try {
    const tenantId = await requireTenant();
    const [customers, products, productSerials, purchases, purchaseItems, sales, saleItems, debts, debtPayments] =
      await Promise.all([
        db.select().from(schema.customers).where(eq(schema.customers.tenantId, tenantId)),
        db.select().from(schema.products).where(eq(schema.products.tenantId, tenantId)),
        db.select().from(schema.productSerials).where(eq(schema.productSerials.tenantId, tenantId)),
        db.select().from(schema.purchases).where(eq(schema.purchases.tenantId, tenantId)),
        db.select().from(schema.purchaseItems),
        db.select().from(schema.sales).where(eq(schema.sales.tenantId, tenantId)),
        db.select().from(schema.saleItems),
        db.select().from(schema.debts).where(eq(schema.debts.tenantId, tenantId)),
        db.select().from(schema.debtPayments).where(eq(schema.debtPayments.tenantId, tenantId)),
      ]);
    return {
      success: true,
      data: {
        customers,
        products,
        productSerials,
        purchases,
        purchaseItems,
        sales,
        saleItems,
        debts,
        debtPayments,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
