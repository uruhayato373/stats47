#!/usr/bin/env node
/**
 * 中学部活動 100人あたり部員数 (競技別) の投入スクリプト。
 *
 * 出典: 公益財団法人日本中学校体育連盟 (中体連)
 *   「加盟校・加盟生徒数調査集計表」令和7年度 (令和7年6月1日現在・回答率100%)
 *   https://nippon-chutairen.or.jp/data/result/
 *
 * ライセンス: [要確認] 中体連サイトに利用規約の明文なし。加盟生徒数は事実(ファクト)として
 *   出典明記のうえ利用する。問題指摘があれば速やかに取り下げる (オーナー承認済み・2026-07-20)。
 *
 * 手順:
 *   1. 中体連「加盟校・加盟生徒数調査集計表」令和7年度版 PDF を fetch
 *   2. pdftotext -layout で 5ページ目(加盟生徒数 男子)・6ページ目(同 女子) をテキスト化
 *   3. 47都道府県 × 19競技 の値を抽出し、各行の競技合計=「男子合計/女子合計」列、
 *      および全国計 (PDF巻末「総合計」行、本スクリプトにハードコード) と突合 (検算)
 *   4. 検算に通った競技のみ、男女合算値を求め、中学校生徒数 (既存 metric
 *      junior-high-school-students-count, R2 app/stats, 2024年度) で「100人あたり」に換算
 *   5. .local/r2/app/stats/<key>/values.json に競技ごとに書き出し
 *      (本番反映は diff-push-r2.ts で別途行う。本スクリプトは書き出しのみ)
 *
 * 実行: node .claude/scripts/data/fetch-chutairen-club-membership.mjs
 *
 * 正典: .claude/rules/data-provenance-standards.md (provenance 9点セット)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { execFileSync } from "node:child_process";

const PDF_BASE =
  "https://nippon-chutairen.or.jp/cms/wp-content/themes/nippon-chutairen/file/kameikou/";
const PDF_FILENAME = "令和７年度加盟校調査集計（確定値）.pdf";
const PDF_URL = PDF_BASE + encodeURIComponent(PDF_FILENAME);
const PUBLICATION_INDEX_URL = "https://nippon-chutairen.or.jp/data/result/";
const ACCESSED_AT = "2026-07-20";

const DENOM_URL = "https://storage.stats47.jp/app/stats/junior-high-school-students-count/values.json";
const DENOM_YEAR = "2024"; // 学校基本調査(令和6年度)。中体連調査(令和7年6月時点)と最大1年ズレるが
// 都道府県別中学生数の直近R2値としてこれを使う (provenance に明記)。

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// JIS順 都道府県 (中体連PDFの表番号順と一致)
const PREF_ORDER = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県",
  "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
  "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];
const CODE_BY_NAME = Object.fromEntries(PREF_ORDER.map((n, i) => [n, `${String(i + 1).padStart(2, "0")}000`]));

function shortName(full) {
  for (const suf of ["都", "道", "府", "県"]) {
    if (full.endsWith(suf) && full !== "北海道") return full.slice(0, -1);
  }
  return full;
}
const SHORT_TO_FULL = Object.fromEntries(PREF_ORDER.map((n) => [shortName(n), n]));

// PDF の 加盟生徒数(男子)/(女子) ページの 19 競技の列順 (検算で確定済み)
const SPORTS = [
  "陸上競技", "水泳競技", "バスケットボール", "サッカー", "ハンドボール", "軟式野球", "新体操", "体操競技",
  "バレーボール", "ソフトテニス", "卓球", "バドミントン", "ソフトボール", "柔道", "剣道", "相撲",
  "スケート", "アイスホッケー", "なぎなた",
];

// PDF 巻末「総合計」行 (男子・女子それぞれ)。19競技 + 男子合計/女子合計 + 男女合計 の21列。
// 検算の基準値 (令和7年度加盟校調査集計(確定値) より書き起こし)。
const EXPECTED_TOTAL = {
  male: [115107, 18218, 154929, 148730, 16082, 130085, 1129, 157, 58494, 119190, 114699, 53626, 925, 14638, 33652, 733, 831, 131, 267, 981623, 1685073],
  female: [71466, 10620, 115592, 4569, 8130, 3993, 2336, 2294, 145599, 137185, 74134, 76032, 19923, 5994, 24719, 46, 666, 137, 15, 703450, 1685073],
};

// 投入対象競技 (主要10競技。書籍で語れる「意外な1位」を優先)
const TARGETS = {
  "junior-high-club-per100-soccer": { sport: "サッカー", label: "サッカー部" },
  "junior-high-club-per100-baseball-soft": { sport: "軟式野球", label: "野球部(軟式)" },
  "junior-high-club-per100-basketball": { sport: "バスケットボール", label: "バスケットボール部" },
  "junior-high-club-per100-volleyball": { sport: "バレーボール", label: "バレーボール部" },
  "junior-high-club-per100-table-tennis": { sport: "卓球", label: "卓球部" },
  "junior-high-club-per100-soft-tennis": { sport: "ソフトテニス", label: "ソフトテニス部" },
  "junior-high-club-per100-track-and-field": { sport: "陸上競技", label: "陸上競技部" },
  "junior-high-club-per100-kendo": { sport: "剣道", label: "剣道部" },
  "junior-high-club-per100-swimming": { sport: "水泳競技", label: "水泳部" },
  "junior-high-club-per100-badminton": { sport: "バドミントン", label: "バドミントン部" },
};

async function main() {
  console.log(`[fetch] ${PDF_URL}`);
  const pdfBuf = await fetchBuffer(PDF_URL);
  const tmpPdf = path.join(os.tmpdir(), "chutairen-r7.pdf");
  fs.writeFileSync(tmpPdf, pdfBuf);
  console.log(`[fetch] OK: ${pdfBuf.length} bytes`);

  const malePage = pdftotextPage(tmpPdf, 5);
  const femalePage = pdftotextPage(tmpPdf, 6);

  const maleRows = parsePage(malePage);
  const femaleRows = parsePage(femalePage);

  if (Object.keys(maleRows).length !== 47 || Object.keys(femaleRows).length !== 47) {
    throw new Error(
      `47都道府県抽出できず (男子${Object.keys(maleRows).length}件/女子${Object.keys(femaleRows).length}件)。PDF構造が変化した可能性。投入中止。`,
    );
  }

  // --- 検算1: 各行内の 19競技合計 == 男子合計/女子合計 列 ---
  for (const [idx, rec] of Object.entries(maleRows)) {
    const sum19 = rec.values.slice(0, 19).reduce((a, b) => a + b, 0);
    if (sum19 !== rec.values[19]) {
      throw new Error(`検算失敗(男子・行内合計): ${rec.name} ${sum19} != ${rec.values[19]}`);
    }
  }
  for (const [idx, rec] of Object.entries(femaleRows)) {
    const sum19 = rec.values.slice(0, 19).reduce((a, b) => a + b, 0);
    if (sum19 !== rec.values[19]) {
      throw new Error(`検算失敗(女子・行内合計): ${rec.name} ${sum19} != ${rec.values[19]}`);
    }
    const mv = maleRows[idx].values;
    if (rec.values[20] !== mv[19] + rec.values[19]) {
      throw new Error(`検算失敗(男女合計): ${rec.name} ${rec.values[20]} != ${mv[19]} + ${rec.values[19]}`);
    }
  }
  console.log("[verify] OK: 全47都道府県で行内合計(男子合計/女子合計/男女合計)が一致");

  // --- 検算2: 全国計 (47都道府県の合算) が PDF巻末「総合計」行のハードコード値と一致するか ---
  const failedSports = new Set();
  for (const gender of ["male", "female"]) {
    const rowsByGender = gender === "male" ? maleRows : femaleRows;
    const computed = new Array(21).fill(0);
    for (const rec of Object.values(rowsByGender)) {
      rec.values.forEach((v, i) => (computed[i] += v));
    }
    const expected = EXPECTED_TOTAL[gender];
    for (let i = 0; i < 21; i++) {
      if (computed[i] !== expected[i]) {
        const sportName = i < 19 ? SPORTS[i] : i === 19 ? "(性別内合計)" : "(男女合計)";
        console.error(
          `[verify FAIL] ${gender} 競技#${i}(${sportName}): 集計値=${computed[i]} 公表全国計=${expected[i]}`,
        );
        if (i < 19) failedSports.add(SPORTS[i]);
      }
    }
  }
  if (failedSports.size > 0) {
    console.error(`[verify] 検算失敗競技 (投入から除外): ${[...failedSports].join(", ")}`);
  } else {
    console.log("[verify] OK: 全19競技で47都道府県合算値が中体連公表の全国計(総合計行)と一致");
  }

  // --- 分母 (中学校生徒数, 2024年度) 取得 ---
  const denomPayload = await fetchJson(DENOM_URL);
  const denomByCode = {};
  for (const row of denomPayload.rows) {
    if (row.yearCode === DENOM_YEAR) denomByCode[row.areaCode] = row.value;
  }
  const missingDenom = PREF_ORDER.filter((n) => !(CODE_BY_NAME[n] in denomByCode));
  if (missingDenom.length > 0) {
    throw new Error(`中学校生徒数(分母)欠落: ${missingDenom.join(",")}`);
  }

  // --- 投入対象ごとに算出・書き出し ---
  const written = [];
  const skipped = [];
  for (const [key, { sport, label }] of Object.entries(TARGETS)) {
    if (failedSports.has(sport)) {
      skipped.push({ key, sport, reason: "全国計と不一致 (検算失敗)" });
      continue;
    }
    const sIdx = SPORTS.indexOf(sport);
    const rows = PREF_ORDER.map((name) => {
      const code = CODE_BY_NAME[name];
      const idx = Object.keys(maleRows).find((i) => maleRows[i].name === name);
      const mv = maleRows[idx].values[sIdx];
      const fv = femaleRows[idx].values[sIdx];
      const members = mv + fv;
      const denom = denomByCode[code];
      const value = Math.round((members / (denom / 100)) * 100) / 100;
      return { areaCode: code, areaName: name, yearCode: "2025", yearName: "2025", value, unit: "人" };
    });

    // rank 付与 (降順)
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    sorted.forEach((r, i) => (r.rank = i + 1));
    const rankByCode = Object.fromEntries(sorted.map((r) => [r.areaCode, r.rank]));
    for (const r of rows) r.rank = rankByCode[r.areaCode];

    const payload = {
      metricKey: key,
      entityKind: "prefecture",
      rows,
      meta: {
        rowCount: rows.length,
        yearRange: ["2025", "2025"],
        areaCount: 47,
        generatedAt: new Date().toISOString(),
      },
    };

    const outPath = path.join(PROJECT_ROOT, ".local/r2/app/stats", key, "values.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    console.log(`[write] ${key} (${label}): top=${top.areaName} ${top.value} / bottom=${bottom.areaName} ${bottom.value} -> ${outPath}`);
    written.push({ key, sport, label, top, bottom });
  }

  console.log(`\n[summary] 投入: ${written.length}件 / 見送り: ${skipped.length}件`);
  if (skipped.length > 0) {
    for (const s of skipped) console.log(`  - SKIP ${s.key} (${s.sport}): ${s.reason}`);
  }
}

function pdftotextPage(pdfPath, pageNum) {
  const out = execFileSync("pdftotext", ["-layout", "-f", String(pageNum), "-l", String(pageNum), pdfPath, "-"], {
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 20,
  });
  return out;
}

function parsePage(text) {
  const lines = text.split("\n");
  const rows = {};
  for (const line of lines) {
    const m = line.match(/^\s*(\d{1,2})\s+([^\d]{2,4}?)\s{2,}/);
    if (!m) continue;
    const rawName = m[2].replace(/[　\s]/g, "").trim();
    const full = SHORT_TO_FULL[rawName];
    if (!full) continue;
    const numMatches = [...line.matchAll(/[\d][\d,]*/g)];
    // 先頭は都道府県通し番号 (m[1])。それ以降 21個が値。
    const nums = numMatches.slice(1).map((mm) => Number(mm[0].replace(/,/g, "")));
    if (nums.length !== 21) continue; // 小計/総合計/加盟率行など (競技合計と混在) はスキップ
    rows[m[1]] = { name: full, values: nums };
  }
  return rows;
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (stats47 data-ingester)" } });
  if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
  return res.json();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
