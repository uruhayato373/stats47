/**
 * 文書検査 (check-docs-governance.cjs --json) の error を、提案の適用前後で比べる純関数。
 *
 * 無人 triage は improvements / backlog / improvement-log だけを書く。適用前から出ている error
 * (別 workflow の state が原因など) で triage の結果を丸ごと捨てないよう、適用で増えた error だけを返す。
 * 2026-10-05: W40 の run 37245377864 は、別 workflow が巻き戻した月次記録の DG084 で docs:check が落ち、
 * ゲートを通った提案 (削除 1・更新 5) が push されずに失われた (Issue #1068)。
 *
 * 同一性は code + file + message。適用前からある error でも message が変われば新規として扱う
 * (件数の悪化を見逃さない側に倒す)。
 */
const key = (f) => `${f.code}\u0000${f.file}\u0000${f.message}`;

/** @returns {{ added: object[], preexisting: object[] }} */
export function diffDocsErrors(before, after) {
  const beforeKeys = new Set((before?.errors ?? []).map(key));
  const added = [];
  const preexisting = [];
  for (const e of after?.errors ?? []) (beforeKeys.has(key(e)) ? preexisting : added).push(e);
  return { added, preexisting };
}
