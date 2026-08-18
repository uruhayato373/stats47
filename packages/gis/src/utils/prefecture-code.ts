/**
 * GIS のパス / URL に埋める都道府県コードの書式検証。
 *
 * ## なぜ gis 側に置くか
 *
 * `extractPrefectureCode` (`@stats47/area`) は **`areaCode.substring(0, 2)` を返すだけ**で
 * 書式を検証しない。5 桁の市区町村コードから県コードを切り出す用途では正しい挙動なので
 * あちらは変えない — area は全ページで使われており、厳格化すると波及範囲が読めない。
 *
 * 一方 gis は切り出した 2 文字を **R2 key と外部 API の URL にそのまま補間する**ので、
 * ここでは「2 桁の数字であること」を要求する。CodeQL の
 * `js/request-forgery` (3 件) / `js/path-injection` (4 件) はどちらもこの経路を指しており、
 * 補間の入口 2 箇所 (`buildMlitR2Path` / `buildGeoshapePathSegment`) を塞げば同時に消える。
 *
 * ## 実害があったのは mlit だけ
 *
 * geoshape は `extractPrefectureCode` を通すので長さ 2 に切り詰められ、`..` 1 段までしか
 * 作れず host も変えられなかった。`buildMlitR2Path` は **一切検証せず**に補間しており、
 * 呼び元が長い文字列を渡せばそのまま R2 key とローカルのファイルパスになる。
 *
 * 正典: `.claude/todo/05_機能バックログ.md` の `CODEQL-JS-BACKLOG-01`
 */

/** 都道府県コードの書式。01〜47 の範囲までは見ない (存在しない県は 404 になるだけで害がない) */
const PREFECTURE_CODE_PATTERN = /^\d{2}$/;

/** 2 桁の数字か */
export function isValidPrefectureCode(value: unknown): value is string {
  return typeof value === "string" && PREFECTURE_CODE_PATTERN.test(value);
}

/**
 * 検証して返す。通らなければ throw する。
 *
 * パスや URL を組む**直前**に呼ぶこと。組んだ後で検証しても、既に文字列になった
 * 危険な値が別経路へ渡っている可能性を消せない。
 *
 * @param value 検証する値
 * @param context エラーメッセージに出す呼び出し元 (例: "buildMlitR2Path")
 */
export function assertPrefectureCode(value: unknown, context: string): string {
  if (!isValidPrefectureCode(value)) {
    throw new Error(
      `${context}: prefCode は 2 桁の数字である必要があります (受け取った値: ${JSON.stringify(value)})`,
    );
  }
  return value;
}
