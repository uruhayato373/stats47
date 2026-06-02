/**
 * validate-metric-config — metric config の構造規約を検証する lint。
 *
 * 規約の正典: `.claude/rules/metric-config-standards.md`
 *
 * フィールドの役割を分離し「同じ間違い」(注釈をタイトルに焼く / 無効カテゴリ /
 * subtitle が title の繰り返し 等) の再発を防ぐ。
 *
 * 2 段階の重大度:
 *   - error (exit 1 / CI・pre-commit をブロック): 無効 category キー。
 *     ※ category は型 (CategoryKey union) でもコンパイル時にブロックされるが、
 *       本 lint は分かりやすいメッセージの runtime backstop。
 *   - warn (exit 0 / 表示のみ): title への年混入 / 注釈(※)の subtitle 混入 /
 *     subtitle が title と冗長 / unit が空・"‐" / 重複 title に区別子なし。
 *     → これらは Phase 3 のデータ是正で解消し、その後 error に昇格する。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/validate-metric-config.ts
 *   npx tsx packages/data-configs/scripts/validate-metric-config.ts --strict  # warn も exit 1
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CATEGORY_KEYS } from "../src/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const METRICS_DIR = resolve(__dirname, "../src/metrics");
const STRICT = process.argv.includes("--strict");

const VALID_CATEGORIES = new Set<string>(CATEGORY_KEYS);

function strField(text: string, key: string): string | null {
  // config は `"key": "..."` (JSON 風) と `key: "..."` (createMetric 等) の両形式がある。
  // キーのクォートを optional にして両方拾う (片方しか拾わないと無効値を見逃す)。
  const m = text.match(new RegExp(`(?:"${key}"|\\b${key})\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? m[1] : null;
}

/** データ注釈 (※系) かどうかを文面から判定する (UI の isCaveatNote と同基準)。 */
function looksLikeNote(s: string): boolean {
  const t = s.trim();
  return (
    t.startsWith("※") ||
    t.startsWith("注") ||
    t.includes("調査対象外") ||
    t.includes("value=0") ||
    t.includes("対象外")
  );
}

interface Row {
  file: string;
  key: string | null;
  title: string;
  subtitle: string | null;
  unit: string | null;
  category: string | null;
}

function normalizeTitle(title: string): string {
  return title.replace(/[（(][^）)]*[）)]/g, "").replace(/\s/g, "").trim();
}

function main() {
  const files = readdirSync(METRICS_DIR).filter(
    (f) => f.endsWith(".ts") && f !== "index.ts",
  );

  const rows: Row[] = [];
  for (const f of files) {
    const text = readFileSync(join(METRICS_DIR, f), "utf8");
    rows.push({
      file: f.replace(".ts", ""),
      key: strField(text, "key"),
      title: strField(text, "title") ?? "",
      subtitle: strField(text, "subtitle"),
      unit: strField(text, "unit"),
      category: strField(text, "category"),
    });
  }

  const errors: string[] = [];
  const warns: string[] = [];

  // error: 無効 category
  for (const r of rows) {
    if (r.category && !VALID_CATEGORIES.has(r.category)) {
      errors.push(`${r.file}: 無効な category "${r.category}" (17 軸のいずれかにする)`);
    }
  }

  // warn: title への年混入
  for (const r of rows) {
    if (/(19|20)\d{2}\s*年?度?/.test(r.title)) {
      warns.push(`[title-year] ${r.file}: title に年が混入 「${r.title}」`);
    }
    if (looksLikeNote(r.title)) {
      warns.push(`[title-note] ${r.file}: title に注釈(※)が混入 「${r.title}」`);
    }
  }

  // warn: subtitle が注釈 / title と冗長
  for (const r of rows) {
    if (!r.subtitle) continue;
    const s = r.subtitle.trim();
    if (looksLikeNote(s)) {
      warns.push(`[subtitle-note] ${r.file}: 注釈は subtitle でなく note へ 「${s.slice(0, 40)}」`);
    } else if (r.title && (s === r.title || r.title.includes(s) || s.includes(r.title))) {
      warns.push(`[subtitle-redundant] ${r.file}: subtitle が title と冗長 「${s.slice(0, 30)}」`);
    }
  }

  // warn: unit 空 / プレースホルダ
  for (const r of rows) {
    if (r.unit === null || r.unit.trim() === "" || r.unit.trim() === "‐" || r.unit.trim() === "-") {
      warns.push(`[unit] ${r.file}: unit が空/プレースホルダ ("${r.unit}")`);
    }
  }

  // warn: 重複 title (正規化後同名) に区別子(subtitle)が無い
  const byNorm = new Map<string, Row[]>();
  for (const r of rows) {
    const n = normalizeTitle(r.title);
    (byNorm.get(n) ?? byNorm.set(n, []).get(n)!).push(r);
  }
  for (const [, group] of byNorm) {
    if (group.length < 2) continue;
    for (const r of group) {
      if (!r.subtitle || looksLikeNote(r.subtitle)) {
        warns.push(`[dup-title] ${r.file}: 同名 title が ${group.length} 件あるが区別子(subtitle)なし 「${r.title}」`);
      }
    }
  }

  // ── 出力 ──
  console.log(`metric-config 検証: ${files.length} configs / error ${errors.length} / warn ${warns.length}`);

  if (warns.length > 0) {
    const counts = warns.reduce<Record<string, number>>((acc, w) => {
      const tag = w.match(/^\[([a-z-]+)\]/)?.[1] ?? "other";
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {});
    console.log("⚠️  warn 内訳:", Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" "));
    for (const w of warns.slice(0, 30)) console.log("   " + w);
    if (warns.length > 30) console.log(`   … 他 ${warns.length - 30} 件`);
    console.log("   → 規約: .claude/rules/metric-config-standards.md / Phase 3 のデータ是正で解消予定");
  }

  if (errors.length > 0) {
    console.error(`\n❌ metric-config 検証: ${errors.length} 件の error (category)`);
    for (const e of errors.slice(0, 50)) console.error("   " + e);
    if (errors.length > 50) console.error(`   … 他 ${errors.length - 50} 件`);
    console.error("   規約: .claude/rules/metric-config-standards.md");
    process.exit(1);
  }

  if (STRICT && warns.length > 0) {
    console.error(`\n❌ --strict: warn ${warns.length} 件を error 扱い`);
    process.exit(1);
  }

  console.log("✅ metric-config 検証: error なし");
  process.exit(0);
}

main();
