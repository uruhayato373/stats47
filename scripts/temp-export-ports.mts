import Database from "better-sqlite3";
import fs from "fs";

const DB_PATH =
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

function exportTable(tableName: string, outputPath: string) {
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as Record<string, unknown>[];
  if (rows.length === 0) {
    console.log(`${tableName}: 0 rows, skipping`);
    return;
  }
  const cols = Object.keys(rows[0]);
  const lines = ["PRAGMA foreign_keys=OFF;"];

  for (const row of rows) {
    const vals = cols.map((c) => {
      const v = row[c];
      if (v === null || v === undefined) return "NULL";
      const s = String(v).replace(/'/g, "''");
      // Handle newlines
      if (s.includes("\n")) {
        const parts = s.split("\n");
        return parts.map((p) => "'" + p + "'").join(" || char(10) || ");
      }
      return "'" + s + "'";
    });
    lines.push(
      `INSERT INTO ${tableName} (${cols.join(", ")}) VALUES (${vals.join(", ")});`
    );
  }

  fs.writeFileSync(outputPath, lines.join("\n"));
  console.log(`${tableName}: ${rows.length} rows → ${outputPath}`);
}

exportTable("ports", "/tmp/d1-sync-ports.sql");
exportTable("port_statistics", "/tmp/d1-sync-port_statistics.sql");

// port_statistics は大きいのでチャンク分割
const statLines = fs.readFileSync("/tmp/d1-sync-port_statistics.sql", "utf-8").split("\n");
const CHUNK_SIZE = 500;
const header = statLines[0]; // PRAGMA
const dataLines = statLines.slice(1);
const chunks = Math.ceil(dataLines.length / CHUNK_SIZE);

for (let i = 0; i < chunks; i++) {
  const chunk = dataLines.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
  const content = [header, ...chunk].join("\n");
  fs.writeFileSync(`/tmp/d1-sync-port_statistics_${i}.sql`, content);
  console.log(`  chunk ${i}: ${chunk.length} rows`);
}
console.log(`port_statistics: split into ${chunks} chunks`);

db.close();
