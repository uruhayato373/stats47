import type { AffiliateDirectPlacement } from "../src/features/ads/types";

/**
 * 直接属性方式 (direct-attribute) アフィリエイト配置の SSOT (git TS)。
 *
 * 記事本文に `<affiliate-banner>` (blog) / 生 HTML (note) を直書きする配置の台帳。
 * タグベース自動配置 (AFFILIATE_ADS → R2 app/affiliate-ads/all.json) とは別系統で、
 * **アプリ・R2 配信はこのファイルを読まない** (広告の実体は各記事本文に埋まっている)。
 * 台帳の役割は監査: 孤立配置 (記事削除・タグ欠落)・PR 表記漏れ・リンク不一致の検出。
 *
 * 監査: npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --live
 * 規約: .claude/rules/affiliate-ads-standards.md / skill: /audit-affiliate-compliance
 * 旧台帳: docs/40_アフィリエイト管理/banners/*.md (2026-07-15 に本ファイルへ移行)
 */
export const AFFILIATE_DIRECT_PLACEMENTS: AffiliateDirectPlacement[] = [
  {
    id: "moshimo-ai-onikanri-93995",
    asp: "moshimo",
    title: "AI鬼管理｜Claude Code活用の業務自動化トレーニング",
    href: "https://af.moshimo.com/af/c/click?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995",
    imageUrl: "https://image.moshimo.com/af-img/7302/000000093995.png",
    trackingPixelUrl:
      "https://i.moshimo.com/af/i/impression?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995",
    width: 500,
    height: 500,
    rewardNote: "¥15,000/件",
    conversionCondition: "公式 LINE 登録または無料診断 (オンライン面談) の予約完了",
    // タグベース自動配置はしない方針 (learning カテゴリを増やさない)。文脈が完全一致する
    // メイキング系記事にのみ手動配置する。note はカスタム要素未対応のため生 HTML を貼る。
    placements: [
      {
        channel: "blog",
        slug: "koumuin-claude-code-estat-automation",
        position: "業務効率化トレーニング紹介 (※PR 直後のインライン)",
      },
      {
        channel: "note",
        slug: "koumuin-shigoto-kouritsuka-ai",
        position: "記事末尾 (生 HTML: リンク + img + impression pixel)",
      },
    ],
    addedAt: "2026-05-16",
    isActive: true,
  },
  {
    id: "a8-strategy-career-koumuin-ai-tenshoku-260601701360",
    asp: "a8",
    title: "STRATEGY CAREER｜エンジニア転職",
    href: "https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5ZEMP",
    imageUrl:
      "https://www24.a8.net/svt/bgt?aid=260601701360&wid=001&eno=01&mid=s00000026573001005000&mc=1",
    trackingPixelUrl: "https://www18.a8.net/0.gif?a8mat=4B5LK5+5YC2K2+5P1E+5ZEMP",
    width: 320,
    height: 100,
    rewardNote: null, // A8 管理画面参照
    conversionCondition: null, // A8 管理画面参照
    // タグベース自動配置 (af_strategy_career_* / labor vertical) と同一案件だが、
    // 体験記の文脈に合わせ本文中にもピンポイント配置している (末尾集約はしない)。
    placements: [
      {
        channel: "blog",
        slug: "koumuin-ai-tenshoku-1500man",
        position: "「転職を決めた」セクション直下のインライン",
      },
      {
        // 旧 Markdown 台帳 (docs/40) に未記載だった配置。2026-07-15 の compliance 監査
        // (--scan-all-blog) で検出し台帳へ反映。PR 表記漏れは監査 state が追跡する。
        channel: "blog",
        slug: "prefecture-salary-gap-career",
        position: "エージェント相談の文脈 (エンジニア特化型の段落直下)",
      },
    ],
    addedAt: "2026-06-04",
    isActive: true,
  },
];
