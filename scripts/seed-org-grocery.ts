import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const orgId = process.argv[2] || "ae1e01af-655b-4fb6-baec-6cd3c577d971";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in .env.local/.env");
  process.exit(1);
}

const sql = neon(connectionString);

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const choose = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function daysAgoDateOnly(daysAgo: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function ensureOrgExists(id: string) {
  const existing = await sql`SELECT id, name FROM organizations WHERE id = ${id} LIMIT 1`;
  if (existing.length > 0) {
    console.log(`Using existing org: ${existing[0].name} (${id})`);
    return;
  }

  const slug = `grocery-${id.slice(0, 8)}`;
  await sql`
    INSERT INTO organizations (id, name, slug, created_by)
    VALUES (${id}, 'Grocery Shop', ${slug}, 'system')
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`Created org ${id} with slug ${slug}`);
}

async function seed() {
  await ensureOrgExists(orgId);

  const salesCols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales'
  `;
  const salesColSet = new Set((salesCols as any[]).map((r: any) => String(r.column_name)));
  const hasPaymentMethod = salesColSet.has("payment_method");

  const inventorySeed = [
    ["RICE-5KG", "Basmati Rice 5kg", 620, 5, 110],
    ["ATTA-10KG", "Wheat Flour 10kg", 390, 5, 95],
    ["DAL-MOONG", "Moong Dal 1kg", 110, 5, 130],
    ["DAL-TOOR", "Toor Dal 1kg", 140, 5, 120],
    ["SUGAR-1KG", "Sugar 1kg", 42, 5, 220],
    ["SALT-1KG", "Iodized Salt 1kg", 20, 0, 250],
    ["OIL-MUST-1L", "Mustard Oil 1L", 165, 5, 140],
    ["OIL-SUN-1L", "Sunflower Oil 1L", 150, 5, 130],
    ["TEA-500G", "CTC Tea 500g", 190, 5, 90],
    ["COFFEE-100G", "Instant Coffee 100g", 145, 18, 80],
    ["BISCUIT-GLU", "Glucose Biscuits Pack", 8, 18, 350],
    ["SOAP-BATH", "Bath Soap 125g", 28, 18, 260],
    ["SHAMPOO-100", "Shampoo 100ml", 58, 18, 180],
    ["PASTE-150", "Toothpaste 150g", 68, 18, 170],
    ["NOODLES-70", "Instant Noodles 70g", 12, 18, 300],
    ["CHIPS-50", "Potato Chips 50g", 20, 18, 240],
    ["MILK-1L", "Toned Milk 1L", 58, 0, 90],
    ["CURD-400", "Curd 400g", 35, 0, 80],
    ["EGGS-12", "Eggs Tray 12pcs", 72, 0, 70],
    ["BREAD-WHITE", "White Bread", 34, 0, 95],
  ] as const;

  const skuSuffix = Date.now().toString().slice(-5);

  const inventoryRows: any[] = [];
  for (const item of inventorySeed) {
    const [skuBase, name, buyPrice, gst, stock] = item;
    const sku = `GRC-${skuBase}-${skuSuffix}-${randomInt(10, 99)}`;
    const rows = await sql`
      INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock, org_id)
      VALUES (${sku}, ${name}, ${buyPrice}, ${gst}, ${stock}, ${orgId})
      RETURNING id, sku, name, buy_price, gst_percentage, stock
    `;
    inventoryRows.push(rows[0]);
  }

  const customerNames = [
    "Rohit Das", "Ankita Sharma", "Pooja Verma", "Kunal Bora", "Rina Das", "Aman Gupta", "Sanjay Nath", "Kriti Jain", "Nikhil Dey", "Mitali Roy",
  ];

  const customers: any[] = [];
  for (let i = 0; i < 10; i++) {
    const phone = `9${randomInt(100000000, 999999999)}`;
    const rows = await sql`
      INSERT INTO customers (name, phone, address, org_id)
      VALUES (${customerNames[i]}, ${phone}, ${`Lane ${randomInt(1, 30)}, Market Area`}, ${orgId})
      RETURNING id, name
    `;
    customers.push(rows[0]);
  }

  const supplierNames = ["FreshFarm Traders", "NorthEast Staples", "DailyNeeds Distributors", "Prime FMCG Supply", "Metro Wholesale"];
  const suppliers: any[] = [];
  for (let i = 0; i < supplierNames.length; i++) {
    const phone = `8${randomInt(100000000, 999999999)}`;
    const rows = await sql`
      INSERT INTO suppliers (name, phone, address, gstin, org_id)
      VALUES (${supplierNames[i]}, ${phone}, ${`Warehouse ${i + 1}, Industrial Zone`}, ${`18ABCDE${randomInt(1000, 9999)}F1Z${randomInt(1, 9)}`}, ${orgId})
      RETURNING id, name
    `;
    suppliers.push(rows[0]);
  }

  const stockTracker = new Map<string, number>();
  for (const inv of inventoryRows) stockTracker.set(inv.id, Number(inv.stock));

  const soldByInventory = new Map<string, number>();
  const salesInsertedByDate = new Map<string, { gross: number; cost: number; cash: number; online: number }>();

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const saleDate = daysAgoDateOnly(daysAgo);
    const salesCount = randomInt(10, 24);

    let gross = 0;
    let cost = 0;
    let cash = 0;
    let online = 0;

    for (let s = 0; s < salesCount; s++) {
      const inv = choose(inventoryRows);
      const currentStock = stockTracker.get(inv.id) || 0;
      if (currentStock <= 3) continue;

      const qty = randomInt(1, Math.min(4, currentStock - 1));
      const buyPrice = Number(inv.buy_price);
      const gstPct = Number(inv.gst_percentage || 0);
      const salePrice = Number((buyPrice * randomFloat(1.08, 1.32)).toFixed(2));
      const taxable = Number((salePrice * qty).toFixed(2));
      const gstAmount = Number((taxable * (gstPct / 100)).toFixed(2));
      const totalAmount = Number((taxable + gstAmount).toFixed(2));
      const profit = Number((taxable - buyPrice * qty).toFixed(2));

      const paymentMethod = Math.random() < 0.45 ? "Cash" : (Math.random() < 0.85 ? "UPI" : "Credit");

      if (hasPaymentMethod) {
        await sql`
          INSERT INTO sales (
            inventory_id, quantity, sale_price, total_amount, gst_amount, profit, sale_date, payment_method, org_id
          ) VALUES (
            ${inv.id}, ${qty}, ${salePrice}, ${totalAmount}, ${gstAmount}, ${profit}, ${saleDate}, ${paymentMethod}, ${orgId}
          )
        `;
      } else {
        await sql`
          INSERT INTO sales (
            inventory_id, quantity, sale_price, total_amount, gst_amount, profit, sale_date, org_id
          ) VALUES (
            ${inv.id}, ${qty}, ${salePrice}, ${totalAmount}, ${gstAmount}, ${profit}, ${saleDate}, ${orgId}
          )
        `;
      }

      stockTracker.set(inv.id, currentStock - qty);
      soldByInventory.set(inv.id, (soldByInventory.get(inv.id) || 0) + qty);

      gross += totalAmount;
      cost += buyPrice * qty;
      if (paymentMethod === "Cash") cash += totalAmount;
      else online += totalAmount;
    }

    salesInsertedByDate.set(saleDate, { gross, cost, cash, online });

    const expenseTotal = Number(randomFloat(120, 950).toFixed(2));
    const expenseSplits = [
      ["Electricity", randomFloat(30, 180)],
      ["Transport", randomFloat(20, 160)],
      ["Maintenance", randomFloat(15, 120)],
      ["Packaging", randomFloat(10, 90)],
    ] as const;

    let remaining = expenseTotal;
    for (let i = 0; i < expenseSplits.length; i++) {
      const [cat, base] = expenseSplits[i];
      const amount = i === expenseSplits.length - 1 ? remaining : Number(Math.min(remaining, base).toFixed(2));
      remaining = Number((remaining - amount).toFixed(2));

      await sql`
        INSERT INTO expenses (category, amount, description, expense_date, org_id)
        VALUES (${cat}, ${amount}, ${`${cat} expense`}, ${saleDate}, ${orgId})
      `;
    }
  }

  for (const c of customers.slice(0, 6)) {
    const credit = Number(randomFloat(800, 4200).toFixed(2));
    const payment = Number(randomFloat(200, credit * 0.6).toFixed(2));
    await sql`
      INSERT INTO khata_transactions (customer_id, type, amount, note, org_id)
      VALUES (${c.id}, 'credit', ${credit}, 'Grocery credit purchases', ${orgId})
    `;
    await sql`
      INSERT INTO khata_transactions (customer_id, type, amount, note, org_id)
      VALUES (${c.id}, 'payment', ${payment}, 'Partial khata payment', ${orgId})
    `;
  }

  for (const s of suppliers) {
    const purchase = Number(randomFloat(5000, 22000).toFixed(2));
    const paid = Number(randomFloat(1200, purchase * 0.7).toFixed(2));
    await sql`
      INSERT INTO supplier_transactions (supplier_id, type, amount, note, org_id)
      VALUES (${s.id}, 'purchase', ${purchase}, 'Bulk stock purchase', ${orgId})
    `;
    await sql`
      INSERT INTO supplier_transactions (supplier_id, type, amount, note, org_id)
      VALUES (${s.id}, 'payment', ${paid}, 'Supplier payment', ${orgId})
    `;
  }

  await sql`
    DELETE FROM daily_reports
    WHERE org_id = ${orgId}
      AND report_date >= ${daysAgoDateOnly(29)}::date
  `;

  for (const [date, agg] of salesInsertedByDate.entries()) {
    const expRows = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total
      FROM expenses
      WHERE org_id = ${orgId} AND expense_date::date = ${date}::date
    `;
    const expenses = Number(expRows[0]?.total || 0);
    const onlineCost = agg.gross > 0 ? Number(((agg.cost * agg.online) / agg.gross).toFixed(2)) : 0;

    await sql`
      INSERT INTO daily_reports (
        report_date, total_sale_gross, total_cost, expenses, cash_sale, online_sale, online_cost, org_id
      ) VALUES (
        ${date}, ${agg.gross}, ${agg.cost}, ${expenses}, ${agg.cash}, ${agg.online}, ${onlineCost}, ${orgId}
      )
    `;
  }

  for (const inv of inventoryRows) {
    const sold = soldByInventory.get(inv.id) || 0;
    await sql`UPDATE inventory SET stock = GREATEST(stock - ${sold}, 0) WHERE id = ${inv.id} AND org_id = ${orgId}`;
  }

  const [invCount, salesCount, expCount, custCount, supCount, reportsCount] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM inventory WHERE org_id = ${orgId}`,
    sql`SELECT COUNT(*)::int AS c FROM sales WHERE org_id = ${orgId}`,
    sql`SELECT COUNT(*)::int AS c FROM expenses WHERE org_id = ${orgId}`,
    sql`SELECT COUNT(*)::int AS c FROM customers WHERE org_id = ${orgId}`,
    sql`SELECT COUNT(*)::int AS c FROM suppliers WHERE org_id = ${orgId}`,
    sql`SELECT COUNT(*)::int AS c FROM daily_reports WHERE org_id = ${orgId}`,
  ]);

  console.log("Seed complete for org:", orgId);
  console.log({
    inventory: invCount[0].c,
    sales: salesCount[0].c,
    expenses: expCount[0].c,
    customers: custCount[0].c,
    suppliers: supCount[0].c,
    daily_reports: reportsCount[0].c,
  });
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
