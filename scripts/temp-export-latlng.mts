import Database from "better-sqlite3";
import fs from "fs";

const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const db = new Database(DB_PATH);

const ports = db.prepare("SELECT port_code, latitude, longitude FROM ports WHERE latitude IS NOT NULL").all() as Array<{
  port_code: string;
  latitude: number;
  longitude: number;
}>;

const lines: string[] = [];
for (const p of ports) {
  lines.push(`UPDATE ports SET latitude = ${p.latitude}, longitude = ${p.longitude} WHERE port_code = '${p.port_code}';`);
}

fs.writeFileSync("/tmp/d1-update-latlng.sql", lines.join("\n"));
console.log(`Generated ${lines.length} UPDATE statements`);
db.close();
