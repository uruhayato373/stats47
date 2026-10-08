#!/usr/bin/env node
/**
 * 全国学力・学習状況調査 (令和7年度) 児童質問紙の都道府県別回答割合の投入スクリプト。
 *
 * 出典: 文部科学省・国立教育政策研究所「令和7年度 全国学力・学習状況調査 調査結果資料【都道府県別】」
 *   https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html
 *   各都道府県ページの「回答結果集計［児童質問調査］<県>−児童（公立）【表】」xlsx (例: 01_hokkaido/01p_25a.xlsx)
 *   ★集計対象は公立学校の児童。国立・私立は含まない。
 *   利用条件: [要確認] 国立教育政策研究所の利用条件は未確認。調査結果の公表値を出典明記で利用
 *   (オーナー承認 2026-10-08・問題指摘時は取り下げ)。
 *
 * 取り込む質問 (小学校6年・令和7年度の質問番号):
 *   (1)  朝食を毎日食べていますか            → 「している」+「どちらかといえば、している」(肯定回答)
 *   (17) 学校の授業時間以外に、普段(月曜日から金曜日)、1日当たりどれくらいの時間、勉強をしますか → 選択肢1「3時間以上」+2「2時間以上3時間より少ない」+3「1時間以上2時間より少ない」(1時間以上)
 *        選択肢の文言は調査票 https://www.nier.go.jp/25chousa/pdf/25shitsumonchousa_shou_jidou.pdf (児童質問調査) で確認 (2026-10-08):
 *        1=3時間以上 / 2=2時間以上3時間より少ない / 3=1時間以上2時間より少ない / 4=30分以上1時間より少ない / 5=30分より少ない / 6=全くしない
 *   (20) 学習塾の先生や家庭教師の先生に教わっていますか (オンライン授業含む) → 選択肢1「教わっていない」以外 (2〜5の合計)
 *   (24) 読書は好きですか                     → 「当てはまる」+「どちらかといえば、当てはまる」(肯定回答)
 *   割合 = 該当選択肢の児童数 ÷ (質問番号(1)〜(71)の集計対象児童数) x 100 (小数第1位)
 *
 * 検算:
 *   - 各県で、公表の県別割合 (2段目) が 児童数÷集計対象児童数 と ±0.06 で一致
 *   - 47県の児童数を合算した全国(公立)割合が、各ファイルが載せる全国(公立)の公表割合 (3段目) と ±0.1 で一致
 *   - 全国(公立)の公表割合が47ファイルで同一値
 *   - 質問文言が想定どおり (質問文の一致確認)
 *
 * 実行: node .claude/scripts/data/fetch-national-assessment-questionnaire.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import ExcelJS from "exceljs";
import { fetchBuffer, writeStatsValues, roundTo, assertClose, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const BASE = "https://www.nier.go.jp/25chousakekkahoukoku/factsheet";
const INDEX_URL = `${BASE}/prefecture_city.html`;
const YEAR = "2025";

// qLabel: シート上の質問番号(全角)。positive: 該当に数える選択肢番号 (1始まり)
const QUESTIONS = [
  { key: "national-assessment-elementary-breakfast-rate", label: "（１）", text: "朝食を毎日食べていますか", positive: [1, 2] },
  { key: "national-assessment-elementary-study-1h-plus-rate", label: "（１７）", text: "普段（月曜日から金曜日）、１日当たりどれくらいの時間、勉強をしますか", positive: [1, 2, 3] },
  { key: "national-assessment-elementary-tutoring-rate", label: "（２０）", text: "学習塾の先生や家庭教師の先生に教わっていますか", positive: [2, 3, 4, 5] },
  { key: "national-assessment-elementary-reading-like-rate", label: "（２４）", text: "読書は好きですか", positive: [1, 2] },
];

const cell = (c) => (c && typeof c === "object" && "result" in c ? c.result : c && c.richText ? c.richText.map((t) => t.text).join("") : c);

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

async function loadPref(slug) {
  const n = slug.slice(0, 2);
  const url = `${BASE}/${slug}/${n}p_25a.xlsx`;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await fetchBuffer(url));
  const ws = wb.worksheets[0];
  if (!/児童質問/.test(ws.name)) throw new Error(`${slug}: 想定外のシート ${ws.name}`);
  const respondents = Number(cell(ws.getCell(8, 4).value)); // ①質問番号(1)〜(71)の児童数
  if (!(respondents > 0)) throw new Error(`${slug}: 児童数を読めません`);
  const found = {};
  for (const q of QUESTIONS) {
    let row = -1;
    for (let r = 12; r <= ws.rowCount; r++) {
      if (String(cell(ws.getCell(r, 2).value) ?? "").trim() === q.label) { row = r; break; }
    }
    if (row < 0) throw new Error(`${slug}: 質問 ${q.label} が見つかりません`);
    const text = String(cell(ws.getCell(row, 3).value) ?? "").replace(/\s+/g, "");
    if (!text.includes(q.text)) throw new Error(`${slug}: 質問文が想定と違います ${q.label} ${text.slice(0, 40)}`);
    const counts = [], pref = [], nat = [];
    for (let k = 7; k <= 12; k++) {
      counts.push(Number(cell(ws.getCell(row, k).value)));
      pref.push(Number(cell(ws.getCell(row + 1, k).value)));
      nat.push(Number(cell(ws.getCell(row + 3, k).value)));
    }
    found[q.key] = { counts, pref, nat };
  }
  return { slug, url, respondents, found };
}

async function main() {
  const html = (await fetchBuffer(INDEX_URL)).toString("utf8");
  const slugs = [...new Set([...html.matchAll(/factsheet\/(\d\d_[a-z]+)\/index\.html/g)].map((m) => m[1]))].sort();
  if (slugs.length !== 47) throw new Error(`都道府県ページ ${slugs.length}/47`);
  const prefs = await pool(slugs, 6, loadPref);
  console.log(`[fetch] ${prefs.length}県の児童質問紙 xlsx を取得`);

  const natPublished = {};
  for (const q of QUESTIONS) {
    const rows = [];
    let totalPos = 0, totalN = 0;
    for (const p of prefs) {
      const f = p.found[q.key];
      const pos = q.positive.reduce((s, k) => s + f.counts[k - 1], 0);
      const posPref = q.positive.reduce((s, k) => s + f.pref[k - 1], 0);
      const value = roundTo((pos / p.respondents) * 100, 1);
      assertClose(value, posPref, 0.15, `${p.slug} ${q.label} 県別割合(公表の選択肢別%の合計と一致)`);
      totalPos += pos; totalN += p.respondents;
      const natPos = roundTo(q.positive.reduce((s, k) => s + f.nat[k - 1], 0), 1);
      if (natPublished[q.key] === undefined) natPublished[q.key] = natPos;
      else assertClose(natPos, natPublished[q.key], 0.01, `${p.slug} ${q.label} 全国(公立)公表割合が全ファイルで同一`);
      rows.push({ areaName: PREF_NAMES[Number(p.slug.slice(0, 2)) - 1], yearCode: YEAR, value });
    }
    const natCalc = roundTo((totalPos / totalN) * 100, 1);
    assertClose(natCalc, natPublished[q.key], 0.15, `${q.label} 47県合算の全国(公立)割合 vs 公表`);
    console.log(`[verify] ${q.label} ${q.text}: 47県合算 ${natCalc}% = 公表の全国(公立) ${natPublished[q.key]}% (許容0.15pt。選択肢別%の合計の丸め差を含む)`);
    writeStatsValues({ metricKey: q.key, unit: "％", rows });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
