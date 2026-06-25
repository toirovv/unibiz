"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getPurchases() {
  try {
    const tenantId = await requireTenant();
    const data = await db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.tenantId, tenantId))
      .orderBy(desc(schema.purchases.createdAt));
    const withCount = await Promise.all(
      data.map(async (p) => {
        const items = await db
          .select()
          .from(schema.purchaseItems)
          .where(eq(schema.purchaseItems.purchaseId, p.id));
        return { ...p, itemCount: items.length };
      })
    );
    return { success: true, data: withCount };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getPurchase(id: string) {
  try {
    const tenantId = await requireTenant();
    const [purchase] = await db
      .select()
      .from(schema.purchases)
      .where(and(eq(schema.purchases.id, id), eq(schema.purchases.tenantId, tenantId)));
    if (!purchase) return { success: false, error: "Purchase not found" };
    const items = await db
      .select()
      .from(schema.purchaseItems)
      .where(eq(schema.purchaseItems.purchaseId, id));
    const itemsWithProduct = await Promise.all(
      items.map(async (item) => {
        const [product] = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.productId));
        return { ...item, product };
      })
    );
    return { success: true, data: { ...purchase, items: itemsWithProduct } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createPurchase(data: {
  supplierName: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}) {
  try {
    const tenantId = await requireTenant();
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const [purchase] = await db
      .insert(schema.purchases)
      .values({
        supplierName: data.supplierName,
        notes: data.notes,
        totalAmount,
        tenantId,
      })
      .returning();
    for (const item of data.items) {
      await db.insert(schema.purchaseItems).values({
        purchaseId: purchase.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      });
      await db
        .update(schema.products)
        .set({
          currentStock: sql`${schema.products.currentStock} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.products.id, item.productId),
            eq(schema.products.tenantId, tenantId)
          )
        );
    }
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "CREATE",
      entityType: "purchase",
      entityId: purchase.id,
      description: `Created purchase from ${data.supplierName} for ${totalAmount}`,
    });
    return { success: true, data: purchase };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deletePurchase(id: string) {
  try {
    const tenantId = await requireTenant();
    const [purchase] = await db
      .select()
      .from(schema.purchases)
      .where(and(eq(schema.purchases.id, id), eq(schema.purchases.tenantId, tenantId)));
    if (!purchase) return { success: false, error: "Purchase not found" };
    const items = await db
      .select()
      .from(schema.purchaseItems)
      .where(eq(schema.purchaseItems.purchaseId, id));
    for (const item of items) {
      await db
        .update(schema.products)
        .set({
          currentStock: sql`${schema.products.currentStock} - ${item.quantity}`,
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
      .delete(schema.purchaseItems)
      .where(eq(schema.purchaseItems.purchaseId, id));
    await db
      .delete(schema.purchases)
      .where(eq(schema.purchases.id, id));
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "DELETE",
      entityType: "purchase",
      entityId: purchase.id,
      description: `Deleted purchase from ${purchase.supplierName}`,
    });
    return { success: true, data: purchase };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
