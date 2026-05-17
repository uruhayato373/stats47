#!/usr/bin/env node
/**
 * prefectureCommentary 専用バックフィル
 *
 * 軽量プロンプトで `prefectureCommentary` のみ生成し、metrics テーブルの該当列だけ
 * UPDATE する (faq/insights/regionalAnalysis は触らない)。
 *
 * Usage:
 *   node .claude/scripts/ai-content/backfill-prefecture-commentary.mjs [--limit N] [--delay MS] [--force]
 *
 * --limit N     : 最初の N 件で停止 (default: 全件)
 * --delay MS    : Gemini 呼び出し間隔 (default: 1500ms)
 * --force       : 既に prefecture_commentary がある entry も再生成
 *
 * 前提:
 *   - Gemini CLI (`gemini`) がインストール済み、`gemini auth login` 認証済み
 *   - .local/d1/ にローカル D1 が存在
 *   - ranking_values が R2 (.local/r2/app/ranking/<key>/values.json) に存在
 *
 * 設計:
 *   - 1 件あたり Gemini 1 呼び出し
 *   - quota error / rate limit は exponential backoff で 3 回まで retry
 *   - 進捗を .claude/state/pref-commentary-progress.json に保存し、Ctrl-C 等で
 *     中断しても次回再開時に skip
 *   - 出力 JSON が壊れた場合は skip して次へ進む (損失なし)
 *
 * Claude Code 内で動かす場合の注意:
 *   - claude CLI のような stdin > 3KB 制約はないため、Claude Code 内でも実行可能
 *   - ただし Gemini の free tier quota が厳しいので、長時間放置運用が現実的
 */

import { spawn } from "node:child_process";
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import BetterSqlite3 from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
config({ path: path.join(PROJECT_ROOT, ".env.local") });

const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const PROGRESS_PATH = path.join(
  PROJECT_ROOT,
  ".claude/state/pref-commentary-progress.json"
);

const RANKING_VALUES_DIR = path.join(PROJECT_ROOT, ".local/r2/app/ranking");

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const HARD_LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? "0", 10) : 0;
const delayIdx = args.indexOf("--delay");
const DELAY_MS = delayIdx !== -1 ? parseInt(args[delayIdx + 1] ?? "1500", 10) : 1500;
const FORCE = args.includes("--force");

// 7 地方区分 (prompt 埋め込み用、ハードコード)
const REGION_MAP = `- 北海道・東北: 北海道, 青森県, 岩手県, 宮城県, 秋田県, 山形県, 福島県
- 関東: 茨城県, 栃木県, 群馬県, 埼玉県, 千葉県, 東京都, 神奈川県
- 中部: 新潟県, 富山県, 石川県, 福井県, 山梨県, 長野県, 岐阜県, 静岡県, 愛知県
- 近畿: 三重県, 滋賀県, 京都府, 大阪府, 兵庫県, 奈良県, 和歌山県
- 中国: 鳥取県, 島根県, 岡山県, 広島県, 山口県
- 四国: 徳島県, 香川県, 愛媛県, 高知県
- 九州・沖縄: 福岡県, 佐賀県, 長崎県, 熊本県, 大分県, 宮崎県, 鹿児島県, 沖縄県`;

function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) return { done: [], failed: [] };
  return JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf8"));
}

function saveProgress(progress) {
  fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true });
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadRankingValues(rankingKey) {
  const valuesPath = path.join(RANKING_VALUES_DIR, rankingKey, "values.json");
  if (!fs.existsSync(valuesPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(valuesPath, "utf8"));
    // values.json の構造: { partitions: [{ yearCode, values: [{areaCode, areaName, rank, value}] }] }
    const latest = data.partitions?.[data.partitions.length - 1];
    if (!latest?.values) return null;
    // 都道府県のみ (5桁で末尾 000)
    const prefs = latest.values
      .filter((v) => /^\d{5}$/.test(v.areaCode) && v.areaCode.endsWith("000") && v.areaCode !== "00000")
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    if (prefs.length === 0) return null;
    return { yearCode: latest.yearCode, prefs };
  } catch {
    return null;
  }
}

function buildPrompt(rankingName, unit, yearCode, prefs) {
  const allPrefText = prefs
    .map((p) => `${p.rank}位 ${p.areaName} (${p.areaCode}): ${p.value?.toLocaleString() ?? "-"}${unit}`)
    .join("\n");

  const avg = prefs.reduce((s, p) => s + (p.value ?? 0), 0) / prefs.length;

  return `あなたは日本の公的統計データを正確に読み解く統計アナリストです。
「${rankingName}」(${yearCode}年度) の全 ${prefs.length} 都道府県について、各県ごとに 60〜120 字の解説を作成してください。

## 絶対ルール
1. **${prefs.length} 都道府県すべて**について commentary を作る (1 件も欠かさない)
2. areaCode は提供リストの 5 桁コードを正確に使う (間違えると地図と対応しなくなる)
3. 各 commentary 60〜120 字。短すぎ・長すぎは不可
4. 数値を 2 つ以上列挙しない (順位と値はテンプレで表示するため不要)
5. 「ワースト」「ベスト」「衝撃」等の煽り表現禁止。中立・客観的トーン
6. 因果推測 (「〜のため」「〜が原因」) 禁止
7. 他県名を 2 県以上引用しない (同地方の代表として 1 県までは可)

## 含めるべき要素 (順序自由)
- その県の順位帯 (上位/中位/下位のどこか)
- 属する地方区分 (北海道・東北/関東/中部/近畿/中国/四国/九州・沖縄) での相対位置
- 全国平均 (${avg.toLocaleString()}${unit}) との比較

## ランキングデータ (全 ${prefs.length} 都道府県)
平均値: ${avg.toLocaleString()}${unit}

${allPrefText}

## 7 地方区分
${REGION_MAP}

## 出力形式
以下の JSON のみを出力 (前後の説明文・コードフェンス不要):

{"items":[{"areaCode":"01000","areaName":"北海道","rank":1,"value":12345,"commentary":"..."}, ...]}

必ず ${prefs.length} 件すべてを items に含めること。`;
}

function callGemini(promptContent) {
  return new Promise((resolve, reject) => {
    const { NODE_OPTIONS: _n, CLAUDECODE: _c, ...childEnv } = process.env;
    const proc = spawn("gemini", ["-p", "", "-o", "text"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: childEnv,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`gemini exit ${code}: ${stderr.slice(0, 300)}`));
    });
    proc.stdin.write(promptContent);
    proc.stdin.end();
  });
}

async function callGeminiWithRetry(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await callGemini(prompt);
    } catch (e) {
      if (attempt === 3) throw e;
      const wait = 5000 * attempt;
      console.warn(`  retry ${attempt}/3 after ${wait}ms: ${e.message.slice(0, 100)}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

function stripCodeFence(text) {
  const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  return m ? m[1].trim() : text.trim();
}

function validateItems(parsed, expectedCount) {
  const items = parsed?.items;
  if (!Array.isArray(items)) return { ok: false, reason: "items not array" };
  if (items.length < expectedCount * 0.9) {
    return { ok: false, reason: `count ${items.length} < ${Math.floor(expectedCount * 0.9)} (90%)` };
  }
  for (const it of items) {
    if (!/^\d{5}$/.test(it.areaCode ?? "")) return { ok: false, reason: `invalid areaCode: ${it.areaCode}` };
    if (typeof it.commentary !== "string" || it.commentary.length < 30) {
      return { ok: false, reason: `bad commentary for ${it.areaCode}` };
    }
  }
  return { ok: true };
}

async function processOne(db, row, progress) {
  const { key, title, unit } = row;
  const values = loadRankingValues(key);
  if (!values) {
    console.log(`  ⏭️  ${key}: values.json なし、skip`);
    progress.failed.push({ key, reason: "no values" });
    return;
  }

  const prompt = buildPrompt(title, unit ?? "", values.yearCode, values.prefs);

  let raw;
  try {
    raw = await callGeminiWithRetry(prompt);
  } catch (e) {
    console.error(`  ❌ ${key}: gemini failed - ${e.message.slice(0, 100)}`);
    progress.failed.push({ key, reason: e.message.slice(0, 200) });
    return;
  }

  const stripped = stripCodeFence(raw);
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.error(`  ❌ ${key}: JSON parse error`);
    progress.failed.push({ key, reason: "json parse" });
    return;
  }

  const validation = validateItems(parsed, values.prefs.length);
  if (!validation.ok) {
    console.error(`  ❌ ${key}: ${validation.reason}`);
    progress.failed.push({ key, reason: validation.reason });
    return;
  }

  const json = JSON.stringify({ items: parsed.items });
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE metrics SET prefecture_commentary = ?, updated_at = ? WHERE key = ?`
  ).run(json, now, key);
  console.log(`  ✅ ${key}: ${parsed.items.length} prefectures`);
  progress.done.push(key);
}

async function main() {
  console.log("📡 prefectureCommentary バックフィル開始");
  console.log(`   DB: ${DB_PATH}`);
  console.log(`   delay: ${DELAY_MS}ms`);
  console.log(`   force: ${FORCE}`);

  const progress = loadProgress();
  const doneSet = new Set(progress.done);
  console.log(`   既完了: ${progress.done.length} 件`);
  console.log(`   既失敗: ${progress.failed.length} 件`);

  const db = new BetterSqlite3(DB_PATH);
  const where = FORCE
    ? "is_active = 1"
    : "is_active = 1 AND prefecture_commentary IS NULL";
  const rows = db
    .prepare(`SELECT key, title, unit FROM metrics WHERE ${where} ORDER BY key`)
    .all()
    .filter((r) => !doneSet.has(r.key));

  const target = HARD_LIMIT > 0 ? rows.slice(0, HARD_LIMIT) : rows;
  console.log(`\n🎯 対象: ${target.length} 件 / 全 ${rows.length} 件 (limit=${HARD_LIMIT || "all"})\n`);

  const startTime = Date.now();
  for (let i = 0; i < target.length; i++) {
    const row = target[i];
    console.log(`[${i + 1}/${target.length}] ${row.key}`);
    await processOne(db, row, progress);

    // 5 件ごとに progress 保存
    if ((i + 1) % 5 === 0 || i + 1 === target.length) {
      saveProgress(progress);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`  💾 progress saved (${elapsed}s elapsed, done=${progress.done.length} failed=${progress.failed.length})`);
    }

    if (i < target.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  saveProgress(progress);
  db.close();

  console.log("\n━━━ 完了 ━━━");
  console.log(`  done: ${progress.done.length}`);
  console.log(`  failed: ${progress.failed.length}`);
  if (progress.failed.length > 0) {
    console.log("  失敗 reasons (top 3):");
    const counts = {};
    for (const f of progress.failed) counts[f.reason] = (counts[f.reason] || 0) + 1;
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([r, c]) => console.log(`    - ${r}: ${c}`));
  }
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
