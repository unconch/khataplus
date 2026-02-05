import type { InventoryItem } from "@/lib/types"
import { BoxIcon, ArrowUpDown, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InventoryListProps {
  items: InventoryItem[]
}

export function InventoryList({ items }: InventoryListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border-dashed border-2">
        <BoxIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Stockroom Empty</h3>
        <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
          Begin by adding your first product SKU to the catalog.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <th className="px-4 py-2">Product Details</th>
            <th className="px-4 py-2 hidden md:table-cell">SKU</th>
            <th className="px-4 py-2 text-right">Price</th>
            <th className="px-4 py-2 text-right">Stock</th>
            <th className="px-4 py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="text-sm" style={{ contentVisibility: "auto", containIntrinsicSize: "1px 1000px" }}>
          {items.map((item, idx) => (
            <tr
              key={item.id}
              className={`group glass-card transition-all hover:translate-x-1 duration-200 animate-slide-up`}
              style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
            >
              <td className="px-4 py-3 rounded-l-xl">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground md:hidden">{item.sku}</span>
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-[11px]">
                {item.sku}
              </td>
              <td className="px-4 py-3 text-right font-bold text-foreground">
                ₹{item.buy_price.toLocaleString()}
                <p className="text-[9px] text-muted-foreground font-normal">+{item.gst_percentage}% GST</p>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-base">{item.stock}</span>
                <span className="text-[10px] text-muted-foreground ml-1">qty</span>
              </td>
              <td className="px-4 py-3 rounded-r-xl text-center">
                {item.stock === 0 ? (
                  <Badge variant="destructive" className="text-[9px] uppercase font-bold px-2 py-0">Out</Badge>
                ) : item.stock < 10 ? (
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-[9px] uppercase font-bold px-2 py-0">Low</Badge>
                ) : (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[9px] uppercase font-bold px-2 py-0">Ok</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
