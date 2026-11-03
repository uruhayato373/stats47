/** 記事に手で広告を置いた印。この記事には広告の段を自動で差し込まない (手で置いた位置を尊重する) */
const MANUAL_AD_TAG = /<(ad-slot|affiliate-text|affiliate-banner)\b/;

/** 本文の段を置く h2 の番号 (0 始まり。2・4・6 番目の直前) */
const ROW_BEFORE_H2 = [1, 3, 5];

/**
 * 本文に広告の段を差し込む行 (h2 の行番号) を、上限 max まで上から返す (2026-11-03)。
 * 手で広告を置いた記事と見出しの足りない記事は少なくなる。コードフェンスの中の "## " は見出しに数えない。
 * ページ (段の中身を割り当てる側) と本文 (差し込む側) が同じ関数で数え、使わない段に広告を割り当てない。
 */
export function adRowTargets(md: string, max: number): number[] {
  if (max <= 0 || MANUAL_AD_TAG.test(md)) return [];
  const h2Indices: number[] = [];
  let inFence = false;
  md.split("\n").forEach((line, i) => {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
    } else if (!inFence && /^##\s/.test(line)) {
      h2Indices.push(i);
    }
  });
  return ROW_BEFORE_H2.map((n) => h2Indices[n]).filter((i): i is number => i != null).slice(0, max);
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
