/**
 * 非 SSDS (一次統計) の estat metric の displayName → survey id 正規化。
 *
 * 対応表の正本は `data/surveys/master/source-names.json` (カタログの surveys.source-names)。ここは型を付けて読むだけ。
 *
 * SSDS metric は cdCat01 → ssds-provenance で解決するが、一次統計 (国勢調査・家計調査 等) は
 * `source.displayName` がそのまま調査名になっているため、対応表で survey id に正規化する。
 *
 * tail (displayName が調査名でなく指標ラベルになっている metric) は対応表に載らず、
 * resolver では未解決 (空配列) として扱う。これらは metric config 側の出典ラベルの
 * 品質問題であり、auto-slug で偽の survey を作らず、coverage report で可視化する方針。
 */
import sourceNames from '../../../../data/surveys/master/source-names.json';

/** 非SSDS estat の displayName → survey id */
export const DISPLAYNAME_TO_SURVEY: Record<string, string> =
  sourceNames.displayNameToSurvey;

/**
 * registry に同じ統計表の metric が無く、displayName consensus を作れない一次統計。
 * e-Stat の統計表 ID は恒久 ID なので、ThemeCatalog 等の直接参照も同じ resolver で解決する。
 */
export const STATS_DATA_ID_TO_SURVEY_OVERRIDE: Record<
  string,
  { id: string; name: string }
> = sourceNames.statsDataIdToSurveyOverride;
