/**
 * 出典の台帳 (themes.sources) の JSON は import すると値が string に広がる。読み手がリテラル型に頼る値
 * (判別に使う slug・添字に使うキーの並び) だけを読み込み口で型として明示し、台帳の値がその型と違えば
 * 読み込んだ時点で throw する (型と台帳がずれたまま動かさない)。
 */
export function pinLiterals<const T extends readonly string[]>(
  source: string,
  field: string,
  actual: readonly string[],
  expected: T,
): T {
  if (actual.length !== expected.length || actual.some((value, i) => value !== expected[i])) {
    throw new Error(
      `themes.sources ${source} の ${field} (${JSON.stringify(actual)}) が読み込み口の型 (${JSON.stringify(expected)}) と違います`,
    );
  }
  return expected;
}
