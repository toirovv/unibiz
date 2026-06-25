"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getSales() {
  try {
    const tenantId = await requireTenant();
    const data = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.tenantId, tenantId))
      .orderBy(desc(schema.sales.createdAt));
    const withData = await Promise.all(
      data.map(async (s) => {
        const [customer] = s.customerId
          ? await db
              .select()
              .from(schema.customers)
              .where(eq(schema.customers.id, s.customerId))
          : [null];
        const items = await db
          .select()
          .from(schema.saleItems)
          .where(eq(schema.saleItems.saleId, s.id));
        return { ...s, customer, itemCount: items.length };
      })
    );
    return { success: true, data: withData };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getSale(id: string) {
  try {
    const tenantId = await requireTenant();
    const [sale] = await db
      .select()
      .from(schema.sales)
      .where(and(eq(schema.sales.id, id), eq(schema.sales.tenantId, tenantId)));
    if (!sale) return { success: false, error: "Sale not found" };
    const items = await db
      .select()
      .from(schema.saleItems)
      .where(eq(schema.saleItems.saleId, id));
    const itemsWithProduct = await Promise.all(
      items.map(async (item) => {
        const [product] = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.productId));
        return { ...item, product };
      })
    );
    const customer = sale.customerId
      ? await db
          .select()
          .from(schema.customers)
          .where(eq(schema.customers.id, sale.customerId))
          .then((r) => r[0] || null)
      : null;
    const debt = sale.paymentType === "DEBT"
      ? await db
          .select()
          .from(schema.debts)
          .where(and(eq(schema.debts.saleId, id), eq(schema.debts.tenantId, tenantId)))
          .then((r) => r[0] || null)
      : null;
    return { success: true, data: { ...sale, items: itemsWithProduct, customer, debt } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createSale(data: {
  customerId?: string;
  paymentType: string;
  notes?: string;
  dueDate?: Date;
  items: Array<{
    productId: string;
    serialNumber: string;
    unitPrice: number;
  }>;
}) {
  try {
    const tenantId = await requireTenant();
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.unitPrice,
      0
    );
    const [sale] = await db
      .insert(schema.sales)
      .values({
        customerId: data.customerId || null,
        paymentType: data.paymentType,
        notes: data.notes,
        totalAmount,
        tenantId,
      })
      .returning();
    for (const item of data.items) {
      await db.insert(schema.saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        serialNumber: item.serialNumber,
        unitPrice: item.unitPrice,
      });
      await db
        .update(schema.productSerials)
        .set({ status: "SOLD", saleId: sale.id, updatedAt: new Date() })
        .where(
          and(
            eq(schema.productSerials.serialNumber, item.serialNumber),
            eq(schema.productSerials.productId, item.productId),
            eq(schema.productSerials.tenantId, tenantId)
          )
        );
      await db
        .update(schema.products)
        .set({
          currentStock: sql`${schema.products.currentStock} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.products.id, item.productId),
            eq(schema.products.tenantId, tenantId)
          )
        );
    }
    if (data.paymentType === "DEBT") {
      const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(schema.debts).values({
        saleId: sale.id,
        customerId: data.customerId!,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        dueDate,
        tenantId,
      });
    }
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "CREATE",
      entityType: "sale",
      entityId: sale.id,
      description: `Created sale for ${totalAmount} (${data.paymentType})`,
    });
    return { success: true, data: sale };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteSale(id: string) {
  try {
    const tenantId = await requireTenant();
    const [sale] = await db
      .select()
      .from(schema.sales)
      .where(and(eq(schema.sales.id, id), eq(schema.sales.tenantId, tenantId)));
    if (!sale) return { success: false, error: "Sale not found" };
    const items = await db
      .select()
      .from(schema.saleItems)
      .where(eq(schema.saleItems.saleId, id));
    for (const item of items) {
      await db
        .update(schema.productSerials)
        .set({ status: "AVAILABLE", saleId: null, updatedAt: new Date() })
        .where(
          and(
            eq(schema.productSerials.serialNumber, item.serialNumber),
            eq(schema.productSerials.productId, item.productId),
            eq(schema.productSerials.tenantId, tenantId)
          )
        );
      await db
        .update(schema.products)
        .set({
          currentStock: sql`${schema.products.currentStock} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.products.id, item.productId),
            eq(schema.products.tenantId, tenantId)
          )
        );
    }
    await db
      .delete(schema.saleItems)
      .where(eq(schema.saleItems.saleId, id));
    await db
      .delete(schema.debts)
      .where(and(eq(schema.debts.saleId, id), eq(schema.debts.tenantId, tenantId)));
    await db
      .delete(schema.sales)
      .where(and(eq(schema.sales.id, id), eq(schema.sales.tenantId, tenantId)));
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "DELETE",
      entityType: "sale",
      entityId: sale.id,
      description: `Deleted sale for ${sale.totalAmount}`,
    });
    return { success: true, data: sale };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
