/**
 * 出典表示の共通データ型と e-Stat 統計表 URL の唯一の組み立て口。
 *
 * ページ末尾の「データ出典」(web の `DataSourceList`) はこの型だけを描画する。
 * 各面 (blog / ranking / 市区町村 / geo) は自分の lineage からこの型へ変換し、
 * 出典の文字列を画面側で組み立てない。正典: `.claude/rules/survey-linkage-standards.md` §2
 */

const ESTAT_TABLE_URL_BASE = 'https://www.e-stat.go.jp/dbview?sid=';

/** e-Stat の統計表 (DB 表示) URL。statsDataId から URL を作る箇所はここだけにする。 */
export function buildEstatTableUrl(statsDataId: string): string {
  return `${ESTAT_TABLE_URL_BASE}${encodeURIComponent(statsDataId)}`;
}

export interface DataSourceLink {
  label: string;
  url: string;
}

/**
 * 出典 1 行。調査 (surveyId あり) か、調査ではないデータセット (url のみ) のどちらか。
 * - surveyId: surveys.json に実在する id。サイト内の `/survey/<id>` へリンクする
 * - url: 調査・データセットの外部ページ (surveyId が無い行の主リンク)
 * - tables: 実際に値を引いた統計表 (e-Stat 等)。行末に [統計表 ↗] として出す
 */
export interface DataSourceEntry {
  label: string;
  organization?: string;
  surveyId?: string;
  url?: string;
  tables: DataSourceLink[];
  license?: string;
  /** 値の出典ではない補助データの役割 (例: "地図データ")。行頭に小さく出す */
  note?: string;
}

function entryKey(entry: DataSourceEntry): string {
  return entry.surveyId
    ? `survey:${entry.surveyId}`
    : `label:${entry.label}::${entry.url ?? ''}`;
}

/** 同じ調査・同じデータセットを 1 行にまとめ、統計表は URL 単位で重複を除く。出現順を保つ。 */
export function mergeDataSourceEntries(
  entries: readonly DataSourceEntry[]
): DataSourceEntry[] {
  const merged = new Map<string, DataSourceEntry>();
  for (const entry of entries) {
    const key = entryKey(entry);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...entry, tables: [...entry.tables] });
      continue;
    }
    for (const table of entry.tables) {
      if (!current.tables.some((existing) => existing.url === table.url)) {
        current.tables.push(table);
      }
    }
    current.organization ??= entry.organization;
    current.url ??= entry.url;
    current.license ??= entry.license;
    current.note ??= entry.note;
  }
  return [...merged.values()];
}

/**
 * ranking item.json の `sourceConfig.source` ({name,url}) を読む。
 * `sourceConfig` は index signature を持つため、呼び出し側で型ガードを重複させない。
 * (旧 top-level `item.source` は builder が出力しないので読まない)
 */
export function readSourceConfigRef(sourceConfig: unknown): {
  name?: string;
  url?: string;
} {
  if (typeof sourceConfig !== 'object' || sourceConfig === null) return {};
  const source = (sourceConfig as { source?: unknown }).source;
  if (typeof source !== 'object' || source === null) return {};
  const { name, url } = source as { name?: unknown; url?: unknown };
  return {
    ...(typeof name === 'string' && name ? { name } : {}),
    ...(typeof url === 'string' && url ? { url } : {}),
  };
}
