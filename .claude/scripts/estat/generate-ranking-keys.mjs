/**
 * generate-ranking-keys.mjs
 *
 * estat_catalog の ranking_key が NULL の行に対して claude-haiku-4-5 API で
 * 日本語名 → 英語 kebab-case を一括生成する。
 *
 * 実行例:
 *   ANTHROPIC_API_KEY=sk-ant-... node .claude/scripts/estat/generate-ranking-keys.mjs
 *   ANTHROPIC_API_KEY=sk-ant-... node .claude/scripts/estat/generate-ranking-keys.mjs --category laborwage
 *   ANTHROPIC_API_KEY=sk-ant-... node .claude/scripts/estat/generate-ranking-keys.mjs --dry-run
 *   ANTHROPIC_API_KEY=sk-ant-... node .claude/scripts/estat/generate-ranking-keys.mjs --batch-size 50
 */

import Database from "better-sqlite3";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");

const DBPATH = resolve(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const MODEL = "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { category: null, dryRun: false, batchSize: 30 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && args[i + 1]) opts.category = args[++i];
    else if (args[i] === "--dry-run") opts.dryRun = true;
    else if (args[i] === "--batch-size" && args[i + 1]) opts.batchSize = parseInt(args[++i], 10);
  }
  return opts;
}

// 日本語統計名から kebab-case 英語キーを生成（Claude API）
async function translateBatch(apiKey, items) {
  const inputText = items.map((item, i) => `${i + 1}. ${item.name}`).join("\n");

  const prompt = `以下の日本語統計項目名を、英語の短い kebab-case 識別子（3〜6単語）に変換してください。
出力は必ず JSON 配列のみ。各要素は {"i": 番号, "key": "kebab-case-key"} の形式。
余計な説明・マークダウンなし。

変換ルール:
- 短く端的に（total-population, hospital-count, job-openings-ratio など）
- 数字・コードプレフィックス（A1101_ など）は除去
- （男）（女）は含めない（この時点では除外済みだが念のため）
- 同じ意味の項目が重複する場合も同じキーを出力してよい（後でシステムが重複処理）

項目:
${inputText}`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

  // JSON 配列を抽出
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`JSON 配列が見つかりません: ${text.slice(0, 300)}`);
  return JSON.parse(match[0]);
}

// 重複キーに suffix を付与
function deduplicateKey(baseKey, existingKeys) {
  if (!existingKeys.has(baseKey)) return baseKey;
  let n = 2;
  while (existingKeys.has(`${baseKey}-${n}`)) n++;
  return `${baseKey}-${n}`;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY が設定されていません。");
    console.error("  ANTHROPIC_API_KEY=sk-ant-... node .claude/scripts/estat/generate-ranking-keys.mjs");
    process.exit(1);
  }

  const opts = parseArgs();
  const db = new Database(DBPATH);

  // 既存の全 ranking_key を収集（重複チェック用）
  const existingKeys = new Set(
    db.prepare("SELECT ranking_key FROM estat_catalog WHERE ranking_key IS NOT NULL")
      .all()
      .map((r) => r.ranking_key)
  );
  // metrics テーブルの既存キーも追加
  const metricsKeys = db.prepare("SELECT key FROM metrics").all().map((r) => r.key);
  metricsKeys.forEach((k) => existingKeys.add(k));

  console.log(`既存キー数: ${existingKeys.size}`);

  // 対象行取得
  let query = "SELECT id, cat01_name FROM estat_catalog WHERE ranking_key IS NULL AND is_excluded = 0";
  const params = [];
  if (opts.category) {
    query += " AND category_key = ?";
    params.push(opts.category);
  }
  const rows = db.prepare(query).all(...params);
  console.log(`翻訳対象: ${rows.length} 行 (batch_size=${opts.batchSize})`);
  if (opts.dryRun) console.log("[dry-run モード: DB を更新しません]");

  const updateStmt = db.prepare(
    "UPDATE estat_catalog SET ranking_key = ?, updated_at = datetime('now') WHERE id = ?"
  );

  let translated = 0, errors = 0;
  const batches = [];
  for (let i = 0; i < rows.length; i += opts.batchSize) {
    batches.push(rows.slice(i, i + opts.batchSize));
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    process.stdout.write(`  バッチ ${bi + 1}/${batches.length} (${batch.length}件)...\r`);

    try {
      const results = await translateBatch(apiKey, batch.map((r) => ({ name: r.cat01_name })));

      const updates = db.transaction(() => {
        for (const result of results) {
          const row = batch[result.i - 1];
          if (!row) continue;
          let key = (result.key ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
          if (!key) key = `stat-${row.id}`;
          const finalKey = deduplicateKey(key, existingKeys);
          existingKeys.add(finalKey);

          if (!opts.dryRun) {
            updateStmt.run(finalKey, row.id);
          } else {
            console.log(`  [dry] id=${row.id} "${row.cat01_name}" → ${finalKey}`);
          }
          translated++;
        }
      });
      if (!opts.dryRun) updates();

    } catch (err) {
      console.error(`\n  ✗ バッチ ${bi + 1} エラー: ${err.message}`);
      errors++;
    }

    // 500ms 待機（API レート制限対策）
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n完了: 翻訳 ${translated} 件, エラーバッチ ${errors} 件`);

  // サマリ
  const remaining = db.prepare(
    "SELECT COUNT(*) AS n FROM estat_catalog WHERE ranking_key IS NULL AND is_excluded = 0"
  ).get();
  console.log(`翻訳未完了: ${remaining.n} 件`);

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
