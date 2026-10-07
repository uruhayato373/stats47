/**
 * sync-estat-years — e-Stat の実在年の台帳から metric config の `years` を合わせる。
 *
 * 規則は `src/estat-availability.ts` の `resolveLedgerYears` だけ: 全県の値がある年は `yearExclusions` に
 * 無ければ入れ、1 県も値が無い年は外し、一部の県だけの年は今のままにする。外したい年は `years` から
 * 手で消さず `yearExclusions` に理由付きで書く (消してもこのスクリプトが戻す)。
 * 経緯: `.claude/todo/backlog.md` ESTAT-YEAR-AVAILABILITY-01。
 *
 *   npx tsx packages/data-configs/scripts/sync-estat-years.ts            # metric config を書き換える (年を足す・除外した年を外す)
 *   npx tsx packages/data-configs/scripts/sync-estat-years.ts --check    # 書き換えが要る metric があれば exit 1
 *   npx tsx packages/data-configs/scripts/sync-estat-years.ts --remove-missing  # 1 県も値が無い年も外す (人が報告を見てから)
 *   npx tsx packages/data-configs/scripts/sync-estat-years.ts --migrate  # 2026-10 の移行 (1 回だけ。--remove-missing を含む)。
 *       意図して外した可能性がある年を `YEAR_EXCLUSION_INHERITED` の除外として残してから合わせる
 *
 * 台帳が無い・取得に失敗した・行が切れた・重複行がある条件の metric と、`years: "all"` の metric は触らない。
 * `years` が増えた metric の R2 の値は、次の取り込み (`data-refresh.yml`) で増える。このスクリプトは R2 に触れない。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  expandYearSpec,
  formatYearList,
  inheritedExclusionYears,
  resolveLedgerYears,
  YEAR_EXCLUSION_INHERITED,
} from "../src/estat-availability.js";
import type { YearExclusion, YearSpec } from "../src/types.js";
import { METRICS_DIR, formatTsValue, keyToFilename } from "./_lib.js";
import { collectTargets, loadLedgerEntries } from "./build-estat-availability.js";

interface Plan {
  key: string;
  years: number[];
  exclusions: YearExclusion[];
  added: number[];
  removed: number[];
  inherited: number[];
}

/** 連続した年は `{from, to}`、飛びがあれば `{years}` にする。 */
export function yearSpecOf(years: readonly number[]): YearSpec {
  const contiguous = years.every((year, i) => i === 0 || year === years[i - 1]! + 1);
  return contiguous ? { from: years[0]!, to: years[years.length - 1]! } : { years: [...years] };
}

/** 最上位のプロパティ `"<name>": <値>,` (手書きのファイルは引用符なし) の範囲。値の終わりの `,` と改行まで。無ければ null。 */
function topLevelPropertyRange(source: string, name: string): { start: number; end: number } | null {
  const match = new RegExp(`^  "?${name}"?: `, "m").exec(source);
  if (!match) return null;
  let i = match.index + match[0].length;
  let depth = 0;
  let inString = false;
  for (; i < source.length; i++) {
    const ch = source[i]!;
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") depth--;
    else if (ch === "," && depth === 0) break;
  }
  const end = source.indexOf("\n", i);
  return { start: match.index, end: end < 0 ? source.length : end + 1 };
}

/**
 * metric の TS ファイルの `years` を置き換え、`yearExclusions` をその直後に置く (空なら消す)。
 * ほかのプロパティには触れない。`years` が見つからなければ例外。
 */
export function rewriteYearsBlock(source: string, years: YearSpec, exclusions: readonly YearExclusion[]): string {
  let text = source;
  const existing = topLevelPropertyRange(text, "yearExclusions");
  if (existing) text = text.slice(0, existing.start) + text.slice(existing.end);
  const range = topLevelPropertyRange(text, "years");
  if (!range) throw new Error('最上位の "years" が見つからない');
  // 生成されたファイルはキーを引用符で囲み、手書きのファイルは囲まない。ファイルの書き方に合わせる
  const quoted = text.slice(range.start).startsWith('  "years"');
  const key = (name: string) => (quoted ? JSON.stringify(name) : name);
  const value = (v: unknown) => {
    const formatted = formatTsValue(v, 1);
    return quoted ? formatted : formatted.replace(/"(\w+)": /g, "$1: ");
  };
  const block =
    `  ${key("years")}: ${value(years)},\n` +
    (exclusions.length > 0 ? `  ${key("yearExclusions")}: ${value(exclusions)},\n` : "");
  return text.slice(0, range.start) + block + text.slice(range.end);
}

function plan(migrate: boolean, removeMissing: boolean): { plans: Plan[]; skipped: string[] } {
  const ledger = loadLedgerEntries();
  const plans: Plan[] = [];
  const skipped: string[] = [];
  for (const target of collectTargets()) {
    const { config } = target;
    const entry = ledger.get(target.src.statsDataId)?.get(target.queryKey);
    if (!entry?.years || entry.error || entry.truncated || entry.duplicateRows) continue;
    const configYears = expandYearSpec(config.years);
    if (!configYears) continue;

    const exclusions = [...(config.yearExclusions ?? [])];
    const already = new Set(exclusions.flatMap((e) => e.years));
    const inherited = migrate
      ? inheritedExclusionYears(configYears, entry.years).filter((year) => !already.has(year))
      : [];
    if (inherited.length > 0) exclusions.push({ years: inherited, reason: YEAR_EXCLUSION_INHERITED });

    const resolved = resolveLedgerYears({
      configYears,
      ledgerYears: entry.years,
      excludedYears: exclusions.flatMap((e) => e.years),
      suppliedYears: (config.supplementalSources ?? []).flatMap((s) => s.years),
      removeMissing,
    });
    if (resolved.years.length === 0) {
      skipped.push(`${config.key} (台帳に値のある年が無い)`);
      continue;
    }
    if (resolved.added.length === 0 && resolved.removed.length === 0 && inherited.length === 0) continue;
    plans.push({ key: config.key, ...resolved, exclusions, inherited });
  }
  return { plans, skipped };
}

function main(): void {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const migrate = argv.includes("--migrate");
  const { plans, skipped } = plan(migrate, migrate || argv.includes("--remove-missing"));

  const added = plans.filter((p) => p.added.length > 0).length;
  const removed = plans.filter((p) => p.removed.length > 0).length;
  const inherited = plans.filter((p) => p.inherited.length > 0).length;
  console.log(
    `years を合わせる metric ${plans.length} 件 (年を足す ${added}・外す ${removed}` +
      `${migrate ? `・除外を引き継ぐ ${inherited}` : ""})`,
  );
  for (const s of skipped) console.log(`  [skip] ${s}`);

  if (check) {
    for (const p of plans.slice(0, 30)) {
      console.log(
        `  ${p.key}: ${p.added.length > 0 ? `+${formatYearList(p.added)} ` : ""}` +
          `${p.removed.length > 0 ? `-${formatYearList(p.removed)}` : ""}`,
      );
    }
    if (plans.length > 0) {
      console.error(
        "✗ metric config の years が e-Stat の実在年の台帳と合っていない。" +
          "`npx tsx packages/data-configs/scripts/sync-estat-years.ts` で合わせる" +
          " (外したい年は yearExclusions に理由付きで書く)",
      );
      process.exit(1);
    }
    console.log("✓ metric config の years は台帳と合っている");
    return;
  }

  for (const p of plans) {
    const file = resolve(METRICS_DIR, keyToFilename(p.key));
    const source = readFileSync(file, "utf8");
    writeFileSync(file, rewriteYearsBlock(source, yearSpecOf(p.years), p.exclusions));
  }
  console.log(`✎ ${plans.length} 件の metric config を書き換えた`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
