/**
 * ブログ章の末尾に「全 47 都道府県の値」の表を付ける (KINDLE-QUALITY-LOOP-01)。
 *
 * 図は上位・下位と地図だけで、中位の県の値が本に無かった (機械の検査で 12 冊すべて全県表 0、
 * NotebookLM の通読でも 2 冊とも改訂案の 1 位)。表は**図と同じデータ**から作る: R2 の
 * `app/blog/<slug>/data/<name>.json` (図の元データ) を読み、無ければ `<name>.source.json` の rankingKey と年で
 * `app/ranking/<key>/values.json` を読む (年が一致しないときは表を作らない。図と別の年の値を並べない)。
 * 同じ指標・年の図 (ランキングと地図) は 1 表にまとめる。3 列 (順位・都道府県・値) に限る (小さい画面で崩さない)。
 */
import { SITE } from "@stats47/data-configs";

import { fetchRankingValues } from "../../data/load-ranking-values";
import { PREFECTURE_BY_CODE5 } from "../../data/prefectures";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;
const HOUSEHOLD_SURVEY_KEY = /-consumption-(?:quantity|expenditure)$/;

export interface FullTable {
  readonly label: string;
  readonly year: string;
  readonly unit: string;
  readonly rankingKey: string | null;
  readonly rows: readonly { readonly name: string; readonly value: number }[];
}

/** 値の大きい順・同じ値は同じ順位 (1, 2, 2, 4)。 */
function ranked(rows: FullTable["rows"]) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const rankOf = new Map<number, number>();
  sorted.forEach((row, index) => {
    if (!rankOf.has(row.value)) rankOf.set(row.value, index + 1);
  });
  return sorted.map((row) => ({ ...row, rank: rankOf.get(row.value) as number }));
}

export function fullTableMarkdown(table: FullTable): string {
  const unit = table.unit ? `・${table.unit}` : "";
  const notes = ["順位は値の大きい順で、同じ値は同じ順位です。"];
  if (table.rankingKey && HOUSEHOLD_SURVEY_KEY.test(table.rankingKey)) {
    notes.push("家計調査の値は、各県の県庁所在市（東京都は区部）の二人以上の世帯のものです。");
  }
  if (table.rows.length < 47) notes.push(`値のある ${table.rows.length} 都道府県だけを載せています。欠測を 0 や最下位として扱いません。`);
  const fmt = (value: number) => value.toLocaleString("ja-JP", { maximumFractionDigits: 20 });
  return [
    `### 全47都道府県の値：${table.label}（${table.year}年${unit}）`,
    notes.join(""),
    `| 順位 | 都道府県 | 値${table.unit ? `（${table.unit}）` : ""} |\n| ---: | --- | ---: |\n` +
      ranked(table.rows).map((row) => `| ${row.rank} | ${row.name} | ${fmt(row.value)} |`).join("\n"),
  ].join("\n\n");
}

/** 図の元データ (data/<name>.json) を表の形にする。47 県の値がそろわないものは表にしない。 */
export function tableFromFigureData(data: unknown, source: unknown): FullTable | null {
  const record = (value: unknown) => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {});
  const d = record(data);
  const s = record(source);
  if (!Array.isArray(d.data)) return null;
  const rows = d.data
    .map((row) => record(row))
    .filter((row) => typeof row.areaName === "string" && typeof row.value === "number" && Number.isFinite(row.value))
    .map((row) => ({ name: String(row.areaName), value: Number(row.value) }));
  const year = String(d.year ?? s.year ?? "");
  const label = String(d.label ?? s.label ?? d.title ?? "");
  if (rows.length < 47 || new Set(rows.map((row) => row.name)).size !== rows.length || !year || !label) return null;
  return {
    label,
    year,
    unit: String(d.unit ?? s.unit ?? ""),
    rankingKey: typeof (d.rankingKey ?? s.rankingKey) === "string" ? String(d.rankingKey ?? s.rankingKey) : null,
    rows,
  };
}

async function json(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** 本文の図 (data/<name>.svg) ごとに全県表を作り、同じ指標・年は 1 つにまとめた markdown を返す。 */
export async function fullTablesForArticle(
  slug: string,
  figureNames: readonly string[],
  /** 本全体で載せた表の印。前の章と同じ指標・年の表は載せない (同じ本で同じ表を繰り返さない) */
  seen: Set<string> = new Set(),
): Promise<string> {
  const tables: FullTable[] = [];
  for (const name of figureNames) {
    const base = `${R2_BASE}/app/blog/${slug}/data/${name}`;
    const source = await json(`${base}.source.json`);
    let table = tableFromFigureData(await json(`${base}.json`), source);
    const s = (source ?? {}) as Record<string, unknown>;
    if (!table && s.kind === "ranking" && typeof s.rankingKey === "string" && typeof s.year === "string") {
      try {
        const fetched = await fetchRankingValues(s.rankingKey);
        if (fetched.year === s.year) {
          table = {
            label: String(s.label ?? s.rankingKey),
            year: s.year,
            unit: String(s.unit ?? fetched.unit),
            rankingKey: s.rankingKey,
            rows: fetched.values
              .filter((v): v is { code5: string; value: number } => v.value !== null)
              .map((v) => ({ name: PREFECTURE_BY_CODE5.get(v.code5)?.name ?? v.code5, value: v.value })),
          };
        }
      } catch {
        table = null;
      }
    }
    if (!table) continue;
    const key = `${table.rankingKey ?? table.label}|${table.year}|${table.unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tables.push(table);
  }
  return tables.map(fullTableMarkdown).join("\n\n");
}

/** 表を本文の「出典」見出しの前に入れる (無ければ末尾)。 */
export function insertBeforeSources(body: string, section: string): string {
  if (!section) return body;
  const match = body.match(/^#{2,4}\s*(?:データ)?出典/m);
  if (!match || match.index === undefined) return `${body.replace(/\s+$/, "")}\n\n${section}\n`;
  return `${body.slice(0, match.index)}${section}\n\n${body.slice(match.index)}`;
}
