/**
 * Cloudflare 日次 usage snapshot 取得スクリプト
 *
 * Cloudflare GraphQL Analytics API から R2 / Workers / D1 の使用量を取得し、
 * .claude/state/metrics/cloudflare/snapshots/YYYY-MM-DD.json に保存する。
 *
 * 認証:
 *   .env.local の CLOUDFLARE_API_TOKEN と CLOUDFLARE_ACCOUNT_ID を使用。
 *   token は Account Analytics:Read + Workers Scripts:Read + D1:Read 等が必要。
 *
 * Usage:
 *   node .claude/scripts/cloudflare/fetch-usage.mjs
 *   node .claude/scripts/cloudflare/fetch-usage.mjs --date 2026-04-29
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const SNAPSHOTS_DIR = join(PROJECT_ROOT, ".claude/state/metrics/cloudflare/snapshots");

function loadEnv() {
  const envPath = join(PROJECT_ROOT, ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { date: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date") opts.date = args[++i];
  }
  return opts;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function dayWindow(date) {
  const start = new Date(date + "T00:00:00.000Z");
  const end = new Date(date + "T23:59:59.999Z");
  return { since: start.toISOString(), until: end.toISOString() };
}

async function gql(query, variables) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN が未設定");
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors && json.errors.length) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors).slice(0, 300)}`);
  }
  return json.data;
}

async function fetchD1(accountTag, since, until) {
  const data = await gql(
    `query D1($a: string!, $s: Time!, $u: Time!) {
      viewer { accounts(filter: {accountTag: $a}) {
        d1AnalyticsAdaptiveGroups(filter: {datetime_geq: $s, datetime_leq: $u}, limit: 1000) {
          sum { readQueries writeQueries rowsRead rowsWritten }
          dimensions { databaseId }
        }
      } }
    }`,
    { a: accountTag, s: since, u: until },
  );
  const groups = data.viewer.accounts[0]?.d1AnalyticsAdaptiveGroups || [];
  let readQueries = 0, writeQueries = 0, rowsRead = 0, rowsWritten = 0;
  const databases = new Set();
  for (const g of groups) {
    readQueries += g.sum.readQueries || 0;
    writeQueries += g.sum.writeQueries || 0;
    rowsRead += g.sum.rowsRead || 0;
    rowsWritten += g.sum.rowsWritten || 0;
    if (g.dimensions.databaseId) databases.add(g.dimensions.databaseId);
  }
  return { readQueries, writeQueries, rowsRead, rowsWritten, databases: [...databases] };
}

async function fetchWorkers(accountTag, since, until) {
  const data = await gql(
    `query W($a: string!, $s: Time!, $u: Time!) {
      viewer { accounts(filter: {accountTag: $a}) {
        workersInvocationsAdaptive(filter: {datetime_geq: $s, datetime_leq: $u}, limit: 1000) {
          sum { requests errors subrequests }
          quantiles { cpuTimeP50 cpuTimeP99 wallTimeP50 wallTimeP99 }
          dimensions { scriptName }
        }
      } }
    }`,
    { a: accountTag, s: since, u: until },
  );
  const groups = data.viewer.accounts[0]?.workersInvocationsAdaptive || [];
  const byScript = {};
  for (const g of groups) {
    const name = g.dimensions.scriptName || "unknown";
    if (!byScript[name]) {
      byScript[name] = {
        requests: 0,
        errors: 0,
        subrequests: 0,
        cpu_p50_us: g.quantiles?.cpuTimeP50 ?? null,
        cpu_p99_us: g.quantiles?.cpuTimeP99 ?? null,
        wall_p50_us: g.quantiles?.wallTimeP50 ?? null,
        wall_p99_us: g.quantiles?.wallTimeP99 ?? null,
      };
    }
    byScript[name].requests += g.sum.requests || 0;
    byScript[name].errors += g.sum.errors || 0;
    byScript[name].subrequests += g.sum.subrequests || 0;
  }
  let totalRequests = 0, totalErrors = 0, totalSubrequests = 0;
  for (const s of Object.values(byScript)) {
    totalRequests += s.requests;
    totalErrors += s.errors;
    totalSubrequests += s.subrequests;
  }
  return { totalRequests, totalErrors, totalSubrequests, byScript };
}

async function fetchR2Operations(accountTag, since, until) {
  const data = await gql(
    `query R2Ops($a: string!, $s: Time!, $u: Time!) {
      viewer { accounts(filter: {accountTag: $a}) {
        r2OperationsAdaptiveGroups(filter: {datetime_geq: $s, datetime_leq: $u}, limit: 1000) {
          sum { requests responseObjectSize }
          dimensions { bucketName actionType actionStatus }
        }
      } }
    }`,
    { a: accountTag, s: since, u: until },
  );
  const groups = data.viewer.accounts[0]?.r2OperationsAdaptiveGroups || [];
  const CLASS_A = new Set(["ListBuckets", "PutBucket", "ListObjects", "PutObject", "CopyObject", "CompleteMultipartUpload", "CreateMultipartUpload", "LifecycleStorageTierTransition", "UploadPart", "UploadPartCopy", "PutBucketEncryption", "PutBucketCors", "PutBucketLifecycleConfiguration"]);
  const CLASS_B = new Set(["HeadBucket", "HeadObject", "GetObject", "ReportUsageSummary", "GetBucketEncryption", "GetBucketLocation", "GetBucketCors", "GetBucketLifecycleConfiguration"]);
  let classA = 0, classB = 0, otherOps = 0, totalEgressBytes = 0;
  const byBucket = {};
  for (const g of groups) {
    const bucket = g.dimensions.bucketName || "unknown";
    const action = g.dimensions.actionType || "?";
    const reqs = g.sum.requests || 0;
    const egress = g.sum.responseObjectSize || 0;
    if (CLASS_A.has(action)) classA += reqs;
    else if (CLASS_B.has(action)) classB += reqs;
    else otherOps += reqs;
    totalEgressBytes += egress;
    if (!byBucket[bucket]) byBucket[bucket] = { classA: 0, classB: 0, other: 0, egressBytes: 0 };
    if (CLASS_A.has(action)) byBucket[bucket].classA += reqs;
    else if (CLASS_B.has(action)) byBucket[bucket].classB += reqs;
    else byBucket[bucket].other += reqs;
    byBucket[bucket].egressBytes += egress;
  }
  return { classA, classB, otherOps, totalEgressBytes, byBucket };
}

async function fetchR2Storage(accountTag) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const data = await gql(
    `query R2Stor($a: string!, $s: Time!) {
      viewer { accounts(filter: {accountTag: $a}) {
        r2StorageAdaptiveGroups(filter: {datetime_geq: $s}, limit: 1000) {
          max { metadataSize payloadSize objectCount uploadCount }
          dimensions { bucketName }
        }
      } }
    }`,
    { a: accountTag, s: since },
  );
  const groups = data.viewer.accounts[0]?.r2StorageAdaptiveGroups || [];
  const byBucket = {};
  let totalBytes = 0, totalObjects = 0;
  for (const g of groups) {
    const name = g.dimensions.bucketName;
    if (!name || byBucket[name]) continue;
    const bytes = (g.max.payloadSize || 0) + (g.max.metadataSize || 0);
    const objects = g.max.objectCount || 0;
    byBucket[name] = { bytes, objects, uploads: g.max.uploadCount || 0 };
    totalBytes += bytes;
    totalObjects += objects;
  }
  return { totalBytes, totalObjects, byBucket };
}

async function main() {
  loadEnv();
  const opts = parseArgs();
  const today = new Date();
  today.setUTCDate(today.getUTCDate() - 1);
  const date = opts.date || isoDate(today);
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountTag) throw new Error("CLOUDFLARE_ACCOUNT_ID が未設定");
  const { since, until } = dayWindow(date);

  console.log(`Cloudflare usage snapshot: ${date} (UTC) [${since} - ${until}]`);

  const [d1, workers, r2Ops, r2Storage] = await Promise.all([
    fetchD1(accountTag, since, until),
    fetchWorkers(accountTag, since, until),
    fetchR2Operations(accountTag, since, until),
    fetchR2Storage(accountTag),
  ]);

  const snapshot = {
    date,
    fetched_at: new Date().toISOString(),
    account_tag: accountTag,
    d1,
    workers,
    r2_operations: r2Ops,
    r2_storage: r2Storage,
  };

  mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  const out = join(SNAPSHOTS_DIR, `${date}.json`);
  writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`✅ ${out}`);
  console.log(`   D1: ${d1.readQueries}q / ${d1.rowsRead} rows read | databases=${d1.databases.length}`);
  console.log(`   Workers: ${workers.totalRequests} reqs / ${workers.totalErrors} errors`);
  console.log(`   R2 ops: classA=${r2Ops.classA}, classB=${r2Ops.classB}, egress=${(r2Ops.totalEgressBytes/1e6).toFixed(1)}MB`);
  console.log(`   R2 storage: ${(r2Storage.totalBytes/1e9).toFixed(2)}GB / ${r2Storage.totalObjects.toLocaleString()} objects`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
