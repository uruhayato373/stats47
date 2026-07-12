/**
 * カテゴリ / テーマ page hero 画像の「生成プロンプトカタログ」(SSOT)。
 *
 * 全カテゴリで画風を統一する (ライト・編集的・フラット・藍色・文字なし・左1/3余白・3:2) ため、
 * 共通スタイル (CATEGORY_HERO_STYLE) + 共通構図/禁止 (CATEGORY_HERO_COMPOSITION) を固定し、
 * カテゴリごとに主題 (subject) だけ差し替える。記事ごとの自由入力プロンプトは持たせない
 * (blog-ogp-visual-catalog.ts と同じ方針)。
 *
 * 出力: `npx tsx apps/web/scripts/print-category-hero-prompts.ts [--category <key>|--all]`
 * 生成した画像 (Codex/Imagen 等) は `docs/assets/category-<key>-hero.png` に保存 → webp 化 →
 * `apps/web/src/components/layout/page-heroes.ts` (SSOT) に配線する。
 *
 * 正典: `.claude/rules/ogp-image-standards.md` §5.6 (ページ hero)
 */

/** 全カテゴリ共通の固定スタイル (主題フラグメントの前に置く)。 */
export const CATEGORY_HERO_STYLE =
  "Light, editorial, flat vector illustration for the hero banner of a Japanese prefectural-statistics website. " +
  "Muted indigo and slate-blue palette with warm neutral sand and beige accents on a very light off-white background. " +
  "Soft geometric shapes, gentle gradients, generous negative space, subtle paper grain. " +
  "Keep the LEFT THIRD as calm off-white negative space reserved for headline text added later. " +
  "Subject on the right two-thirds: ";

/** 全カテゴリ共通の固定構図 + 禁止事項 (主題フラグメントの後に置く)。 */
export const CATEGORY_HERO_COMPOSITION =
  ". Suggest the Japanese archipelago abstractly with soft rounded regional blocks in gently varied indigo tones. " +
  "Center the subjects vertically with generous headroom above and below so the top and bottom can be safely cropped " +
  "(aspect ratio 3:2, landscape 1536x1024). " +
  "Strictly no text, no letters, no numbers, no kanji, no words, no logos, no watermarks, no real human faces, " +
  "no precise administrative map borders, no charts with real values.";

export interface CategoryHeroSubject {
  /** 表示名 (categories.ts の categoryName。参照用) */
  name: string;
  /** 主題フラグメント (英語・文字なしの抽象モチーフ) */
  subject: string;
}

/**
 * categoryKey → 主題。categories.ts の 17 軸に対応。
 * economy は既存 (theme:local-economy と共有) だが、再生成の一貫性のためカタログに含める。
 */
export const CATEGORY_HERO_SUBJECTS: Record<string, CategoryHeroSubject> = {
  landweather: {
    name: "国土・気象",
    subject:
      "an abstract Japanese landscape with soft rounded mountains, a gentle coastline, and a calm sun with a few clouds, evoking terrain and climate",
  },
  population: {
    name: "人口・世帯",
    subject:
      "clusters of simple people silhouettes in groups of clearly different sizes with a few soft house shapes, evoking population density and households",
  },
  laborwage: {
    name: "労働・賃金",
    subject:
      "a simple office desk with a briefcase and an abstract pay envelope with subtle rising coins, evoking work and wages",
  },
  agriculture: {
    name: "農林水産業",
    subject:
      "terraced rice fields, a few soft crop and vegetable shapes, a small tree, and a little fishing boat, evoking agriculture, forestry and fishery",
  },
  miningindustry: {
    name: "鉱工業",
    subject:
      "a tidy factory silhouette with interlocking gears and a few abstract shipping crates, evoking manufacturing output",
  },
  commercial: {
    name: "商業・サービス業",
    subject:
      "a row of small abstract shopfronts with a shopping bag and a gentle service cafe cup, evoking retail and services",
  },
  economy: {
    name: "企業・家計・経済",
    subject:
      "stacked coins, a household budget notebook, a small shopping basket, and gentle bar shapes of clearly different heights, evoking household finances and economic gaps",
  },
  construction: {
    name: "住宅・土地・建設",
    subject:
      "a few simple houses of clearly different sizes on soft land plots with a gentle construction crane, evoking housing, land and building",
  },
  energy: {
    name: "エネルギー・水",
    subject:
      "abstract solar panels, a soft wind turbine, and a clean water droplet, evoking renewable energy and water supply",
  },
  tourism: {
    name: "運輸・観光",
    subject:
      "a gentle abstract airplane, a suitcase, and a soft torii-gate landmark silhouette with a subtle dotted route line, evoking travel and tourism",
  },
  educationsports: {
    name: "教育・文化・スポーツ",
    subject:
      "a graduation cap, an open book, and a soft ball motif beside a few people silhouettes, evoking education, culture and sport",
  },
  administrativefinancial: {
    name: "行財政",
    subject:
      "an abstract government building with soft columns beside gentle coin stacks and a document, evoking public administration and finance",
  },
  safetyenvironment: {
    name: "司法・安全・環境",
    subject:
      "a soft shield, a gentle green leaf, and a subtle balance-scale motif, evoking safety, justice and environment",
  },
  socialsecurity: {
    name: "社会保障・衛生",
    subject:
      "a soft medical cross and heart motif beside an elder and a caregiver silhouette, evoking healthcare, welfare and an aging society",
  },
  international: {
    name: "国際",
    subject:
      "an abstract globe with gentle curved connection lines and a small airplane, evoking internationalization and exchange",
  },
  infrastructure: {
    name: "社会基盤施設",
    subject:
      "an abstract bridge, a road, and a soft network of water pipes, evoking public infrastructure",
  },
  ict: {
    name: "情報通信・科学技術",
    subject:
      "abstract network nodes connected by soft lines with a gentle wifi signal and faint circuit traces, evoking digital connectivity and technology",
  },
};

/** categoryKey から完全な生成プロンプトを組み立てる (スタイル + 主題 + 構図/禁止)。 */
export function buildCategoryHeroPrompt(categoryKey: string): string {
  const entry = CATEGORY_HERO_SUBJECTS[categoryKey];
  if (!entry) {
    throw new Error(`unknown category hero key: ${categoryKey}`);
  }
  return CATEGORY_HERO_STYLE + entry.subject + CATEGORY_HERO_COMPOSITION;
}
