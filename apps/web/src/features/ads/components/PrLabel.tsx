/**
 * 広告であることを示す小さな「PR」表記。画像バナーの上に置く。
 *
 * ★ 2026-10-08 オーナー判断で画像バナーに復元した (2026-08-14 に一度外していた)。
 *   ASP のバナー画像だけでは記事の図と見分けにくく、景品表示法のステマ告示 (2023-10-01 施行) の
 *   観点でも広告であることを示す。見出し・商品名・装飾は引き続き足さない。
 *   正典: .claude/rules/affiliate-ads-standards.md §3
 */
export function PrLabel() {
  return <span className="text-xs font-medium leading-none text-muted-foreground">PR</span>;
}
