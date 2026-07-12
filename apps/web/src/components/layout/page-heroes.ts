/**
 * ページ hero 画像の単一ソース (SSOT)。
 *
 * hero を持つページ (テーマ / カテゴリ) だけが HeroBanner を描画する。全ページ既定は PageHeader。
 * テーマとカテゴリは名前空間が別 (themeKey / categoryKey は衝突しうる) なので 2 マップに分けるが、
 * 型 (PageHeroDef) と画像アセット (HeroImageAsset) は共有する。1 枚の画像を複数ページで共有できる。
 *
 * 家ルール (OGP と同じ):
 * - 画像は文字なし (`apps/web/public/images/*.webp`)。見出し・タグラインは実 DOM テキストで重ねる
 *   (AI 画像に日本語を焼き込まない。dark mode でも text-foreground が効く)。
 * - タグラインの数値は当該ページに実在する指標を実データで検証したものだけ載せる
 *   (`.claude/rules/evidence-based-judgment.md`。出典は taglineFacts に記録)。
 * - 画像の再生成情報 (prompt / aspectRatio / regenerate) を必ず残す。プロンプトをチャットに埋もれさせない。
 *
 * カタログ (種別・生成方式・オーナー) の正典: `.claude/rules/ogp-image-standards.md` §page hero。
 */

/** hero 画像アセット (プロベナンス込み)。複数ページで参照共有できる。 */
export interface HeroImageAsset {
  /** 配信 webp (public 配下) */
  src: string;
  /** 元画像 (再生成の入力。外部 AI 生成 PNG) */
  sourceImage: string;
  /** 生成アスペクト比 */
  aspectRatio: string;
  /** 外部 AI 生成プロンプト (文字なし・左1/3余白。改善はこのプロンプトを直す) */
  prompt: string;
  /** sourceImage → src の webp 再生成コマンド (リポジトリ root から実行) */
  regenerate: string;
}

/** 1 ページ分の hero 定義 (画像参照 + そのページ用タグライン)。 */
export interface PageHeroDef {
  /** 参照する hero 画像 (共有可) */
  image: HeroImageAsset;
  /** 画像 alt (装飾なら空文字で decorative 扱い) */
  imageAlt?: string;
  /**
   * h1 直下のタグライン (ですます調・当該ページの実指標に即す)。
   * 省略時は消費側 (カテゴリページ) が getCategoryDescription にフォールバックする
   * (既存の検証済みカテゴリ説明を再利用し、新たな未検証数値を発明しない)。
   */
  tagline?: string;
  /** タグライン中の数値の出典 (evidence-based-judgment.md)。tagline を明示した場合のみ。 */
  taglineFacts?: string;
}

/** 地域経済 / 企業・家計・経済 で共有する hero 画像 (家計・消費・企業の主題)。 */
const LOCAL_ECONOMY_IMAGE: HeroImageAsset = {
  src: "/images/theme-local-economy-hero.webp",
  sourceImage: "docs/assets/theme-local-economy-hero.png",
  aspectRatio: "3:2 (1536×1024)",
  prompt:
    "Light, editorial, flat vector illustration for the hero banner of a Japanese prefectural-statistics website. " +
    "Theme: regional economic disparity across Japan's 47 prefectures — household savings, consumer spending, " +
    "business activity, and fiscal strength. Keep the LEFT THIRD as calm off-white negative space reserved for " +
    "headline text added later. On the right two-thirds, arrange soft abstract motifs — stacked coins, a household " +
    "budget notebook, a small shopping basket, and gentle bar shapes of clearly different heights suggesting a gap " +
    "between a tall top region and a short bottom region. Suggest the Japanese archipelago abstractly with soft " +
    "rounded regional blocks in gently varied indigo tones. Muted indigo and slate-blue palette with warm neutral " +
    "sand/beige accents on a very light off-white background. Center the subjects vertically with generous headroom " +
    "so the top and bottom can be safely cropped. Strictly no text, no letters, no numbers, no kanji, no logos, " +
    "no watermarks, no real human faces, no precise administrative map borders, no charts with real values.",
  regenerate:
    "node -e \"require('sharp')('docs/assets/theme-local-economy-hero.png').resize({width:1536,withoutEnlargement:true}).webp({quality:78}).toFile('apps/web/public/images/theme-local-economy-hero.webp')\"",
};

/** themeKey → hero 定義。hero を用意したテーマだけ登録する。 */
export const THEME_HEROES: Record<string, PageHeroDef> = {
  "local-economy": {
    image: LOCAL_ECONOMY_IMAGE,
    tagline:
      "財政力指数は1位・東京1.06、最下位・島根0.25（2022年度）。課税所得・県民所得・最低賃金・有効求人倍率まで、47都道府県の経済格差をデータで比較します。",
    taglineFacts:
      "財政力指数 東京1.06397 / 島根0.25373 = 2022年度 (R2 app/ranking/fiscal-strength-index-prefecture)",
  },
};

/**
 * category-hero-catalog.ts で生成したカテゴリ hero 画像 (category-<key>-hero.webp) を組み立てる。
 * プロンプト全文はカタログが決定的に持つため、ここでは参照 + 再生成コマンドだけ記録する
 * (SSOT 二重化を避ける)。
 */
function categoryHeroImage(categoryKey: string): HeroImageAsset {
  return {
    src: `/images/category-${categoryKey}-hero.webp`,
    sourceImage: `docs/assets/category-${categoryKey}-hero.png`,
    aspectRatio: "3:2 (1536×1024)",
    prompt: `apps/web/scripts/data/category-hero-catalog.ts → buildCategoryHeroPrompt("${categoryKey}")`,
    regenerate: `npx tsx apps/web/scripts/generate-category-heroes.ts --apply --only ${categoryKey} --force`,
  };
}

/**
 * categoryKey → hero 定義。hero を用意したカテゴリだけ登録する。
 * economy は theme:local-economy と画像を共有し独自の検証済みタグラインを持つ。
 * 他の 16 カテゴリは catalog 生成画像で、タグラインは省略 = getCategoryDescription を使う。
 */
export const CATEGORY_HEROES: Record<string, PageHeroDef> = {
  economy: {
    image: LOCAL_ECONOMY_IMAGE,
    tagline:
      "消費支出は1位・埼玉429万円、最下位・沖縄308万円（2024年）。家計消費・物価・企業活動まで、47都道府県の暮らしとお金の差をランキングとチャートで比較します。",
    taglineFacts:
      "消費支出総額 埼玉4,294,300円 / 沖縄3,075,694円 = 2024年 (R2 app/ranking/consumption-expenditure-total)",
  },
  landweather: { image: categoryHeroImage("landweather") },
  population: { image: categoryHeroImage("population") },
  laborwage: { image: categoryHeroImage("laborwage") },
  agriculture: { image: categoryHeroImage("agriculture") },
  miningindustry: { image: categoryHeroImage("miningindustry") },
  commercial: { image: categoryHeroImage("commercial") },
  construction: { image: categoryHeroImage("construction") },
  energy: { image: categoryHeroImage("energy") },
  tourism: { image: categoryHeroImage("tourism") },
  educationsports: { image: categoryHeroImage("educationsports") },
  administrativefinancial: { image: categoryHeroImage("administrativefinancial") },
  safetyenvironment: { image: categoryHeroImage("safetyenvironment") },
  socialsecurity: { image: categoryHeroImage("socialsecurity") },
  international: { image: categoryHeroImage("international") },
  infrastructure: { image: categoryHeroImage("infrastructure") },
  ict: { image: categoryHeroImage("ict") },
};
