/**
 * x-catalog.cjs — X 投稿カタログの機械参照口 (SSOT: sns-content-standards.md)
 *
 * `.claude/rules/sns-content-standards.md` の §1 quota / §2-0 templates /
 * §2-8 affinity / §2-9 imagekinds を、HTML コメントアンカーで区切られた領域から
 * 決定的にパースする。人間はカタログ (md) を編集し、スクリプトは本モジュール経由で読む
 * (手編集 JSON を SSOT にしない = chart-component-standards.md 方式)。
 *
 * アンカー:
 *   <!-- x-catalog:quota:start -->      ... <!-- x-catalog:quota:end -->      (KEY=VALUE の code block)
 *   <!-- x-catalog:templates:start -->  ... <!-- x-catalog:templates:end -->  (markdown table)
 *   <!-- x-catalog:affinity:start -->   ... <!-- x-catalog:affinity:end -->   (markdown table)
 *   <!-- x-catalog:imagekinds:start --> ... <!-- x-catalog:imagekinds:end --> (markdown table)
 *
 * パース不能 (アンカー欠落・行数ゼロ等) は throw する (サイレント既定値を返さない)。
 *
 * API:
 *   getQuota()       → { dailyMax, weeklyTargetMin, weeklyTargetMax }
 *   getTemplates()   → [{ template, structure, imageKind, charMax, bestTime, use }]
 *   getAffinity()    → { <category>: { 結論, 理由, 体験, 反論, 数字, ハウツー } }
 *   getImageKinds()  → [{ imageKind, size, generator, outPath, note }]
 *   getTemplate(id)  → 1件 (無ければ null)
 *   getImageKind(id) → 1件 (無ければ null)
 *
 * CLI:
 *   node .claude/scripts/lib/x-catalog.cjs --check   # 自己検証 (exit 0/1)
 *   node .claude/scripts/lib/x-catalog.cjs --json     # 全カタログを JSON で出力
 */

const fs = require("node:fs");
const path = require("node:path");

const RULES_PATH = path.resolve(
  __dirname,
  "../../rules/sns-content-standards.md",
);

function readRules() {
  return fs.readFileSync(RULES_PATH, "utf8");
}

/** アンカー間のテキストを取り出す。欠落は throw。 */
function extractBlock(md, name) {
  const start = `<!-- x-catalog:${name}:start -->`;
  const end = `<!-- x-catalog:${name}:end -->`;
  const si = md.indexOf(start);
  const ei = md.indexOf(end);
  if (si < 0 || ei < 0 || ei < si) {
    throw new Error(
      `[x-catalog] アンカー '${name}' が ${RULES_PATH} に見つかりません (start=${si}, end=${ei})`,
    );
  }
  return md.slice(si + start.length, ei);
}

/** markdown テーブルをパースし、ヘッダ行をキーにしたオブジェクト配列を返す。 */
function parseTable(block, name) {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (lines.length < 3) {
    throw new Error(
      `[x-catalog] テーブル '${name}' の行が不足 (見出し + 区切り + データ ≥1 が必要, got ${lines.length})`,
    );
  }
  const splitRow = (l) =>
    l
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const header = splitRow(lines[0]);
  // lines[1] は区切り行 (|---|---|)。データは lines[2] 以降。
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    if (cells.length !== header.length) {
      throw new Error(
        `[x-catalog] テーブル '${name}' の列数不一致 (header=${header.length}, row=${cells.length}): ${lines[i]}`,
      );
    }
    const obj = {};
    header.forEach((h, j) => {
      obj[h] = cells[j];
    });
    rows.push(obj);
  }
  return rows;
}

/** `id` セル内のバッククォート装飾を除去して素の id にする。 */
function unwrapCode(s) {
  return s.replace(/`/g, "").trim();
}

function getQuota() {
  const block = extractBlock(readRules(), "quota");
  const kv = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(\d+)\s*$/);
    if (m) kv[m[1]] = Number(m[2]);
  }
  const required = ["X_DAILY_MAX", "X_WEEKLY_TARGET_MIN", "X_WEEKLY_TARGET_MAX"];
  for (const k of required) {
    if (!(k in kv)) {
      throw new Error(`[x-catalog] quota に ${k} がありません`);
    }
  }
  return {
    dailyMax: kv.X_DAILY_MAX,
    weeklyTargetMin: kv.X_WEEKLY_TARGET_MIN,
    weeklyTargetMax: kv.X_WEEKLY_TARGET_MAX,
  };
}

function getTemplates() {
  const rows = parseTable(extractBlock(readRules(), "templates"), "templates");
  return rows.map((r) => ({
    template: unwrapCode(r.template),
    structure: r.structure,
    imageKind: unwrapCode(r.image_kind),
    charMax: Number(r.char_max),
    bestTime: unwrapCode(r.best_time),
    use: r["用途"] ?? "",
  }));
}

function getAffinity() {
  const rows = parseTable(extractBlock(readRules(), "affinity"), "affinity");
  const out = {};
  for (const r of rows) {
    const cat = unwrapCode(r.category);
    out[cat] = {
      結論: r["結論"],
      理由: r["理由"],
      体験: r["体験"],
      反論: r["反論"],
      数字: r["数字"],
      ハウツー: r["ハウツー"],
    };
  }
  return out;
}

function getImageKinds() {
  const rows = parseTable(
    extractBlock(readRules(), "imagekinds"),
    "imagekinds",
  );
  return rows.map((r) => ({
    imageKind: unwrapCode(r.image_kind),
    size: r.size,
    generator: r.generator,
    outPath: unwrapCode(r.out_path),
    note: r["備考"] ?? "",
  }));
}

function getTemplate(id) {
  return getTemplates().find((t) => t.template === id) ?? null;
}

function getImageKind(id) {
  return getImageKinds().find((k) => k.imageKind === id) ?? null;
}

/**
 * 自己検証: 全カタログをパースし、期待する形と最低件数を確認する。
 * lint フェーズ冒頭で必ず呼ぶ (md ドリフト・アンカー欠落を早期検出)。
 * 成功で { ok: true, ... } を返し、失敗は throw。
 */
function selfCheck() {
  const quota = getQuota();
  if (quota.dailyMax < 1 || quota.weeklyTargetMin < 1) {
    throw new Error(`[x-catalog] quota 値が不正: ${JSON.stringify(quota)}`);
  }
  if (quota.weeklyTargetMax < quota.weeklyTargetMin) {
    throw new Error(
      `[x-catalog] weeklyTargetMax(${quota.weeklyTargetMax}) < min(${quota.weeklyTargetMin})`,
    );
  }
  const templates = getTemplates();
  if (templates.length < 3) {
    throw new Error(`[x-catalog] templates が少なすぎ: ${templates.length}`);
  }
  const imageKinds = getImageKinds();
  const kindIds = new Set(imageKinds.map((k) => k.imageKind));
  for (const t of templates) {
    if (!t.template) throw new Error(`[x-catalog] template id 空: ${JSON.stringify(t)}`);
    if (!Number.isFinite(t.charMax) || t.charMax < 1) {
      throw new Error(`[x-catalog] ${t.template} の char_max が不正: ${t.charMax}`);
    }
    if (!kindIds.has(t.imageKind)) {
      throw new Error(
        `[x-catalog] template '${t.template}' の image_kind '${t.imageKind}' が §2-9 に無い`,
      );
    }
  }
  const affinity = getAffinity();
  if (Object.keys(affinity).length < 10) {
    throw new Error(
      `[x-catalog] affinity カテゴリが少なすぎ: ${Object.keys(affinity).length}`,
    );
  }
  return {
    ok: true,
    quota,
    templateCount: templates.length,
    imageKindCount: imageKinds.length,
    affinityCategoryCount: Object.keys(affinity).length,
  };
}

module.exports = {
  RULES_PATH,
  getQuota,
  getTemplates,
  getAffinity,
  getImageKinds,
  getTemplate,
  getImageKind,
  selfCheck,
};

// ---------- CLI ----------
if (require.main === module) {
  const arg = process.argv[2];
  try {
    if (arg === "--check") {
      const r = selfCheck();
      console.log(
        `[x-catalog] OK — templates=${r.templateCount} imageKinds=${r.imageKindCount} ` +
          `affinity=${r.affinityCategoryCount} quota=${JSON.stringify(r.quota)}`,
      );
      process.exit(0);
    } else if (arg === "--json") {
      console.log(
        JSON.stringify(
          {
            quota: getQuota(),
            templates: getTemplates(),
            affinity: getAffinity(),
            imageKinds: getImageKinds(),
          },
          null,
          2,
        ),
      );
      process.exit(0);
    } else {
      console.error("usage: x-catalog.cjs --check | --json");
      process.exit(1);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
