import { cn } from "@stats47/components";

/**
 * 順位チップの色。意味で選ぶ (見た目の色名で選ばない)。
 * - positive / negative: 「上位の指標」「下位の指標」のように良し悪しの向きがある一覧
 * - primary / neutral / muted: 向きのない順位 (rankToneByPosition が上位・中位・下位から選ぶ)
 */
export type RankBadgeTone = "positive" | "negative" | "primary" | "neutral" | "muted";

const TONE_CLASS: Record<RankBadgeTone, string> = {
  positive: "bg-positive-soft text-positive",
  negative: "bg-negative-soft text-negative",
  primary: "bg-primary/10 text-primary",
  neutral: "bg-accent/40 text-foreground",
  muted: "bg-muted text-muted-foreground",
};

/** 上位・下位として色を変える件数 (47 都道府県の上位 10 / 下位 10)。 */
const EDGE_COUNT = 10;

/**
 * 向きのない順位の色を、全体の中の位置から決める。上位 10 = primary、下位 10 = muted、それ以外 = neutral。
 * total を渡せば 47 以外 (市区町村など) にも同じ規則で使える。
 */
export function rankToneByPosition(rank: number, total = 47): RankBadgeTone {
  if (rank >= 1 && rank <= EDGE_COUNT) return "primary";
  if (rank > total - EDGE_COUNT && rank <= total) return "muted";
  return "neutral";
}

interface RankBadgeProps {
  rank: number;
  tone?: RankBadgeTone;
  className?: string;
}

/**
 * 「N位」を色付きのチップで表示する共通部品。順位チップはこの部品だけで描く。
 *
 * - 幅は固定しない。最小幅 (4em = 「47位」が収まる幅) で一覧の縦位置を揃え、
 *   市区町村の「1741位」のように長い順位は中身に合わせて伸びる
 * - 折り返さない (whitespace-nowrap)。数字は等幅 (tabular-nums)
 * - 表のセル・補足の小さな文字・文章中の「N位」はチップにしない (文字のまま書く)
 *
 * 正典: docs/01_技術設計/04_デザインシステム.md「Surface」/ design-system:check の rank-chip-must-use-rank-badge
 */
export function RankBadge({ rank, tone = "neutral", className }: RankBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[4em] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
        TONE_CLASS[tone],
        className,
      )}
    >
      {rank}位
    </span>
  );
}
