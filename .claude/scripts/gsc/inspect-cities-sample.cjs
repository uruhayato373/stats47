#!/usr/bin/env node
/**
 * inspect-cities-sample.cjs
 *
 * cities pages (PHASE_1_SSG_CITIES 360 件) からサンプル 50 件を抽出して
 * URL Inspection API で indexed 状況を診断する。
 *
 * 出力:
 *   stdout: 各 URL の verdict / coverageState / lastCrawlTime
 *   /tmp/cities-inspection-sample-YYYY-MM-DD.csv
 *   集計サマリ (PASS/FAIL/coverageState 別)
 *
 * Phase 1 (cities-revival) の Indexed 率検証用。
 * .claude/todo/backlog.md の MUNICIPALITY-SCOPE-SEPARATION-01 に対応
 * (旧 CITY-PAGES-REVIVAL を 2026-08-21 に統合)。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SITE_URL = "sc-domain:stats47.jp";
const SITE_ORIGIN = "https://stats47.jp";
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];

const SAMPLE_SIZE = 50;
const REQUEST_INTERVAL_MS = 400;

// ---------- auth ----------
function loadAuth() {
  const envKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  if (envKeyJson) {
    const credentials = JSON.parse(envKeyJson);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
  }
  const keyFile = KEY_CANDIDATES.map((f) => path.join(PROJECT_ROOT, f)).find((p) =>
    fs.existsSync(p)
  );
  if (!keyFile) {
    console.error("[error] service account key not found");
    process.exit(1);
  }
  return new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

// ---------- sample selection ----------
function loadSampleCities() {
  // stage-1-cities.ts から PHASE_1_SSG_CITIES を読む (TS なので簡易 regex parse)
  const tsPath = path.join(
    PROJECT_ROOT,
    "apps/web/src/features/area-profile/constants/stage-1-cities.ts"
  );
  if (!fs.existsSync(tsPath)) {
    console.error(`[error] stage-1-cities.ts not found: ${tsPath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(tsPath, "utf8");
  // pattern: { areaCode: "01000", cityCode: "01100" }
  const re = /areaCode:\s*"(\d+)"\s*,\s*cityCode:\s*"(\d+)"/g;
  const all = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    all.push({ areaCode: m[1], cityCode: m[2] });
  }
  console.log(`[info] PHASE_1_SSG_CITIES total entries: ${all.length}`);

  // 均等にサンプルする: every n-th entry to hit different prefectures
  const step = Math.max(1, Math.floor(all.length / SAMPLE_SIZE));
  const sample = [];
  for (let i = 0; i < all.length && sample.length < SAMPLE_SIZE; i += step) {
    sample.push(all[i]);
  }
  console.log(`[info] sampled ${sample.length} cities (every ${step})`);
  return sample;
}

// ---------- inspect ----------
async function inspect(searchconsole, inspectionUrl) {
  const res = await searchconsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl,
      siteUrl: SITE_URL,
    },
  });
  return res.data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- main ----------
async function main() {
  const sample = loadSampleCities();
  const auth = loadAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const today = new Date().toISOString().slice(0, 10);
  const outputPath = `/tmp/cities-inspection-sample-${today}.csv`;
  const lines = [
    "url,verdict,coverageState,indexingState,robotsTxtState,lastCrawlTime,pageFetchState,referringUrls",
  ];

  let processed = 0;
  let failed = 0;
  const coverageCount = {};
  const verdictCount = {};

  for (const city of sample) {
    const url = `${SITE_ORIGIN}/areas/${city.areaCode}/cities/${city.cityCode}`;
    try {
      const data = await inspect(searchconsole, url);
      const r = data.inspectionResult?.indexStatusResult || {};
      const verdict = r.verdict || "N/A";
      const coverageState = r.coverageState || "N/A";
      const referring = (r.referringUrls || []).length;

      coverageCount[coverageState] = (coverageCount[coverageState] || 0) + 1;
      verdictCount[verdict] = (verdictCount[verdict] || 0) + 1;

      const esc = (s) => (s && /[,"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s || "");
      lines.push(
        [
          url,
          verdict,
          esc(coverageState),
          r.indexingState || "",
          r.robotsTxtState || "",
          r.lastCrawlTime || "",
          r.pageFetchState || "",
          referring,
        ].join(",")
      );

      processed++;
      console.log(`[${processed}/${sample.length}] ${verdict} | ${coverageState} | refs=${referring} | ${url}`);
    } catch (e) {
      failed++;
      const msg = e.errors?.[0]?.message || e.message;
      console.error(`[ERROR] ${url}: ${msg.slice(0, 120)}`);
      lines.push(`${url},ERROR,"${msg.slice(0, 200).replace(/"/g, "'")}",,,,,`);
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  fs.writeFileSync(outputPath, lines.join("\n") + "\n");

  console.log(`\n========== SUMMARY ==========`);
  console.log(`processed: ${processed} / failed: ${failed}`);
  console.log(`\nVerdict distribution:`);
  for (const [k, v] of Object.entries(verdictCount)) {
    console.log(`  ${k}: ${v} (${((v / processed) * 100).toFixed(0)}%)`);
  }
  console.log(`\nCoverage state distribution:`);
  for (const [k, v] of Object.entries(coverageCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v} (${((v / processed) * 100).toFixed(0)}%)`);
  }
  console.log(`\nCSV: ${outputPath}`);
}

main().catch((e) => {
  console.error(`Fatal: ${e.stack || e.message}`);
  process.exit(2);
});
