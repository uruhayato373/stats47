'use strict';

/**
 * .claude/todo のバックログを機械可読な JSON へ変換する純関数。
 *
 * ## なぜ新設するか
 *
 * 既存の `.claude/scripts/management/parse-backlog.cjs` は 06 の**表形式**専用で、
 * 05 と 06 の `### [ID] タイトル` + bullet 形式を読めない。backlog-loop は
 * 「どのエントリを・どの行から・どの行まで削除するか」を機械で確定させる必要があるため、
 * **行番号つき**で切り出せるパーサが要る (行番号が無いと完了時の削除が文字列置換になり、
 * 同じ語が本文に出ただけで別のエントリを壊す)。
 *
 * ## 設計上の約束
 *
 * - I/O を持たない (呼び出し側が読み込んだテキストを渡す)。テストが実ファイルに依存しない
 * - 解釈できない行は**捨てずに** raw として保持する。往復 (parse → render) でバイト一致することを
 *   テストが固定する。往復が壊れると「削除したつもりが別の行も消える」事故になる
 * - status / tier は正規化しない (docs-governance の語彙が SSOT。ここで別の語彙を作らない)
 *
 * 正典: `.claude/rules/backlog-loop.md`
 */

/** `### [ID] タイトル` — ID は docs-governance の idPattern と同じ形 */
const ENTRY_HEADING = /^###\s+\[([A-Z0-9]+(?:-[A-Z0-9]+)+)\]\s*(.*)$/;
/** `## P0 緊急` のようなセクション見出し */
const SECTION_HEADING = /^##\s+(.+)$/;
/** `- **status**: pending` */
const FIELD_LINE = /^-\s+\*\*([^*]+)\*\*\s*[:：]\s*(.*)$/;

/**
 * 見出し型バックログ (05 / 06 の P0・P2 調査キュー) を解析する。
 *
 * @param {string} text ファイル全文
 * @param {string} sourceFile 報告用のパス
 * @returns {{entries: Array, lineCount: number}} entries は startLine/endLine が 1-indexed・両端含む
 */
function parseHeadingEntries(text, sourceFile) {
  const lines = String(text ?? '').split('\n');
  const entries = [];
  let current = null;
  let section = null;

  const close = (endLine) => {
    if (!current) return;
    // 末尾の空行はエントリに含めない (削除したとき段落の区切りが崩れないように)
    let end = endLine;
    while (end > current.startLine && lines[end - 1].trim() === '') end -= 1;
    current.endLine = end;
    current.body = lines.slice(current.startLine - 1, end).join('\n');
    entries.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    const heading = ENTRY_HEADING.exec(line);
    if (heading) {
      close(lineNo - 1);
      current = {
        id: heading[1],
        title: heading[2].trim(),
        section,
        sourceFile,
        startLine: lineNo,
        endLine: lineNo,
        fields: {},
        body: '',
      };
      continue;
    }

    const sectionHeading = SECTION_HEADING.exec(line);
    if (sectionHeading) {
      close(lineNo - 1);
      section = sectionHeading[1].trim();
      continue;
    }

    if (current) {
      const field = FIELD_LINE.exec(line);
      // 同名フィールドは最初の 1 つを採る (本文中の再掲で上書きしない)
      if (field && !(field[1] in current.fields)) {
        current.fields[field[1]] = field[2].trim();
      }
    }
  }
  close(lines.length);

  return { entries, lineCount: lines.length };
}

/**
 * 表形式バックログ (01 受信箱 / 06 の P1・P2 検証済み候補) を解析する。
 *
 * 表は複数あってよく、ヘッダ行の列名で区別する。行の識別子は「ファイル + 表の通番 + 行の通番」で、
 * ID を持たない 01 でも ledger と結び付けられるようにする。
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
      // ★空行では header を捨てない。実データ (01_未整理タスク.md) は表の途中に空行があり、
      //   そこで header を落とすと後続の行が「新しい表のヘッダ」に化けて 1 行まるごと消える
      //   (実測: 13 行のうち 1 行が拾えなかった)。空行以外の地の文で初めて表が終わったとみなす。
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

/** 見出し型エントリを元テキストから復元する (往復テスト用) */
function renderHeadingEntry(entry) {
  return entry.body;
}

module.exports = {
  ENTRY_HEADING,
  parseHeadingEntries,
  parseTableRows,
  removeLineRanges,
  renderHeadingEntry,
};
