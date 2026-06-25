"use server";

import { db } from "@/db";
import { schema } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireTenant } from "@/lib/auth-helpers";

export async function getDashboardStats() {
  try {
    const tenantId = await requireTenant();
    const [salesResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(total_amount), 0)` })
      .from(schema.sales)
      .where(eq(schema.sales.tenantId, tenantId));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [todayResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(total_amount), 0)` })
      .from(schema.sales)
      .where(
        and(
          eq(schema.sales.tenantId, tenantId),
          sql`${schema.sales.createdAt} >= ${todayStart}`
        )
      );
    const [customerCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.customers)
      .where(eq(schema.customers.tenantId, tenantId));
    const [productCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.products)
      .where(eq(schema.products.tenantId, tenantId));
    const [activeDebtCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.debts)
      .where(
        and(
          eq(schema.debts.tenantId, tenantId),
          eq(schema.debts.status, "ACTIVE")
        )
      );
    const recentSales = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.tenantId, tenantId))
      .orderBy(desc(schema.sales.createdAt))
      .limit(10);
    const recentWithCustomer = await Promise.all(
      recentSales.map(async (s) => {
        if (s.customerId) {
          const [customer] = await db
            .select()
            .from(schema.customers)
            .where(eq(schema.customers.id, s.customerId));
          return { ...s, customer };
        }
        return { ...s, customer: null };
      })
    );
    const topProductsData = await db
      .select({
        productId: schema.saleItems.productId,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.saleItems)
      .innerJoin(
        schema.sales,
        eq(schema.saleItems.saleId, schema.sales.id)
      )
      .where(eq(schema.sales.tenantId, tenantId))
      .groupBy(schema.saleItems.productId)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);
    const topProducts = await Promise.all(
      topProductsData.map(async (tpd) => {
        const [product] = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, tpd.productId));
        return { product, count: tpd.count };
      })
    );
    return {
      success: true,
      data: {
        totalSales: salesResult.total,
        todaySales: todayResult.total,
        totalCustomers: customerCount.count,
        totalProducts: productCount.count,
        activeDebts: activeDebtCount.count,
        recentSales: recentWithCustomer,
        topProducts,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
