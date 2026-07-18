import { PREFECTURE_STATISTICS_CATALOG } from "../src/prefecture-statistics-catalog";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CONCURRENCY = 6;
const resources = PREFECTURE_STATISTICS_CATALOG.flatMap((entry) =>
  entry.resources.map((resource) => ({
    prefectureName: entry.prefectureName,
    ...resource,
  })),
);

async function checkResource(resource: (typeof resources)[number]): Promise<string | null> {
  try {
    const response = await fetch(resource.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "user-agent": "stats47-link-check/1.0" },
    });
    if (response.status >= 400 && response.status !== 403) {
      return `${resource.prefectureName}: HTTP ${response.status} ${resource.url}`;
    }
    return null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return `${resource.prefectureName}: ${message} ${resource.url}`;
  }
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
