#!/usr/bin/env node
/**
 * e-Stat getMetaInfo で統計表の次元構造 (CLASS_OBJ) を取得しダンプする。
 *
 * config 生成のキュレーション判断 (どの cat01 スライスを 47 都道府県ランキングにするか) の
 * ための素材。多次元クロス集計テーブルの各次元 (cat01/cat02/.../area/time) とその値一覧を
 * 人 (LLM) が読んで意味あるスライスを選抜する。
 *
 * e-Stat APP_ID は CI 専任 (secrets.NEXT_PUBLIC_ESTAT_APP_ID)。R2/D1 は書かない read-only。
 *
 * Usage:
 *   node .claude/scripts/estat/fetch-estat-meta.mjs --list <statsids.json>
 *   node .claude/scripts/estat/fetch-estat-meta.mjs --ids 0003355476,0003355295
 *
 * 出力: .claude/state/estat/meta/<statsDataId>.json (次元構造の要約)
 *       .claude/state/estat/meta-summary.json        (全テーブルの次元サマリ)
 */

import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ProxyAgent } from "undici";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
config({ path: path.join(PROJECT_ROOT, ".env.local") });

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("❌ NEXT_PUBLIC_ESTAT_APP_ID 未設定 (CI: secrets)");
  process.exit(1);
}

const args = process.argv.slice(2);
function argVal(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

let statsDataIds = [];
const listPath = argVal("--list");
const idsArg = argVal("--ids");
if (listPath) {
  const j = JSON.parse(fs.readFileSync(path.resolve(PROJECT_ROOT, listPath), "utf8"));
  statsDataIds = j.statsDataIds || j;
} else if (idsArg) {
  statsDataIds = idsArg.split(",").map((s) => s.trim()).filter(Boolean);
} else {
  console.error("--list <file.json> か --ids <a,b,c> が必要");
  process.exit(1);
}

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

const BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";
const OUT_DIR = path.join(PROJECT_ROOT, ".claude/state/estat/meta");
const DELAY_MS = 500;

function pickString(v) {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "$" in v) return String(v.$);
  return null;
}

function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

async function fetchMeta(statsDataId) {
  const params = new URLSearchParams({ appId: APP_ID, lang: "J", statsDataId });
  const res = await fetch(`${BASE_URL}?${params.toString()}`, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${statsDataId}`);
  const json = await res.json();
  const meta = json?.GET_META_INFO?.METADATA_INF;
  const result = json?.GET_META_INFO?.RESULT;
  if (!meta) {
    return { statsDataId, error: result?.ERROR_MSG ?? "no METADATA_INF" };
  }
  const tableInf = meta.TABLE_INF ?? {};
  const classObjs = asArray(meta.CLASS_INF?.CLASS_OBJ);
  const dims = classObjs.map((co) => {
    const values = asArray(co.CLASS);
    return {
      id: co["@id"], // cat01 / area / time / cat02 ...
      name: co["@name"],
      valueCount: values.length,
      // 値のサンプル (先頭8 + 「総数」を含むもの)。キュレーション判断用
      sampleValues: values
        .slice(0, 12)
        .map((v) => ({ code: v["@code"], name: v["@name"], unit: v["@unit"] ?? null })),
      hasTotal: values.some((v) => /総数|全体|計$/.test(v["@name"] ?? "")),
    };
  });
  return {
    statsDataId,
    title: pickString(tableInf.TITLE) ?? pickString(tableInf.STATISTICS_NAME) ?? "",
    statName: pickString(tableInf.STAT_NAME) ?? "",
    govOrg: pickString(tableInf.GOV_ORG) ?? null,
    surveyDate: pickString(tableInf.SURVEY_DATE) ?? null,
    overallTotalNumber: tableInf.OVERALL_TOTAL_NUMBER ?? null,
    dimensions: dims,
  };
}

async function main() {
  console.log(`📐 getMetaInfo: ${statsDataIds.length} テーブル`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const summaries = [];
  for (const id of statsDataIds) {
    try {
      const m = await fetchMeta(id);
      fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify(m, null, 1));
      if (m.error) {
        console.log(`  ${id}: ⚠️ ${m.error}`);
      } else {
        const dimStr = m.dimensions
          .map((d) => `${d.id}(${d.valueCount}${d.hasTotal ? "+総数" : ""})`)
          .join(" ");
        console.log(`  ${id}: ${m.title.slice(0, 40)} | dims: ${dimStr}`);
      }
      summaries.push(
        m.error
          ? { statsDataId: id, error: m.error }
          : {
              statsDataId: id,
              title: m.title,
              dims: m.dimensions.map((d) => ({
                id: d.id,
                name: d.name,
                valueCount: d.valueCount,
                hasTotal: d.hasTotal,
              })),
            },
      );
    } catch (e) {
      console.log(`  ${id}: ❌ ${e.message}`);
      summaries.push({ statsDataId: id, error: e.message });
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  fs.writeFileSync(
    path.join(PROJECT_ROOT, ".claude/state/estat/meta-summary.json"),
    JSON.stringify(summaries, null, 2),
  );
  console.log(`\n  → .claude/state/estat/meta/*.json (${statsDataIds.length} 件)`);
  console.log(`  → .claude/state/estat/meta-summary.json`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
