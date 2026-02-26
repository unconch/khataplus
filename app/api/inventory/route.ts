import { NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/data/inventory";
import { updateInventoryStock } from "@/lib/data/inventory";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
        return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    try {
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
