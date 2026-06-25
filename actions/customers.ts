"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getCustomers() {
  try {
    const tenantId = await requireTenant();
    const data = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.tenantId, tenantId))
      .orderBy(desc(schema.customers.createdAt));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getCustomer(id: string) {
  try {
    const tenantId = await requireTenant();
    const [customer] = await db
      .select()
      .from(schema.customers)
      .where(and(eq(schema.customers.id, id), eq(schema.customers.tenantId, tenantId)));
    if (!customer) return { success: false, error: "Customer not found" };
    const debts = await db
      .select()
      .from(schema.debts)
      .where(and(eq(schema.debts.customerId, id), eq(schema.debts.tenantId, tenantId)));
    const debtTotal = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    return { success: true, data: { ...customer, debtTotal } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  try {
    const tenantId = await requireTenant();
    const [customer] = await db
      .insert(schema.customers)
      .values({ ...data, tenantId })
      .returning();
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "CREATE",
      entityType: "customer",
      entityId: customer.id,
      description: `Created customer ${customer.name}`,
    });
    return { success: true, data: customer };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateCustomer(
  id: string,
  data: { name?: string; phone?: string; address?: string; notes?: string }
) {
  try {
    const tenantId = await requireTenant();
    const [customer] = await db
      .update(schema.customers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(schema.customers.id, id), eq(schema.customers.tenantId, tenantId)))
      .returning();
    if (!customer) return { success: false, error: "Customer not found" };
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "UPDATE",
      entityType: "customer",
      entityId: customer.id,
      description: `Updated customer ${customer.name}`,
    });
    return { success: true, data: customer };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const tenantId = await requireTenant();
    const [customer] = await db
      .delete(schema.customers)
      .where(and(eq(schema.customers.id, id), eq(schema.customers.tenantId, tenantId)))
      .returning();
    if (!customer) return { success: false, error: "Customer not found" };
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "DELETE",
      entityType: "customer",
      entityId: customer.id,
      description: `Deleted customer ${customer.name}`,
    });
    return { success: true, data: customer };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
