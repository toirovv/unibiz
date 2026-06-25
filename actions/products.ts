"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getProducts() {
  try {
    const tenantId = await requireTenant();
    const data = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.tenantId, tenantId))
      .orderBy(schema.products.name);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getProduct(id: string) {
  try {
    const tenantId = await requireTenant();
    const [product] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenantId)));
    if (!product) return { success: false, error: "Product not found" };
    const serials = await db
      .select()
      .from(schema.productSerials)
      .where(
        and(
          eq(schema.productSerials.productId, id),
          eq(schema.productSerials.tenantId, tenantId)
        )
      );
    return { success: true, data: { ...product, serials } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createProduct(data: {
  name: string;
  sku: string;
  category?: string;
  purchasePrice: number;
  salePrice: number;
  serials?: string[];
}) {
  try {
    const tenantId = await requireTenant();
    const { serials: serialNumbers, ...productData } = data;
    const [product] = await db
      .insert(schema.products)
      .values({ ...productData, tenantId })
      .returning();
    if (serialNumbers && serialNumbers.length > 0) {
      await db.insert(schema.productSerials).values(
        serialNumbers.map((sn) => ({
          serialNumber: sn,
          productId: product.id,
          tenantId,
        }))
      );
    }
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "CREATE",
      entityType: "product",
      entityId: product.id,
      description: `Created product ${product.name}`,
    });
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    sku?: string;
    category?: string;
    purchasePrice?: number;
    salePrice?: number;
  }
) {
  try {
    const tenantId = await requireTenant();
    const [product] = await db
      .update(schema.products)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenantId)))
      .returning();
    if (!product) return { success: false, error: "Product not found" };
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "UPDATE",
      entityType: "product",
      entityId: product.id,
      description: `Updated product ${product.name}`,
    });
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function addSerials(productId: string, serialNumbers: string[]) {
  try {
    const tenantId = await requireTenant();
    const [product] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.tenantId, tenantId)));
    if (!product) return { success: false, error: "Product not found" };
    const serials = await db
      .insert(schema.productSerials)
      .values(
        serialNumbers.map((sn) => ({
          serialNumber: sn,
          productId,
          tenantId,
        }))
      )
      .returning();
    return { success: true, data: serials };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteProduct(id: string) {
  try {
    const tenantId = await requireTenant();
    await db
      .delete(schema.productSerials)
      .where(
        and(
          eq(schema.productSerials.productId, id),
          eq(schema.productSerials.tenantId, tenantId)
        )
      );
    const [product] = await db
      .delete(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenantId)))
      .returning();
    if (!product) return { success: false, error: "Product not found" };
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "DELETE",
      entityType: "product",
      entityId: product.id,
      description: `Deleted product ${product.name}`,
    });
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
