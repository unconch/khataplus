"use server"

import { sql } from "./db";

export interface SystemAlert {
  id: string;
  type: "performance" | "fraud";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: Date;
  metadata?: any;
}

export async function logHealthMetric(durationMs: number, operation: string, db?: any) {
  // If latency is over 500ms, we consider it a performance issue
  if (durationMs > 500) {
    const query = `
      INSERT INTO system_alerts (type, severity, message, timestamp, metadata)
      VALUES (
        'performance', 
        'medium', 
        $1, 
        NOW(), 
        $2
      )
    `;
    const message = `Slow ${operation} detected: ${durationMs}ms`;
    const metadata = JSON.stringify({ durationMs, operation });

    if (db) {
      // @ts-ignore
      await db.query(query, [message, metadata]);
    } else {
      // Use a safe production client that doesn't access cookies()
      const { getProductionSql } = await import("./db");
      const safeSql = getProductionSql();
      // @ts-ignore
      await safeSql.query(query, [message, metadata]);
    }
  }
}

export async function checkForFraud(amount: number, userId: string, operation: string) {
  // Simple fraud detection: transactions over 50,000 are flagged
  if (amount > 50000) {
    const query = `
      INSERT INTO system_alerts (type, severity, message, timestamp, metadata)
      VALUES (
        'fraud', 
        'high', 
        $1, 
        NOW(), 
        $2
      )
    `;
    const message = `High-value transaction flagged: ₹${amount}`;
    const metadata = JSON.stringify({ amount, userId, operation });

    // We use the global sql here because checkForFraud is usually called during write operations (non-cached)
    // But let's use the same safe query pattern to avoid lint issues
    await (sql as any).query(query, [message, metadata]);
    return true;
  }
  return false;
}

export async function getSystemAlerts() {
  const result = await sql`
    SELECT * FROM system_alerts 
    ORDER BY timestamp DESC 
    LIMIT 50
  `;
  return result as unknown as SystemAlert[];
}
