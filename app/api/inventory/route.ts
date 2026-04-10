import { NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/data/inventory";
import { updateInventoryStock } from "@/lib/data/inventory";
import { archiveInventoryItem } from "@/lib/data/inventory";
import { addInventoryItem } from "@/lib/data/inventory";
import { authorize } from "@/lib/security";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
        return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    try {
        await authorize("View Inventory", undefined, orgId);
        const inventory = await getInventory(orgId);
        return NextResponse.json({ inventory });
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const id = typeof body?.id === "string" ? body.id : "";
        const orgId = typeof body?.orgId === "string" ? body.orgId : "";
        const newStock = Number.parseInt(String(body?.newStock), 10);

        if (!id || !orgId) {
            return NextResponse.json({ error: "Missing id or orgId" }, { status: 400 });
        }

        if (!Number.isFinite(newStock) || newStock < 0) {
            return NextResponse.json({ error: "Invalid stock value" }, { status: 400 });
        }

        await updateInventoryStock(id, newStock, orgId);
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Failed to update stock:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to update stock" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const id = typeof body?.id === "string" ? body.id : "";
        const orgId = typeof body?.orgId === "string" ? body.orgId : "";

        if (!orgId) {
            return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
        }

        if (id) {
            await archiveInventoryItem(id, orgId);
            return NextResponse.json({ ok: true });
        }

        const sku = typeof body?.sku === "string" ? body.sku.trim() : "";
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const buyPrice = Number(body?.buy_price);
        const sellPrice = body?.sell_price === null || body?.sell_price === undefined || body?.sell_price === ""
            ? undefined
            : Number(body?.sell_price);
        const gstPercentage = Number(body?.gst_percentage ?? 0);
        const stock = Number(body?.stock);

        if (!sku || !name) {
            return NextResponse.json({ error: "SKU and name are required" }, { status: 400 });
        }
        if (!Number.isFinite(buyPrice) || buyPrice < 0) {
            return NextResponse.json({ error: "Invalid buy price" }, { status: 400 });
        }
        if (sellPrice !== undefined && (!Number.isFinite(sellPrice) || sellPrice < 0)) {
            return NextResponse.json({ error: "Invalid selling price" }, { status: 400 });
        }
        if (!Number.isFinite(gstPercentage) || gstPercentage < 0 || gstPercentage > 100) {
            return NextResponse.json({ error: "Invalid GST percentage" }, { status: 400 });
        }
        if (!Number.isFinite(stock) || stock < 0) {
            return NextResponse.json({ error: "Invalid opening stock" }, { status: 400 });
        }

        const item = await addInventoryItem({
            sku,
            name,
            buy_price: buyPrice,
            sell_price: sellPrice,
            gst_percentage: gstPercentage,
            stock,
            org_id: orgId,
        }, orgId);

        return NextResponse.json({ ok: true, item }, { status: 201 });
    } catch (error: any) {
        console.error("Failed to save inventory item:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to save inventory item" },
            { status: 500 }
        );
    }
}
