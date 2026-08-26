/**
 * validate-metric-config — metric config の構造規約を検証する lint。
 *
 * 規約の正典: `.claude/rules/metric-config-standards.md`
 *
 * フィールドの役割を分離し「同じ間違い」(注釈をタイトルに焼く / 無効カテゴリ /
 * subtitle が title の繰り返し 等) の再発を防ぐ。
 *
 * 2 段階の重大度:
 *   - error (exit 1 / CI・pre-commit をブロック):
 *       無効 category キー / title への年混入・注釈(※)混入 /
 *       subtitle が注釈(※)・title と冗長 / unit が空・"‐" / 重複 title に区別子なし。
 *     ※ 旧 warn だった 5 系統 (title-year/title-note, subtitle-note/redundant, unit, dup-title) は
 *       Phase 3 のデータ是正で warn=0 を達成 (2026-06) → error に昇格済。これにより量産時の再混入を CI/pre-commit で阻止する。
 *       category は型 (CategoryKey union) でもコンパイル時にブロックされ、本 lint はその runtime backstop。
 *   - warn (exit 0 / 表示のみ): placeholder-source (isActive:false の TODO- 系 source id)。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/validate-metric-config.ts
 *   npx tsx packages/data-configs/scripts/validate-metric-config.ts --strict  # warn も exit 1
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { COLOR_SCHEME_CATALOG, isKnownColorScheme } from "@stats47/types";

import { CATEGORY_KEYS } from "../src/types";
import { moneyUnitExponent } from "../src/money-unit";
import { METRICS_REGISTRY } from "../src/registry";
import {
  THEME_METRIC_DESCRIPTION_MISSING_BASELINE,
  collectThemeMetricContentCoverage,
  listThemeCatalogs,
  validateThemeMetricContentCoverage,
} from "../src/theme-catalog";
import { parseUnit } from "../src/unit/unit-semantics";

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

function boolField(text: string, key: string): boolean | null {
  const m = text.match(new RegExp(`\\b${key}\\s*:\\s*(true|false)`));
  return m ? m[1] === "true" : null;
}

function numField(text: string, key: string): number | null {
  const m = text.match(new RegExp(`(?:"${key}"|\\b${key})\\s*:\\s*(-?[0-9.eE+]+)`));
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
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
  surveyId: string | null;
  resourceId: string | null;
  statsDataId: string | null;
  isActive: boolean | null;
  colorScheme: string | null;
  valueScale: number | null;
}

/**
 * surveys マスタ (packages/ranking/src/data/surveys.json) の id 集合。
 * config.surveyId は survey 紐付けの手動オーバーライド (正典: .claude/rules/survey-linkage-standards.md)。
 * 実在しない id は配信で orphan リンクになるため error で弾く。
 * ※ ranking パッケージを import すると循環依存になるため file 読みする。
 */
function loadSurveyMasterIds(): Set<string> | null {
  try {
    const p = resolve(__dirname, "../../ranking/src/data/surveys.json");
    const list = JSON.parse(readFileSync(p, "utf8")) as Array<{ id: string }>;
    return new Set(list.map((s) => s.id));
  } catch {
    return null; // マスタが読めない環境では本チェックをスキップ (他の lint は継続)
  }
}

function normalizeTitle(title: string): string {
  return title.replace(/[（(][^）)]*[）)]/g, "").replace(/\s/g, "").trim();
}

function tally(list: string[]): string {
  const counts = list.reduce<Record<string, number>>((acc, m) => {
    const tag = m.match(/^\[([a-z-]+)\]/)?.[1] ?? "other";
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
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
      surveyId: strField(text, "surveyId"),
      resourceId: strField(text, "resourceId"),
      statsDataId: strField(text, "statsDataId"),
      isActive: boolField(text, "isActive"),
      colorScheme: strField(text, "colorScheme"),
      valueScale: numField(text, "valueScale"),
    });
  }

  const errors: string[] = [];
  const warns: string[] = [];

  validateThemeMetricContentCoverage(
    collectThemeMetricContentCoverage(listThemeCatalogs(), METRICS_REGISTRY),
    {
      maxMissingDescriptions: THEME_METRIC_DESCRIPTION_MISSING_BASELINE,
      errors,
      warns,
    },
  );

  // error: 語彙外の colorScheme
  //
  // ★描画側は未知の色を黙って既定にフォールバックする (ページを白画面にしないため)。
  //   つまり typo は**どこにも現れない**。config の時点で止めるのが唯一の防波堤。
  //   正典: packages/types/src/color-scheme.ts / .claude/rules/blog-svg-chart-standards.md §3
  for (const r of rows) {
    if (r.colorScheme && !isKnownColorScheme(r.colorScheme)) {
      errors.push(
        `[color-scheme] ${r.file}: 語彙外の colorScheme "${r.colorScheme}" ` +
          `(COLOR_SCHEME_CATALOG の ${COLOR_SCHEME_CATALOG.length} 件から選ぶ)`,
      );
    }
  }

  // error: 無効 category
  for (const r of rows) {
    if (r.category && !VALID_CATEGORIES.has(r.category)) {
      errors.push(`[category] ${r.file}: 無効な category "${r.category}" (17 軸のいずれかにする)`);
    }
  }

  // error: surveyId (手動オーバーライド) が surveys マスタに実在しない
  const surveyMasterIds = loadSurveyMasterIds();
  if (surveyMasterIds) {
    for (const r of rows) {
      if (r.surveyId && !surveyMasterIds.has(r.surveyId)) {
        errors.push(
          `[survey-id] ${r.file}: surveyId "${r.surveyId}" が surveys.json に実在しない (packages/ranking/src/data/surveys.json)`,
        );
      }
    }
  }

  // error: title への年混入 / 注釈(※)混入
  for (const r of rows) {
    if (/(19|20)\d{2}\s*年?度?/.test(r.title)) {
      errors.push(`[title-year] ${r.file}: title に年が混入 「${r.title}」 (年は years/latestYear へ)`);
    }
    if (looksLikeNote(r.title)) {
      errors.push(`[title-note] ${r.file}: title に注釈(※)が混入 「${r.title}」 (注釈は note へ)`);
    }
  }

  // error: subtitle が注釈 / title と冗長
  for (const r of rows) {
    if (!r.subtitle) continue;
    const s = r.subtitle.trim();
    if (looksLikeNote(s)) {
      errors.push(`[subtitle-note] ${r.file}: 注釈は subtitle でなく note へ 「${s.slice(0, 40)}」`);
    } else if (r.title && (s === r.title || r.title.includes(s))) {
      // 真の冗長 = subtitle が title と同一/部分集合。
      // subtitle が title を包含する (s.includes(title)) ケースは「定義の追加情報」なので
      // 冗長ではない (例: title「乳用牛飼養頭数」/ subtitle「乳用牛(めす)の飼養頭数合計」)。
      errors.push(`[subtitle-redundant] ${r.file}: subtitle が title と冗長 「${s.slice(0, 30)}」`);
    }
  }

  // error: unit 空 / プレースホルダ
  for (const r of rows) {
    if (r.unit === null || r.unit.trim() === "" || r.unit.trim() === "‐" || r.unit.trim() === "-") {
      errors.push(`[unit] ${r.file}: unit が空/プレースホルダ ("${r.unit}")`);
    }
  }

  // error: valueScale の誤用
  //
  // valueScale は**金額単位族の換算専用**で `10^k` 以外を書かない (types.ts)。
  // 率や人数に付けると配信値が黙って何倍かになり、shape-gate の値域検査も
  // 「その単位ならありうる値」として通してしまう。宣言できる形を狭く固定しておく。
  // 正典: .claude/rules/unit-semantics-standards.md / packages/data-configs/src/money-unit.ts
  for (const r of rows) {
    if (r.valueScale === null) continue;
    if (moneyUnitExponent(r.unit) === null) {
      errors.push(
        `[value-scale] ${r.file}: valueScale は金額単位族専用 (unit="${r.unit}" は族外)`,
      );
      continue;
    }
    const exp = Math.log10(r.valueScale);
    if (!(r.valueScale > 0) || Math.abs(exp - Math.round(exp)) > 1e-9) {
      errors.push(`[value-scale] ${r.file}: valueScale は 10^k のみ (${r.valueScale})`);
    }
  }

  // [unit-vocab] warn: 単位セマンティクス (unit-semantics.ts) が解釈できない unit を可視化。
  //
  // ★解釈できない単位は換算 (千円↔円 等) が null になり、値照合が比較を諦める。
  //   つまり「監査が素通りする指標」がここに出る。語彙に足すべきものと、
  //   単位表記そのものを直すべきものを見分けて対応する (推測で語彙を増やすと誤換算が生まれる)。
  //   正典: .claude/rules/unit-semantics-standards.md
  {
    const unknownByUnit = new Map<string, string[]>();
    for (const r of rows) {
      if (!r.unit || r.unit.trim() === "") continue;
      if (parseUnit(r.unit).dimension !== null) continue;
      const list = unknownByUnit.get(r.unit) ?? [];
      list.push(r.key ?? r.file);
      unknownByUnit.set(r.unit, list);
    }
    const interpretable = rows.length - [...unknownByUnit.values()].reduce((n, v) => n + v.length, 0);
    if (unknownByUnit.size > 0) {
      const sorted = [...unknownByUnit.entries()].sort((a, b) => b[1].length - a[1].length);
      warns.push(
        `[unit-vocab] 解釈できない unit ${sorted.length} 種 / ${rows.length - interpretable} 件 ` +
          `(解釈率 ${((interpretable / rows.length) * 100).toFixed(1)}%): ` +
          sorted
            .slice(0, 10)
            .map(([u, keys]) => `"${u}"×${keys.length}`)
            .join(", ") +
          (sorted.length > 10 ? ` …他 ${sorted.length - 10} 種` : ""),
      );
    }
  }

  // placeholder-source: resourceId/statsDataId が TODO- プレースホルダのまま
  // isActive:true (本番配信対象) なら error / false なら warn (DR-AUDIT-08)
  for (const r of rows) {
    for (const [k, v] of [
      ["resourceId", r.resourceId],
      ["statsDataId", r.statsDataId],
    ] as const) {
      if (!v?.startsWith("TODO-")) continue;
      const msg = `[placeholder-source] ${r.file}: ${k} "${v}" が TODO プレースホルダ`;
      if (r.isActive) {
        errors.push(`${msg} のまま isActive:true (本番配信対象)`);
      } else {
        warns.push(`${msg} (isActive:false のため warn)`);
      }
    }
  }

  // ── provenance (出典・再現性) 検査 ──
  // 正規表現でなく registry の型付きオブジェクトで nested config を堅牢に読む。
  // 正典: .claude/rules/data-provenance-standards.md
  const registryKeys = new Set(Object.keys(METRICS_REGISTRY));
  for (const [key, cfg] of Object.entries(METRICS_REGISTRY)) {
    const src = cfg.source as
      | {
          kind?: string;
          fetcherKey?: string;
          config?: Record<string, unknown>;
          url?: string;
        }
      | undefined;
    const isActive = cfg.isActive === true;

    if (src?.kind === "external") {
      const fk = src.fetcherKey;
      const conf = (src.config ?? {}) as Record<string, unknown>;
      const prov = conf.provenance as Record<string, unknown> | undefined;

      // [provenance] 手動抽出 (manual) は復元に足る provenance が必須
      if (fk === "manual") {
        const hasLocator = Boolean(prov?.pdfUrl || prov?.url);
        const missing = [
          !hasLocator && "url/pdfUrl",
          !prov?.accessedAt && "accessedAt",
          !prov?.extraction && "extraction",
          !prov?.verification && "verification",
          !prov?.restore && "restore",
        ].filter(Boolean);
        if (missing.length > 0) {
          const msg = `[provenance] ${key}: 手動抽出(manual)だが provenance 不足 (欠落: ${missing.join(", ")})`;
          if (isActive) errors.push(`${msg} ・isActive:true`);
          else warns.push(`${msg} (isActive:false のため warn)`);
        }
      } else {
        // [provenance-thin] 機械再取得キーも provenance も無い external を可視化 (warn)
        // calculated (親から再計算可能・calc-ref が resolvable) は除外
        const calcObj = cfg.calculation as Record<string, unknown> | undefined;
        const calcResolvable =
          fk === "calculated" &&
          [calcObj?.numeratorKey, calcObj?.denominatorKey]
            .filter(Boolean)
            .every((r) => registryKeys.has(r as string)) &&
          Boolean(calcObj?.numeratorKey);
        const hasMachineId = Boolean(
          conf.ksjDataId ||
            (conf.estat as Record<string, unknown> | undefined)?.statsDataId ||
            conf.statsDataId ||
            src.url ||
            (conf.source as Record<string, unknown> | undefined)?.url,
        );
        if (!calcResolvable && (fk === "unknown" || !hasMachineId)) {
          warns.push(
            `[provenance-thin] ${key}: external(fetcherKey:${fk ?? "?"}) に再取得キー/出典URL が無い (要 provenance backfill)`,
          );
        }
      }
    }

    // [calc-ref] 計算系 metric の参照先 key が registry に実在するか
    const refs: Array<string | undefined> = [];
    const calc = cfg.calculation as Record<string, unknown> | undefined;
    if (calc) {
      for (const f of ["numeratorKey", "denominatorKey", "numeratorRankingKey", "denominatorRankingKey"]) {
        refs.push(calc[f] as string | undefined);
      }
    }
    if (src?.kind === "calculated") {
      const formula = (cfg.source as { formula?: Record<string, unknown> }).formula ?? {};
      for (const f of ["numerator", "denominator", "left", "right"]) {
        refs.push(formula[f] as string | undefined);
      }
    }
    for (const ref of refs) {
      if (ref && !registryKeys.has(ref)) {
        errors.push(`[calc-ref] ${key}: 参照先 metric "${ref}" が registry に実在しない`);
      }
    }

    // [calc-period] / [calc-display] 計算型 metric (fetcherKey:"calculated") の宣言必須項目。
    //
    // ★期間 (月額 / 年額) は e-Stat のメタに無く、単位もどちらも「円」なので**機械では
    //   判別できない**。宣言が無いまま引き算すると 12 倍ズレた値が配信される
    //   (disposable-income-after-rent の実害。2026-08-05)。比は期間が約分されるので不要。
    // ★丸め桁は配信値そのものを決める。既定に頼ると生成器の実装差で値が動く。
    const isCalculatedFetcher =
      src?.kind === "external" && (src as { fetcherKey?: string }).fetcherKey === "calculated";
    if (isCalculatedFetcher) {
      const calcType = (calc?.type ?? calc?.calculationType) as string | undefined;
      if (calcType === "subtraction" && !calc?.periodAlign) {
        errors.push(
          `[calc-period] ${key}: subtraction は calculation.periodAlign の宣言が必須` +
            ` (月額と年額を引き算する事故を防ぐ)`,
        );
      }
      const display = cfg.display as { decimalPlaces?: unknown } | undefined;
      if (typeof display?.decimalPlaces !== "number") {
        errors.push(
          `[calc-display] ${key}: 計算型は display.decimalPlaces が必須 (丸め桁が配信値を決めるため)`,
        );
      }
    }
  }

  // error: 重複 title (正規化後同名) に区別子(subtitle)が無い
  const byNorm = new Map<string, Row[]>();
  for (const r of rows) {
    const n = normalizeTitle(r.title);
    (byNorm.get(n) ?? byNorm.set(n, []).get(n)!).push(r);
  }
  for (const [, group] of byNorm) {
    if (group.length < 2) continue;
    for (const r of group) {
      if (!r.subtitle || looksLikeNote(r.subtitle)) {
        errors.push(`[dup-title] ${r.file}: 同名 title が ${group.length} 件あるが区別子(subtitle)なし 「${r.title}」`);
      }
    }
  }

  // ── 出力 ──
  console.log(`metric-config 検証: ${files.length} configs / error ${errors.length} / warn ${warns.length}`);

  if (warns.length > 0) {
    console.log("⚠️  warn 内訳:", tally(warns));
    for (const w of warns.slice(0, 30)) console.log("   " + w);
    if (warns.length > 30) console.log(`   … 他 ${warns.length - 30} 件`);
  }

  if (errors.length > 0) {
    console.error(`\n❌ metric-config 検証: ${errors.length} 件の error`);
    console.error("   内訳:", tally(errors));
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
