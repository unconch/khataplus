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

export async function logHealthMetric(durationMs: number, operation: string) {
  // If latency is over 500ms, we consider it a performance issue
  if (durationMs > 500) {
    await sql`
      INSERT INTO system_alerts (type, severity, message, timestamp, metadata)
      VALUES (
        'performance', 
        'medium', 
        ${`Slow ${operation} detected: ${durationMs}ms`}, 
        NOW(), 
        ${JSON.stringify({ durationMs, operation })}
      )
    `;
  }
}

export async function checkForFraud(amount: number, userId: string, operation: string) {
  // Simple fraud detection: transactions over 50,000 are flagged
  if (amount > 50000) {
    await sql`
      INSERT INTO system_alerts (type, severity, message, timestamp, metadata)
      VALUES (
        'fraud', 
        'high', 
        ${`High-value transaction flagged: ₹${amount}`}, 
        NOW(), 
        ${JSON.stringify({ amount, userId, operation })}
      )
    `;
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
