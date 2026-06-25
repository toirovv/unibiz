"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getSettings() {
  try {
    const tenantId = await requireTenant();
    const [tenant] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId));
    if (!tenant) return { success: false, error: "Tenant not found" };
    return { success: true, data: tenant };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateSettings(data: {
  name?: string;
  telegramChatId?: string;
}) {
  try {
    const tenantId = await requireTenant();
    const [tenant] = await db
      .update(schema.tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId))
      .returning();
    if (!tenant) return { success: false, error: "Tenant not found" };
    return { success: true, data: tenant };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
