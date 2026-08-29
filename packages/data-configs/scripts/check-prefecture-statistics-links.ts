import { PREFECTURE_STATISTICS_CATALOG } from "../src/prefecture-statistics-catalog";
import {
  isAlertVerdict,
  probeLinkWithRetry,
  type LinkProbeTarget,
} from "../src/link-audit/link-check-core";

const MAX_CONCURRENCY = 6;
const resources = PREFECTURE_STATISTICS_CATALOG.flatMap((entry) =>
  entry.resources.map((resource) => ({
    prefectureName: entry.prefectureName,
    ...resource,
  })),
);

async function checkResource(resource: (typeof resources)[number]): Promise<string | null> {
  const target: LinkProbeTarget = {
    targetId: `prefecture-statistics:${resource.id}`,
    label: resource.prefectureName,
    url: resource.url,
    verifiedAt: resource.lastVerifiedAt,
    alertOwner: "open-data-curator",
  };
  const result = await probeLinkWithRetry(target, { userAgent: "stats47-link-check/2.0" });
  return isAlertVerdict(result.verdict)
    ? `[${result.verdict}] ${resource.prefectureName}: ${result.detail} ${resource.url} attempts=${result.attempts}`
    : null;
}

async function main(): Promise<void> {
  const failures: string[] = [];
  for (let offset = 0; offset < resources.length; offset += MAX_CONCURRENCY) {
    const batch = resources.slice(offset, offset + MAX_CONCURRENCY);
    const results = await Promise.all(batch.map(checkResource));
    failures.push(...results.filter((result): result is string => result !== null));
  }

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`prefecture statistics links: ${resources.length} URLs reachable`);
}

void main();
