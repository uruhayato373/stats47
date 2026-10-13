/**
 * 参考文献由来の指標を、ある展開先に「載せない」と決めた記録 (2026-10-09 新設)。
 * 正本は data/source-inventory/placement-decisions.json (JSON Schema 付き。2026-10-13 に TS から移した)。ここは型を付けて読むだけ。
 *
 * 管理画面の参考文献の展開状況 (`apps/admin/lib/content-operations/reference.ts`) が読み、
 * rejected は「対象外 (採用を見送った)」、blocked は「停止中」として数える。記録が無いと、
 * 判断済みの指標がいつまでも「着手できる」に残り、未着手の件数が実態とずれる。
 *
 * - planned: 載せる企画を立てた (target に展開先の slug。テーマの企画表は 2026-10-10 に backlog の表からここへ移した)
 * - rejected: 展開先の読み手にとって載せる価値が無いと判断した (理由を必ず書く)
 * - blocked: 載せたいが、生成器や設定の不備・判断待ちで今は載せられない (解消したら行を消して載せる)
 *
 * 判断は展開先の担当 (県データブック = area-databook-designer、/japan = japan-catalog.ts の採用条件) が行い、
 * 判断の出どころは decidedBy に書く。採用したものはここに書かない (テンプレート・カタログ側が正本)。
 */
import placementDecisionsJson from "../../../../data/source-inventory/placement-decisions.json";

export type ReferencePlacementChannel =
  | "theme"
  | "area"
  | "japan"
  | "blog"
  | "note"
  | "youtube"
  | "instagram"
  | "x";

export interface ReferencePlacementDecision {
  channel: ReferencePlacementChannel;
  metricKey: string;
  status: "planned" | "rejected" | "blocked";
  reason: string;
  /** planned / blocked の企画で、載せる先 (テーマなら themeSlug) */
  target?: string;
  /** 管理画面の企画一覧に出す見出し (省略時は指標の key) */
  title?: string;
  decidedAt: string;
  decidedBy: string;
}

export const REFERENCE_PLACEMENT_DECISIONS: readonly ReferencePlacementDecision[] =
  placementDecisionsJson.decisions as readonly ReferencePlacementDecision[];
