'use strict';

/**
 * .claude/todo のバックログを機械可読な JSON へ変換する純関数。
 *
 * ## v3-unified への移行 (2026-08-18)
 *
 * カード構文のパースは **`.claude/scripts/lib/backlog-lib.cjs` が唯一の実装**
 * (doboku-note と統一のスキーマ。正典 `.claude/rules/todo-standards.md`)。
 * ここは backlog-loop 向けの薄い adapter で、固有に持つのは:
 *   - `sourceFile` の付与 (報告・verify 用)
 *   - 表形式のパース (backlog.md 内の指標候補テーブル等。行単位の削除に使う)
 *   - `removeLineRanges` (完了時の行番号削除)
 *
 * ## 設計上の約束 (不変)
 *
 * - I/O を持たない (呼び出し側が読み込んだテキストを渡す)。テストが実ファイルに依存しない
 * - 削除は**行番号**で行う。文字列一致で消すと、同じ語が本文に出ただけで別のカードを壊す
 *   (カードの startLine/endLine は backlog-lib が計算する)
 *
 * 正典: `.claude/rules/backlog-loop.md`
 */

const { parseBacklog } = require('../lib/backlog-lib.cjs');

/**
 * バックログ (backlog.md) をカード配列として解析する。
 *
 * 返るエントリは backlog-lib のカード
 * (id / tier / title / category / kind / executor / verify / filed / due / wip /
 *  startLine / endLine / body / hasTagLine / unknownKeys ...) に `sourceFile` と
 * `section` (tier の別名・旧 API 互換) を足したもの。
 *
 * @param {string} text ファイル全文
 * @param {string} sourceFile 報告用のパス
 * @returns {{entries: Array, lineCount: number}} startLine/endLine は 1-indexed・両端含む
 */
function parseHeadingEntries(text, sourceFile) {
  const entries = parseBacklog(text).map((card) => ({
    ...card,
    sourceFile,
    section: card.tier,
  }));
  return { entries, lineCount: String(text ?? '').split('\n').length };
}

/**
 * 表形式 (backlog.md 内の指標候補テーブル等) を解析する。
 *
 * 表は複数あってよく、ヘッダ行の列名で区別する。行の識別子は「ファイル + 表の通番 + 行の通番」。
 */
function parseTableRows(text, sourceFile) {
  const lines = String(text ?? '').split('\n');
  const rows = [];
  let header = null;
  let tableIndex = -1;
  let rowIndex = 0;

  const isDivider = (s) => /^\|[\s:|-]+\|$/.test(s.trim());
  const cells = (s) =>
    s
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) {
      // ★空行では header を捨てない。表の途中に空行があるデータが実在し、
      //   そこで header を落とすと後続の行が「新しい表のヘッダ」に化けて 1 行まるごと消える。
      //   空行以外の地の文で初めて表が終わったとみなす。
      if (line.trim() !== '') header = null;
      continue;
    }
    if (isDivider(line)) continue;

    const values = cells(line);

    if (!header) {
      header = values;
      tableIndex += 1;
      rowIndex = 0;
      continue;
    }

    // 同じヘッダがもう一度現れたら別の表の始まり (空行を挟んで表が 2 つ並ぶ場合)
    if (values.length === header.length && values.every((v, idx) => v === header[idx])) {
      tableIndex += 1;
      rowIndex = 0;
      continue;
    }

    const record = {};
    header.forEach((name, idx) => {
      record[name] = values[idx] ?? '';
    });
    rows.push({
      id: `${sourceFile}#t${tableIndex}r${rowIndex}`,
      sourceFile,
      startLine: i + 1,
      endLine: i + 1,
      columns: header,
      values: record,
      raw: line,
    });
    rowIndex += 1;
  }

  return { rows };
}

/**
 * エントリ本文を 1 行ずつ削除して残りを返す (完了時の行削除)。
 *
 * **行番号で消す**。文字列一致で消すと、同じ語を含む別のエントリを巻き込む。
 * 範囲は両端含む 1-indexed で、直後に空行が続く場合はそれも 1 つだけ畳む
 * (エントリ間の空行が二重に残らないようにする)。
 *
 * @param {string} text 元のファイル全文
 * @param {Array<{startLine:number,endLine:number}>} ranges
 * @returns {string}
 */
function removeLineRanges(text, ranges) {
  const lines = String(text ?? '').split('\n');
  const drop = new Set();
  for (const r of ranges) {
    for (let n = r.startLine; n <= r.endLine; n += 1) drop.add(n);
    // 直後の空行 1 本を畳む (エントリの区切りを保つ)
    const after = r.endLine + 1;
    if (after <= lines.length && lines[after - 1].trim() === '') drop.add(after);
  }
  return lines.filter((_, idx) => !drop.has(idx + 1)).join('\n');
}

module.exports = {
  parseHeadingEntries,
  parseTableRows,
  removeLineRanges,
};
