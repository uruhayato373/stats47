/**
 * SSDS の「資料源」(原典統計名) → survey id の正規化。
 *
 * 対応表の正本は `data/surveys/master/source-names.json` (カタログの surveys.source-names。JSON Schema 付き)。
 * ここは型を付けて読み、原典名から調査 id を解く関数を持つ。調査の名前・機関・URL は調査マスタ
 * (surveys.master) の行だけが持ち、対応表は id で結ぶ (check-datasets が id の実在を止める)。
 *
 * 方針:
 *   - 既存の調査マスタに対応する原典は、その id にマップする (knownSourceToSurvey)。
 *   - 頻度が高く後から調査マスタへ登録した原典は proposedSourceToSurvey で id を結ぶ。
 *   - cdCat01 が Excel に資料源を持たない (財政比率・銀行預金・健康寿命 等の派生項目) ものは
 *     cdcat01SourceOverride で原典名を手当てする。
 *   - 対応表にも override にも無い原典名は、生成器が決定的に slug 化して `ssds-src:<原典名>` を
 *     割り当てる (未マッピングでも全 metric が必ず原典を 1 つ以上持つことを保証)。
 *
 * 出典 Excel: https://www.stat.go.jp/data/ssds/2.html (アクセス日 2026-06-02)
 */
import sourceNames from '../../../../data/surveys/master/source-names.json';

/** 既存の調査マスタにある id への対応 */
export const KNOWN_SOURCE_TO_SURVEY: Record<string, string> =
  sourceNames.knownSourceToSurvey;

/** 調査マスタへ後から登録した原典の対応 (known に無いものだけ引く) */
export const PROPOSED_SOURCE_TO_SURVEY: Record<string, string> =
  sourceNames.proposedSourceToSurvey;

/**
 * cdCat01 が Excel に資料源を持たない派生項目への原典手当て。
 * 値は原典名 (known / proposed で解決される名称)。
 */
export const CDCAT01_SOURCE_OVERRIDE: Record<string, string[]> =
  sourceNames.cdcat01SourceOverride;

/** 原典名 → survey id を解決 (known > proposed > null=auto-slug)。 */
export function resolveSurveyId(sourceName: string): string | null {
  return (
    KNOWN_SOURCE_TO_SURVEY[sourceName] ??
    PROPOSED_SOURCE_TO_SURVEY[sourceName] ??
    null
  );
}
