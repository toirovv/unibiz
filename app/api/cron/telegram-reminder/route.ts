import { NextResponse } from "next/server";
import { db } from "@/db";
import { tenants, debts, customers } from "@/db/schema";
import { eq, and, or, lte } from "drizzle-orm";
import { sendMessage, formatDebtReminder } from "@/lib/telegram";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
    }

    const allTenants = await db.select().from(tenants);
    let successCount = 0;
    let failCount = 0;

    for (const tenant of allTenants) {
      if (!tenant.telegramChatId) continue;

      const dueDebts = await db
        .select({
          customerName: customers.name,
          amount: debts.totalAmount,
          remainingAmount: debts.remainingAmount,
          dueDate: debts.dueDate,
          status: debts.status,
        })
        .from(debts)
        .innerJoin(customers, eq(debts.customerId, customers.id))
        .where(
          and(
            eq(debts.tenantId, tenant.id),
            or(
              eq(debts.status, "OVERDUE"),
              and(eq(debts.status, "ACTIVE"), lte(debts.dueDate, today))
            )
          )
        );

      const message = formatDebtReminder(dueDebts);
      const sent = await sendMessage(token, tenant.telegramChatId, message);
      if (sent) successCount++;
      else failCount++;
    }

    return NextResponse.json({ success: true, sent: successCount, failed: failCount });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
