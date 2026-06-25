import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireTenant } from "@/lib/auth-helpers";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const tenantId = await requireTenant();

    const [customersData, productsData, purchasesData, salesData, debtsData] = await Promise.all([
      db.select().from(schema.customers).where(eq(schema.customers.tenantId, tenantId)),
      db.select().from(schema.products).where(eq(schema.products.tenantId, tenantId)),
      db.select().from(schema.purchases).where(eq(schema.purchases.tenantId, tenantId)),
      db.select().from(schema.sales).where(eq(schema.sales.tenantId, tenantId)),
      db.select().from(schema.debts).where(eq(schema.debts.tenantId, tenantId)),
    ]);

    const purchaseIds = purchasesData.map((p) => p.id);
    const saleIds = salesData.map((s) => s.id);

    const [serialsData, purchaseItemsData, saleItemsData, debtPaymentsData, activityData] = await Promise.all([
      db.select().from(schema.productSerials).where(eq(schema.productSerials.tenantId, tenantId)),
      purchaseIds.length > 0
        ? db.select().from(schema.purchaseItems).where(inArray(schema.purchaseItems.purchaseId, purchaseIds))
        : [],
      saleIds.length > 0
        ? db.select().from(schema.saleItems).where(inArray(schema.saleItems.saleId, saleIds))
        : [],
      db.select().from(schema.debtPayments).where(eq(schema.debtPayments.tenantId, tenantId)),
      db.select().from(schema.activityLogs).where(eq(schema.activityLogs.tenantId, tenantId)),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      data: {
        customers: customersData,
        products: productsData,
        productSerials: serialsData,
        purchases: purchasesData,
        purchaseItems: purchaseItemsData,
        sales: salesData,
        saleItems: saleItemsData,
        debts: debtsData,
        debtPayments: debtPaymentsData,
        activityLogs: activityData,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="unibiz-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
