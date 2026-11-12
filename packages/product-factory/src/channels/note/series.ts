/**
 * note シリーズ・レジストリ。商品 family ではなく現行14パックの theme を受ける。
 * 記録の正本は台帳 `note.series` (data/note/series.json + Schema)。ここは型を付け、
 * シリーズごとのテーマの一覧 (themes) を seriesByTheme から導いて export するだけ。
 */
import type { PackTheme } from "../../catalog/types";
import type { NoteProductSeries } from "./types";
import data from "../../../../../data/note/series.json";

export interface NoteSeriesMeta {
  readonly key: NoteProductSeries;
  readonly name: string;
  readonly audience: string;
  readonly themes: readonly PackTheme[];
  readonly defaultStats47Targets: readonly string[];
}

export const SERIES_BY_THEME = data.seriesByTheme as Readonly<Record<PackTheme, NoteProductSeries>>;

function themesFor(series: NoteProductSeries): PackTheme[] {
  return (Object.entries(SERIES_BY_THEME) as Array<[PackTheme, NoteProductSeries]>)
    .filter(([, value]) => value === series)
    .map(([theme]) => theme);
}

export const NOTE_SERIES_REGISTRY = Object.fromEntries(
  Object.entries(data.series).map(([key, meta]) => [
    key,
    { key, name: meta.name, audience: meta.audience, themes: themesFor(key as NoteProductSeries), defaultStats47Targets: meta.defaultStats47Targets },
  ]),
) as unknown as Readonly<Record<NoteProductSeries, NoteSeriesMeta>>;

export const NOTE_SERIES_KEYS: readonly NoteProductSeries[] = Object.keys(
  NOTE_SERIES_REGISTRY,
) as NoteProductSeries[];
