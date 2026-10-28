import { PREFECTURES } from "../data";
import { to5DigitPrefCode } from "./prefecture-code";

export { prefectureShortName } from "./prefecture-short-name";

const NAME_BY_CODE5: ReadonlyMap<string, string> = new Map(
  PREFECTURES.map((p) => [p.prefCode, p.prefName]),
);

/**
 * 都道府県コード (2 桁 `"13"` / 5 桁 `"13000"` / 市区町村 `"13113"`) → 正式名称。未知のコードは null。
 */
export function prefectureNameOf(code: string): string | null {
  if (!code || code.length < 2) return null;
  return NAME_BY_CODE5.get(to5DigitPrefCode(code)) ?? null;
}
