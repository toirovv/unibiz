import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireTenant } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";

const entityMap: Record<string, any> = {
  customers: schema.customers,
  products: schema.products,
  sales: schema.sales,
  purchases: schema.purchases,
  debts: schema.debts,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const tenantId = await requireTenant();
    const { entity } = await params;
    const format = req.nextUrl.searchParams.get("format") || "json";

    const table = entityMap[entity];
    if (!table) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const data = await db
      .select()
      .from(table)
      .where(eq(table.tenantId, tenantId));

    if (format === "csv") {
      if (data.length === 0) {
        return new NextResponse("No data", {
          headers: { "Content-Type": "text/csv" },
        });
      }
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((h) => {
              const val = (row as any)[h];
              if (val === null || val === undefined) return "";
              const str = String(val);
              return str.includes(",") ? `"${str}"` : str;
            })
            .join(",")
        ),
      ];
      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${entity}.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
