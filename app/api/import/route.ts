import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireTenant } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await requireTenant();
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    let imported = 0;

    if (type === "customers") {
      for (const item of data) {
        await db.insert(schema.customers).values({
          tenantId,
          name: item.name,
          phone: item.phone || null,
          address: item.address || null,
          notes: item.notes || null,
        });
        imported++;
      }
    } else if (type === "products") {
      for (const item of data) {
        await db.insert(schema.products).values({
          tenantId,
          name: item.name,
          sku: item.sku,
          category: item.category || null,
          purchasePrice: Number(item.purchasePrice),
          salePrice: Number(item.salePrice),
        });
        imported++;
      }
    } else {
      return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
