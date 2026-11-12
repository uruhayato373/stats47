/** 段の数を決める h2 の番号 (0 始まり)。h2 が 2 本で 1 段・4 本で 2 段・6 本で 3 段 (2026-11-03 の数のルールのまま) */
const ROW_COUNT_BY_H2 = [1, 3, 5];

/**
 * スマホ (幅 390px) で描いたときの 1 行の高さの見積もり (px)。段を等間隔に置くための目安で、実寸ではない
 * (図 1 枚 ≈ 450px・本文 1 行 ≈ 20 字 × 28px)。合っているかは、手元の記事をスマホ幅で開いて段の間隔を測って確かめる
 */
const LINE_HEIGHT_PX = 28;
const CHARS_PER_LINE = 20;
const FIGURE_PX = 450;
const HEADING_PX = 80;
const LINK_CARD_PX = 160;

function estimateLineHeight(line: string): number {
  const text = line.trim();
  if (text === "") return 0;
  if (/^!\[[^\]]*\]\(/.test(text)) return FIGURE_PX;
  if (/^#{1,6}\s/.test(text)) return HEADING_PX;
  if (text.startsWith("<source-link")) return LINK_CARD_PX;
  return Math.ceil(text.length / CHARS_PER_LINE) * LINE_HEIGHT_PX;
}

/**
 * 本文に広告の段を差し込む行 (h2 の行番号) を、上限 max まで上から返す (2026-11-03)。
 * 手で広告を置いた記事と見出しの足りない記事は少なくなる。コードフェンスの中の "## " は見出しに数えない。
 * ページ (段の中身を割り当てる側) と本文 (差し込む側) が同じ関数で数え、使わない段に広告を割り当てない。
 *
 * 位置は 2026-11-12 オーナー決定で「2・4・6 番目の h2 の前」から「本文の長さで等間隔」に変えた。
 * 見出しの間の文章が長い記事では、スマホで広告の間が最大 3,800〜4,800px (画面 5〜6 枚) 空いていたため。
 * 段の数は変えず、広告の間 (本文の先頭 → 段 → 記事の末尾の段) の最大がいちばん小さくなる h2 の組み合わせの前へ置く。
 * 1 番目の h2 の前には置かない (冒頭の読み始めに広告を挟まない)。
 */
export function adRowTargets(md: string, max: number): number[] {
  // 手で広告を置いた記事も段を入れる (2026-11-12。手置きの <ad-slot>・<affiliate-banner> は描かなくなった)
  if (max <= 0) return [];
  const lines = md.split("\n");
  const h2: { line: number; y: number }[] = [];
  let inFence = false;
  let y = 0;
  lines.forEach((line, i) => {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      y += LINE_HEIGHT_PX;
      return;
    }
    if (!inFence && /^##\s/.test(line)) h2.push({ line: i, y });
    y += inFence ? LINE_HEIGHT_PX : estimateLineHeight(line);
  });
  const total = y;
  const rowCount = Math.min(max, ROW_COUNT_BY_H2.filter((n) => n < h2.length).length);
  if (rowCount === 0) return [];

  // 候補の h2 から rowCount 個を選ぶ組み合わせのうち、広告の間 (本文の先頭 → 段 → … → 記事の末尾の段) の最大が
  // いちばん小さいものを採る。同じなら間の 2 乗の和が小さい方 (より均等な方)。候補は多くて十数本・段は 3 つまでなので全部試す
  const candidates = h2.slice(1);
  let best: { picks: number[]; maxGap: number; spread: number } | null = null;
  const pick = (start: number, picks: number[]) => {
    if (picks.length === rowCount) {
      const ys = [0, ...picks.map((c) => candidates[c].y), total];
      const gaps = ys.slice(1).map((v, i) => v - ys[i]);
      const maxGap = Math.max(...gaps);
      const spread = gaps.reduce((s, g) => s + g * g, 0);
      if (!best || maxGap < best.maxGap || (maxGap === best.maxGap && spread < best.spread)) best = { picks: [...picks], maxGap, spread };
      return;
    }
    for (let c = start; c <= candidates.length - (rowCount - picks.length); c++) pick(c + 1, [...picks, c]);
  };
  pick(0, []);
  return best ? (best as { picks: number[] }).picks.map((c) => candidates[c].line) : [];
}

/** adRowTargets の行の直前に `<ad-row index="N">` を差し込む (N は上からの段の番号) */
export function injectAdRows(md: string, rowCount: number): string {
  const targets = adRowTargets(md, rowCount);
  if (targets.length === 0) return md;
  const result = md.split("\n");
  // 行番号のズレを防ぐため後ろから挿入する
  targets
    .map((line, index) => ({ line, index }))
    .reverse()
    .forEach(({ line, index }) => result.splice(line, 0, "", `<ad-row index="${index}"></ad-row>`, ""));
  return result.join("\n");
}
