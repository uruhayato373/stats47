/**
 * 部品の見た目を呼び出し側で上書きしていないかの静的監査 (design-system:check の 4 規則)。
 *
 * - panel-no-text-size-override: パネルの className・contentClassName・bodyClassName に文字の大きさ・行の高さを書かない
 * - disclosure-no-look-override / empty-state-no-look-override: 開閉・空の状態の className に見た目を足さない
 * - link-row-no-size-override: リンクの行・一覧の className に寸法を書かない
 *
 * 開閉 (FaqSection・ContentDisclosure) と空の状態 (ChartEmptyState・ChartErrorState) の見た目は部品が持つ
 * (開閉 = 質問 14px・500・上下 10px・項目の間に線、空の状態 = 余白 24px・間隔 16px・破線の枠)。2026-10-28 まではページの側が
 * 地の色・線・行の高さ・文字色を足していた。className・contentClassName は置き場所 (外の余白・表示切替・縦横比・最小の高さ・
 * 子の間隔) だけに使う。
 * リンクの行 (RailNavRow・RailNavRowButton・railNavRowClassName・RailLinkList) の寸法は部品 (LINK_ROW_SIZE_CLASS) が持つ。
 * 行には文字の大きさ・行の高さ・余白・高さを、一覧には行の間隔・左右の余白を書かない
 * (一覧の上下の位置 mt-* / mb-* は一覧の外側なので対象外。太さ・色は上書きではないので対象外)。
 *
 * 2026-10-28 まではこの 4 規則が `className="…"` と `className={"…"}` だけを読み、`className={cn(…)}`・
 * テンプレート文字列・三項演算子で同じ上書きを書くと素通りした (DESIGN-CHECK-CLASSNAME-EXPR-01)。
 * classNameText がその全ての形から文字列リテラルを取り出し、4 規則が同じ関数を通る。純関数 (副作用なし)。
 */

export const PANEL_COMPONENTS = ['ChartPanel', 'SurfaceCard', 'SurfaceSection', 'SectionCard', 'RailCard', 'ArticleCard'];
const PANEL_TAG = new RegExp(`<(${PANEL_COMPONENTS.join('|')})\\b`, 'g');
const PANEL_TEXT_SIZE =
  /(?<![\w-])(?:[\w-]+:)*(?:text-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])(?:\/[\w.]+)?|leading-[\w.[\]-]+)!?(?![\w-])/;
// 見た目を部品が持ち、呼び出し側で変えない部品 (開閉・空の状態)
const LOOK_LOCKED_TAG = /<(FaqSection|ContentDisclosure|ChartEmptyState|ChartErrorState)\b/g;
const LOOK_OVERRIDE_TOKEN =
  /^(?:[\w-]+:)*!?(?:p[xytrbl]?-|gap-|border|bg-|rounded|shadow|ring|text-|font-|leading-|tracking-|divide-)[^\s]*$/;
const LINK_ROW_TAG = /<(RailNavRow|RailNavRowButton|RailLinkList)\b|railNavRowClassName\(\{/g;
const LINK_LIST_SIZE_TOKEN =
  /^!?(?:[\w-]+:)*!?(?:-?(?:mx|px|ms|me|ps|pe)-|gap-|space-y-|text-(?:xs|sm|base|lg|xl|[2-9]xl|\[)|leading-)/;
const LINK_ROW_SIZE_TOKEN =
  /^!?(?:[\w-]+:)*!?(?:-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|ms|me)-|(?:min-|max-)?h-|size-|w-|text-(?:xs|sm|base|lg|xl|[2-9]xl|\[)|leading-)/;

/** text[start] から JSX の開始タグの終わり (> または />) までを返す。{…} の中の > は数えない */
export function jsxOpeningTag(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '>' && depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

/** 文字ごとの {…} の深さ (0 = 開始タグの属性の並び) */
export function topLevelMask(tag) {
  const depths = [];
  let depth = 0;
  for (const ch of tag) {
    if (ch === '}') depth -= 1;
    depths.push(depth);
    if (ch === '{') depth += 1;
  }
  return depths;
}

/**
 * src[start] (開き引用符の位置) から文字列リテラルを読み、{ pieces, end } (end は閉じ引用符の次) を返す。
 * テンプレート文字列は固定部分だけを pieces に入れ、${…} の中の文字列リテラルも拾う。
 * ${…} に接した断片は途中で切れたクラス名 (gap-${n} の "gap-") なので、接している側の語を捨てる。
 */
function readStringLiteral(src, start) {
  const quote = src[start];
  const pieces = [];
  let buf = '';
  let i = start + 1;
  let afterInterpolation = false;
  const flush = (beforeInterpolation) => {
    let piece = buf;
    if (afterInterpolation) piece = piece.replace(/^\S+/, '');
    if (beforeInterpolation) piece = piece.replace(/\S+$/, '');
    if (piece.trim()) pieces.push(piece.trim());
    buf = '';
  };
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') {
      buf += src[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (ch === quote) {
      flush(false);
      return { pieces, end: i + 1 };
    }
    if (quote === '`' && ch === '$' && src[i + 1] === '{') {
      flush(true);
      const inner = readExpression(src, i + 2, { stopAtComma: false });
      pieces.push(...inner.pieces);
      i = inner.end + 1;
      afterInterpolation = true;
      continue;
    }
    buf += ch;
    i += 1;
  }
  flush(false);
  return { pieces, end: i };
}

/**
 * src[start] から式を読み、中の文字列リテラルを pieces に集める。
 * 閉じ括弧 (対応の無い ) ] }) か、stopAtComma のときは深さ 0 の , で止まり、その位置を end で返す。
 * cn(…)・clsx(…)・`a ${b}`・三項演算子・&& の右辺など、書き方によらず同じ要素のクラスとして読む。
 */
function readExpression(src, start, { stopAtComma }) {
  const pieces = [];
  let depth = 0;
  let i = start;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const lit = readStringLiteral(src, i);
      pieces.push(...lit.pieces);
      i = lit.end;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') {
      if (depth === 0) return { pieces, end: i };
      depth -= 1;
    } else if (ch === ',' && depth === 0 && stopAtComma) return { pieces, end: i };
    i += 1;
  }
  return { pieces, end: i };
}

/**
 * tag の中の className 系の属性 (JSX の name="…"・name={式}、関数の引数の name: 式) を列挙する。
 * value は式の中の文字列リテラルを空白でつないだもの。式が文字列を持たない (変数だけ) なら空。
 * depthAt を渡すと、{…} の外 (属性の並びの直下) にある属性だけを返す。
 *   action={<Link className=…>} のような属性の中の JSX はパネル自身の属性ではない。
 */
export function classNameProps(tag, names = ['className'], depthAt = null) {
  const out = [];
  const re = new RegExp(`\\b(${names.join('|')})(?:=|:\\s*)`, 'g');
  for (const m of tag.matchAll(re)) {
    if (depthAt && depthAt[m.index] !== 0) continue;
    const valueStart = m.index + m[0].length;
    let pieces;
    if (tag[valueStart] === '{') {
      pieces = readExpression(tag, valueStart + 1, { stopAtComma: false }).pieces;
    } else if (m[0].endsWith('=')) {
      // JSX の name="…" は文字列リテラル 1 つで終わる (後ろの属性は読まない)
      pieces = /["'`]/.test(tag[valueStart] ?? '') ? readStringLiteral(tag, valueStart).pieces : [];
    } else {
      // 関数の引数の name: 式 は、深さ 0 の , か閉じ括弧まで
      pieces = readExpression(tag, valueStart, { stopAtComma: true }).pieces;
    }
    out.push({ name: m[1], index: m.index, value: pieces.join(' ') });
  }
  return out;
}

/** className の式から取り出した文字列 (テスト用の薄い入口) */
export function classNameText(attributeSource, name = 'className') {
  return classNameProps(attributeSource, [name]).map((p) => p.value);
}

/**
 * text の中の 4 規則の違反を返す。{ ruleId, index (text 内の位置), line (表示用) }。
 * メッセージ・ファイル・行番号は呼び出し側 (check-design-system.mjs) が付ける。
 */
export function findClassOverrideViolations(text) {
  const found = [];
  const PANEL_PROPS = ['className', 'contentClassName', 'bodyClassName'];
  for (const match of text.matchAll(PANEL_TAG)) {
    const tag = jsxOpeningTag(text, match.index);
    for (const prop of classNameProps(tag, PANEL_PROPS, topLevelMask(tag))) {
      const size = prop.value.match(PANEL_TEXT_SIZE);
      if (!size) continue;
      found.push({
        ruleId: 'panel-no-text-size-override',
        index: match.index + prop.index,
        line: `<${match[1]} ${prop.name}="${size[0]}">`,
      });
    }
  }
  for (const match of text.matchAll(LOOK_LOCKED_TAG)) {
    const tag = jsxOpeningTag(text, match.index);
    for (const prop of classNameProps(tag, PANEL_PROPS, topLevelMask(tag))) {
      const override = prop.value.split(/\s+/).find((t) => LOOK_OVERRIDE_TOKEN.test(t));
      if (!override) continue;
      const isDisclosure = match[1] === 'FaqSection' || match[1] === 'ContentDisclosure';
      found.push({
        ruleId: isDisclosure ? 'disclosure-no-look-override' : 'empty-state-no-look-override',
        index: match.index + prop.index,
        line: `<${match[1]} ${prop.name}="${override}">`,
      });
    }
  }
  for (const match of text.matchAll(LINK_ROW_TAG)) {
    const isTag = match[0].startsWith('<');
    const isList = match[1] === 'RailLinkList';
    const tag = isTag
      ? jsxOpeningTag(text, match.index)
      : text.slice(match.index, text.indexOf('})', match.index) + 2);
    const sizeToken = isList ? LINK_LIST_SIZE_TOKEN : LINK_ROW_SIZE_TOKEN;
    for (const prop of classNameProps(tag, ['className'], isTag ? topLevelMask(tag) : null)) {
      const forced = prop.value.split(/\s+/).find((t) => sizeToken.test(t));
      if (!forced) continue;
      found.push({ ruleId: 'link-row-no-size-override', index: match.index + prop.index, line: forced });
    }
  }
  return found;
}
