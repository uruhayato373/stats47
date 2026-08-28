import path from "node:path";

import { loadContentOperations } from "../../../apps/admin/lib/content-operations/load";

const root = path.resolve(process.cwd());
const result = loadContentOperations(root);
const asJson = process.argv.includes("--json");

if (asJson) {
  process.stdout.write(JSON.stringify(result.audit, null, 2) + "\n");
} else {
  console.log("# content operations audit");
  console.log(
    `status=${result.audit.status} errors=${result.audit.errors} warnings=${result.audit.warnings}`,
  );
  for (const channel of result.channels) {
    console.log(
      `${channel.channel}: total=${channel.total} draft=${channel.draft} ready=${channel.ready} scheduled=${channel.scheduled} published=${channel.published} blocked=${channel.blocked}`,
    );
  }
  for (const finding of result.audit.findings) {
    console.log(
      `${finding.severity.toUpperCase()} ${finding.code} ${finding.channel}${finding.itemId ? `/${finding.itemId}` : ""}: ${finding.message}`,
    );
  }
}

if (result.audit.errors > 0) process.exitCode = 1;
