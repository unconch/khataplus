import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const orgId = process.argv[2] || "ae1e01af-655b-4fb6-baec-6cd3c577d971";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL missing");
const sql = neon(connectionString);

const byKey: Record<string, string[]> = {
  "RICE-5KG": ["Daawat Basmati Rice 5kg", "India Gate Basmati Rice 5kg", "Fortune Basmati Rice 5kg", "Kohinoor Basmati Rice 5kg"],
  "ATTA-10KG": ["Aashirvaad Atta 10kg", "Pillsbury Atta 10kg", "Fortune Chakki Fresh Atta 10kg", "Annapurna Atta 10kg"],
  "DAL-MOONG": ["Tata Sampann Moong Dal 1kg", "Fortune Moong Dal 1kg", "24 Mantra Moong Dal 1kg", "BB Royal Moong Dal 1kg"],
  "DAL-TOOR": ["Tata Sampann Toor Dal 1kg", "Fortune Toor Dal 1kg", "Organic Tattva Toor Dal 1kg", "BB Royal Toor Dal 1kg"],
  "SUGAR-1KG": ["Madhur Sugar 1kg", "Dhampur Sugar 1kg", "Trust Sugar 1kg", "Uttam Sugar 1kg"],
  "SALT-1KG": ["Tata Salt 1kg", "Aashirvaad Salt 1kg", "Catch Salt 1kg", "Nirma Salt 1kg"],
  "OIL-MUST-1L": ["Fortune Mustard Oil 1L", "Engine Mustard Oil 1L", "P Mark Mustard Oil 1L", "Dhara Mustard Oil 1L"],
  "OIL-SUN-1L": ["Fortune Sunlite Oil 1L", "Saffola Gold Oil 1L", "Dhara Sunflower Oil 1L", "Gemini Sunflower Oil 1L"],
  "TEA-500G": ["Tata Tea Gold 500g", "Red Label Tea 500g", "Brooke Bond Taj Mahal 500g", "Wagh Bakri Tea 500g"],
  "COFFEE-100G": ["Nescafe Classic 100g", "Bru Instant Coffee 100g", "Continental Coffee 100g", "Sleepy Owl Instant Coffee 100g"],
  "BISCUIT-GLU": ["Parle-G Biscuits", "Britannia Tiger Biscuits", "Sunfeast Glucose Biscuits", "Priyagold Biscuits"],
  "SOAP-BATH": ["Lux Bath Soap 125g", "Pears Soap 125g", "Cinthol Soap 125g", "Lifebuoy Soap 125g"],
  "SHAMPOO-100": ["Clinic Plus Shampoo 100ml", "Dove Shampoo 100ml", "Sunsilk Shampoo 100ml", "Pantene Shampoo 100ml"],
  "PASTE-150": ["Colgate Toothpaste 150g", "Pepsodent Toothpaste 150g", "Dabur Red Toothpaste 150g", "Sensodyne Toothpaste 150g"],
  "NOODLES-70": ["Maggi Instant Noodles 70g", "Yippee Instant Noodles 70g", "Top Ramen Instant Noodles 70g", "Ching's Instant Noodles 70g"],
  "CHIPS-50": ["Lays Chips 50g", "Bingo Chips 50g", "Kurkure Chips 50g", "Haldiram's Chips 50g"],
  "MILK-1L": ["Amul Toned Milk 1L", "Mother Dairy Toned Milk 1L", "Nandini Toned Milk 1L", "Verka Toned Milk 1L"],
  "CURD-400": ["Amul Curd 400g", "Mother Dairy Curd 400g", "Nandini Curd 400g", "Milky Mist Curd 400g"],
  "EGGS-12": ["Farm Fresh Eggs 12pcs", "Suguna Eggs 12pcs", "Eggoz Eggs 12pcs", "Healthy Brown Eggs 12pcs"],
  "BREAD-WHITE": ["Britannia White Bread", "Harvest Gold White Bread", "Modern White Bread", "English Oven White Bread"],
};

function keyFromSku(sku: string) {
  // GRC-<KEY>-<seed>-<rand>
  const m = sku.match(/^GRC-([A-Z0-9-]+)-\d{5}-\d{2}$/);
  if (m) return m[1];
  // fallback for unexpected suffix formats
  const parts = sku.split("-");
  if (parts.length >= 4 && parts[0] === "GRC") return parts.slice(1, 3).join("-");
  return null;
}

async function run() {
  const rows = await sql`
    SELECT id, sku, name
    FROM inventory
    WHERE org_id = ${orgId}
    ORDER BY created_at ASC
  `;

  const grouped = new Map<string, any[]>();
  for (const r of rows as any[]) {
    const key = keyFromSku(String(r.sku || ""));
    if (!key || !byKey[key]) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  let updates = 0;
  for (const [key, items] of grouped.entries()) {
    const names = byKey[key];
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const nextName = names[i % names.length];
      await sql`UPDATE inventory SET name = ${nextName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${row.id} AND org_id = ${orgId}`;
      updates++;
    }
  }

  console.log(`Updated ${updates} inventory rows to brand-wise names for org ${orgId}.`);

  const sample = await sql`
    SELECT name, sku, stock
    FROM inventory
    WHERE org_id = ${orgId}
    ORDER BY name ASC
    LIMIT 20
  `;
  console.table(sample);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
