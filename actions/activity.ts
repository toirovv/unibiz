"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getActivities() {
  try {
    const tenantId = await requireTenant();
    const data = await db
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.tenantId, tenantId))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(50);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function logActivity(data: {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const [log] = await db
      .insert(schema.activityLogs)
      .values({
        tenantId: data.tenantId,
        userId: data.userId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        description: data.description,
        metadata: data.metadata || null,
      })
      .returning();
    return { success: true, data: log };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
