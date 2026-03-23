import { Client } from "@neondatabase/serverless";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });

async function main() {
  const url = process.env.DEMO_DATABASE_URL;

  if (!url) {
    console.error("DEMO_DATABASE_URL is not defined in .env.local");
    process.exit(1);
  }

  const client = new Client(url);

  try {
    await client.connect();

    const schemaPath = path.join(process.cwd(), "scripts", "017_demo_feature_requests.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("Applying demo feature request schema...");
    await client.query(schemaSql);
    console.log("Demo feature request schema applied successfully.");
  } catch (error) {
    console.error("Failed to apply demo feature request schema:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
