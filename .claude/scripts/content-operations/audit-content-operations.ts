import path from "node:path";

import { loadContentOperations } from "../../../apps/admin/lib/content-operations/load";

const root = path.resolve(process.cwd());
const result = loadContentOperations(root);
const asJson = process.argv.includes("--json");

if (asJson) {
  process.stdout.write(
    JSON.stringify(
      {
        content: result.audit,
        references: result.references.audit,
        referenceSummary: result.references.summary,
      },
      null,
      2,
    ) + "\n",
  );
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
  const reference = result.references;
  console.log(
    `references: sources=${reference.sources.length} sourceItems=${reference.summary.sourceItems} units=${reference.summary.productionUnits} integrated=${reference.summary.integratedSlots} draft=${reference.summary.draftSlots} ready=${reference.summary.readySlots} blocked=${reference.summary.blockedSlots}`,
  );
  for (const channel of ["site", "blog", "note", "kindle"] as const) {
    const summary = reference.summary.byChannel[channel];
    console.log(
      `reference/${channel}: integrated=${summary.integrated} draft=${summary.draft} ready=${summary.ready} blocked=${summary.blocked} not-applicable=${summary["not-applicable"]}`,
    );
  }
  for (const finding of reference.audit.findings) {
    console.log(
      `${finding.severity.toUpperCase()} ${finding.code} reference${finding.itemId ? `/${finding.itemId}` : ""}: ${finding.message}`,
    );
  }
  for (const finding of result.audit.findings) {
    console.log(
      `${finding.severity.toUpperCase()} ${finding.code} ${finding.channel}${finding.itemId ? `/${finding.itemId}` : ""}: ${finding.message}`,
    );
  }
}

if (
  result.audit.errors > 0 ||
  result.references.audit.findings.some((finding) => finding.severity === "error")
) {
  process.exitCode = 1;
}
