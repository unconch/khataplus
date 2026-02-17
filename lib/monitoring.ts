"use server"

import { sql } from "./db";

export interface SystemAlert {
  id: string;
  type?: "performance" | "fraud";
  severity?: "low" | "medium" | "high";
  message: string;
  timestamp: Date;
  metadata?: any;
}

type AlertSchema = {
  hasType: boolean;
  hasSeverity: boolean;
  hasTimestamp: boolean;
  hasCreatedAt: boolean;
};

let cachedAlertSchema: AlertSchema | null = null;

async function runQuery(db: any | undefined, query: string, params: any[] = []) {
  if (db?.query) {
    // @ts-ignore
    return await db.query(query, params);
  }

  const { getProductionSql } = await import("./db");
  const safeSql = getProductionSql();
  // @ts-ignore
  return await safeSql.query(query, params);
}

async function getAlertSchema(db?: any): Promise<AlertSchema> {
  if (cachedAlertSchema) return cachedAlertSchema;

  const rows = await runQuery(
    db,
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'system_alerts'"
  );
  const columns = new Set(rows.map((r: any) => String(r.column_name)));

  cachedAlertSchema = {
    hasType: columns.has("type"),
    hasSeverity: columns.has("severity"),
    hasTimestamp: columns.has("timestamp"),
    hasCreatedAt: columns.has("created_at"),
  };

  return cachedAlertSchema;
}

async function insertSystemAlert(
  kind: "performance" | "fraud",
  severity: "low" | "medium" | "high",
  message: string,
  metadata: any,
  db?: any
) {
  try {
    const schema = await getAlertSchema(db);
    const metadataJson = JSON.stringify(metadata ?? {});

    if (schema.hasType && schema.hasSeverity) {
      const query = `
        INSERT INTO system_alerts (type, severity, message, metadata)
        VALUES ($1, $2, $3, $4::jsonb)
      `;
      await runQuery(db, query, [kind, severity, message, metadataJson]);
      return;
    }

    const fallbackQuery = `
      INSERT INTO system_alerts (message, metadata)
      VALUES ($1, $2::jsonb)
    `;
    await runQuery(db, fallbackQuery, [message, metadataJson]);
  } catch (error) {
    // Monitoring should never break business/dashboard flows.
    console.warn("[Monitoring] Failed to insert alert:", error);
  }
}

export async function logHealthMetric(durationMs: number, operation: string, db?: any) {
  // If latency is over 500ms, we consider it a performance issue
  if (durationMs > 500) {
    const message = `Slow ${operation} detected: ${durationMs}ms`;
    await insertSystemAlert("performance", "medium", message, { durationMs, operation }, db);
  }
}

export async function checkForFraud(amount: number, userId: string, operation: string) {
  // Simple fraud detection: transactions over 50,000 are flagged
  if (amount > 50000) {
    const message = `High-value transaction flagged: Rs${amount}`;
    await insertSystemAlert("fraud", "high", message, { amount, userId, operation });
    return true;
  }
  return false;
}

export async function getSystemAlerts() {
  try {
    const schema = await getAlertSchema();
    const orderColumn = schema.hasTimestamp ? "timestamp" : (schema.hasCreatedAt ? "created_at" : "id");
    const query = `SELECT * FROM system_alerts ORDER BY ${orderColumn} DESC LIMIT 50`;
    const result = await runQuery(undefined, query, []);

    return result.map((row: any) => ({
      ...row,
      timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    })) as SystemAlert[];
  } catch (error) {
    console.warn("[Monitoring] Failed to fetch alerts:", error);
    return [];
  }
}
