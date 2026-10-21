#!/usr/bin/env node
/**
 * inspect-cities-sample.cjs
 *
 * 公開中の市区町村ページ (data/content/pages/city.json の published。市区町村の対象集合) からサンプル 50 件を抽出して
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
const { GSC_PROPERTY, SITE_ORIGIN } = require("../lib/site-config.cjs");
const { createSearchConsoleClient } = require("../lib/google-client.cjs");
const { datasetDir } = require("../../../config/datasets.mjs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SITE_URL = GSC_PROPERTY;

const SAMPLE_SIZE = 50;
const REQUEST_INTERVAL_MS = 400;

// ---------- sample selection ----------
function loadSampleCities() {
  // 公開対象はコンテンツ索引 (sync-content-catalog.ts が市区町村の対象集合から生成) を読む
  const catalogPath = path.join(PROJECT_ROOT, datasetDir("content.pages"), "city.json");
  if (!fs.existsSync(catalogPath)) {
    console.error(`[error] city catalog not found: ${catalogPath}`);
    process.exit(1);
  }
  const all = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
    .pages.filter((page) => page.published)
    .map((page) => {
      const [, areaCode, cityCode] = page.id.split(":");
      return { areaCode, cityCode };
    });
  console.log(`[info] publishable city pages: ${all.length}`);

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
  const searchconsole = createSearchConsoleClient();

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
