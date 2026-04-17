/**
 * SNS Metrics Store（ファイルベース）
 *
 * 旧 D1 テーブル `sns_metrics` を置き換えるファイル永続化レイヤ。
 * 保存先: .claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv
 *
 * 記録先の統一原則（CLAUDE.md §記録先の統一原則）:
 *   計測蓄積は .claude/ 配下のファイル。`sns_posts` テーブルのキャッシュカラム
 *   (impressions, likes, reposts, replies, bookmarks, metrics_updated_at) は運用データ
 *   として D1 に残し、本 store は時系列履歴のみを扱う。
 *
 * CommonJS で提供するのは、/tmp/*.js 経由で require() される既存パターンとの互換のため。
 *
 * 使い方（/tmp/xxx.js の中から）:
 *   const store = require(`${PROJECT_ROOT}/.claude/scripts/lib/sns-metrics-store.cjs`);
 *   store.upsertMetric({
 *     sns_post_id: 42, platform: "x", domain: "ranking", content_key: "pop-density",
 *     fetched_at: new Date().toISOString(),
 *     impressions: 1234, likes: 10, comments: 2, shares: 1, saves: 5,
 *   });
 *
 * fetched_at は ISO 8601 文字列を期待。同 sns_post_id + 同 fetched_at は上書き
 * （INSERT OR REPLACE 相当）。日付は fetched_at の先頭 10 文字を使用する。
 */

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = process.env.SNS_METRICS_REPO_ROOT || process.cwd();
const BASE_DIR = path.join(
  REPO_ROOT,
  ".claude/skills/analytics/sns-metrics-improvement/snapshots",
);

const COLUMNS = [
  "sns_post_id",
  "platform",
  "domain",
  "content_key",
  "fetched_at",
  "impressions",
  "reach",
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
  "quotes",
];

function escape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseLine(line) {
  const out = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQuote = false;
      else cur += c;
    } else {
      if (c === '"') inQuote = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function csvPathFor(fetchedAt) {
  const date = String(fetchedAt).slice(0, 10);
  return path.join(BASE_DIR, date, "metrics.csv");
}

function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const content = fs.readFileSync(file, "utf-8").trim();
  if (!content) return [];
  const lines = content.split("\n");
  return lines
    .slice(1)
    .filter((l) => l.length > 0)
    .map((line) => {
      const fields = parseLine(line);
      const obj = {};
      COLUMNS.forEach((c, i) => {
        obj[c] = fields[i] ?? "";
      });
      return obj;
    });
}

function writeCsv(file, rows) {
  const lines = [COLUMNS.join(",")];
  for (const r of rows) {
    lines.push(COLUMNS.map((c) => escape(r[c])).join(","));
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf-8");
}

/**
 * 1 件のメトリクスを UPSERT する。キーは (sns_post_id, fetched_at)。
 */
function upsertMetric(metric) {
  if (metric.sns_post_id == null) throw new Error("sns_post_id is required");
  if (!metric.fetched_at) throw new Error("fetched_at is required");
  const file = csvPathFor(metric.fetched_at);
  const rows = readCsv(file);
  const key = `${metric.sns_post_id}|${metric.fetched_at}`;
  const filtered = rows.filter(
    (r) => `${r.sns_post_id}|${r.fetched_at}` !== key,
  );
  const normalized = {};
  for (const c of COLUMNS) normalized[c] = metric[c] ?? "";
  filtered.push(normalized);
  filtered.sort(
    (a, b) =>
      (a.platform || "").localeCompare(b.platform || "") ||
      String(a.sns_post_id).localeCompare(String(b.sns_post_id)) ||
      (a.fetched_at || "").localeCompare(b.fetched_at || ""),
  );
  writeCsv(file, filtered);
}

/**
 * 指定日（YYYY-MM-DD）の全行を返す。存在しなければ空配列。
 */
function readByDate(date) {
  return readCsv(path.join(BASE_DIR, date, "metrics.csv"));
}

/**
 * 日付範囲 [start, end]（inclusive, YYYY-MM-DD）の全行を返す。
 */
function readByRange(start, end) {
  if (!fs.existsSync(BASE_DIR)) return [];
  const dates = fs
    .readdirSync(BASE_DIR)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .filter((d) => d >= start && d <= end)
    .sort();
  const out = [];
  for (const d of dates) out.push(...readByDate(d));
  return out;
}

/**
 * 全スナップショット行数を返す（互換用。旧 `SELECT COUNT(*) FROM sns_metrics` の置換）。
 */
function countAll() {
  if (!fs.existsSync(BASE_DIR)) return 0;
  const dates = fs.readdirSync(BASE_DIR).filter((d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d),
  );
  let n = 0;
  for (const d of dates) n += readByDate(d).length;
  return n;
}

/**
 * 最新の fetched_at（ISO 文字列、全スナップショット全体の最大値）を返す。
 */
function maxFetchedAt() {
  if (!fs.existsSync(BASE_DIR)) return null;
  const dates = fs
    .readdirSync(BASE_DIR)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  if (dates.length === 0) return null;
  const latest = readByDate(dates[dates.length - 1]);
  if (latest.length === 0) return null;
  let max = "";
  for (const r of latest) if (r.fetched_at > max) max = r.fetched_at;
  return max || null;
}

module.exports = {
  COLUMNS,
  upsertMetric,
  readByDate,
  readByRange,
  countAll,
  maxFetchedAt,
  csvPathFor,
};
