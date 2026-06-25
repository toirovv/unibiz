"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getDebts() {
  try {
    const tenantId = await requireTenant();
    const data = await db
      .select()
      .from(schema.debts)
      .where(eq(schema.debts.tenantId, tenantId))
      .orderBy(
        asc(schema.debts.status),
        asc(schema.debts.dueDate)
      );
    const withCustomer = await Promise.all(
      data.map(async (d) => {
        const [customer] = await db
          .select()
          .from(schema.customers)
          .where(eq(schema.customers.id, d.customerId));
        return { ...d, customer };
      })
    );
    return { success: true, data: withCustomer };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getDebt(id: string) {
  try {
    const tenantId = await requireTenant();
    const [debt] = await db
      .select()
      .from(schema.debts)
      .where(and(eq(schema.debts.id, id), eq(schema.debts.tenantId, tenantId)));
    if (!debt) return { success: false, error: "Debt not found" };
    const [customer] = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, debt.customerId));
    const payments = await db
      .select()
      .from(schema.debtPayments)
      .where(eq(schema.debtPayments.debtId, id))
      .orderBy(desc(schema.debtPayments.createdAt));
    return { success: true, data: { ...debt, customer, payments } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function makePayment(
  debtId: string,
  data: { amount: number; note?: string }
) {
  try {
    const tenantId = await requireTenant();
    const [debt] = await db
      .select()
      .from(schema.debts)
      .where(and(eq(schema.debts.id, debtId), eq(schema.debts.tenantId, tenantId)));
    if (!debt) return { success: false, error: "Debt not found" };
    const [payment] = await db
      .insert(schema.debtPayments)
      .values({
        debtId,
        amount: data.amount,
        note: data.note,
        tenantId,
      })
      .returning();
    const newPaidAmount = (debt.paidAmount ?? 0) + data.amount;
    const newRemainingAmount = debt.totalAmount - newPaidAmount;
    const updateData: Record<string, unknown> = {
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      updatedAt: new Date(),
    };
    if (newRemainingAmount <= 0) {
      updateData.status = "PAID";
    }
    await db
      .update(schema.debts)
      .set(updateData)
      .where(eq(schema.debts.id, debtId));
    await db.insert(schema.activityLogs).values({
      tenantId,
      action: "PAYMENT",
      entityType: "debt",
      entityId: debtId,
      description: `Payment of ${data.amount} received on debt ${debtId}`,
    });
    return { success: true, data: payment };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
