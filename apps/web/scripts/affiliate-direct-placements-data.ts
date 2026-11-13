import type { AffiliateDirectPlacement } from "../src/features/ads/types";
import data from "../../../data/affiliate/ledger/direct-placements.json";

/**
 * 直接属性方式 (direct-attribute) のアフィリエイト配置の読み込み口。記録の正本は台帳 `affiliate.direct-placements`
 * (data/affiliate/ledger/direct-placements.json + Schema) で、ここは型を付けて export するだけで、記録を持たない。
 * アプリ・R2 配信は読まない (広告の実体は各記事本文に埋まっている)。台帳の役割は監査。
 *
 * 監査: npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --live
 */
export const AFFILIATE_DIRECT_PLACEMENTS = data.placements as AffiliateDirectPlacement[];
