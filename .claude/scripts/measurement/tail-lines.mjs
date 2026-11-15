/**
 * 子プロセスの出力の末尾を、失敗の記録 (1 行の JSON の message) に残す形にする。
 * 例外の本体は stderr の途中にあり、末尾 1 行 (「Node.js v20.19.0」など) だけでは原因が分からない。
 * 改行は message の中の "\n" として JSON に入るので、記録は 1 行のまま (collect-local.mjs の出力契約)。
 */
export function tailLines(text, lines = 20, maxChars = 4000) {
  const tail = String(text ?? '').trim().split('\n').slice(-lines).join('\n');
  return tail.length > maxChars ? tail.slice(-maxChars) : tail;
}
