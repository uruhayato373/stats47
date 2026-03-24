import type { AffiliateCategory } from "./affiliate-category";

export interface BookRecommendation {
  title: string;
  author: string;
  description: string;
  /** Amazon 商品 URL（アソシエイトタグは buildAmazonUrl で付与） */
  amazonDp: string;
}

/** Amazon アソシエイトタグ付き URL を生成する */
export function buildAmazonUrl(dp: string): string {
  const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
  if (!tag) return dp;
  const separator = dp.includes("?") ? "&" : "?";
  return `${dp}${separator}tag=${tag}`;
}

/**
 * AffiliateCategory ごとの関連書籍推薦。
 * 全カテゴリに書籍がある必要はない（Partial）。
 * 増えたら DB 化を検討。
 */
export const CATEGORY_BOOKS: Partial<Record<AffiliateCategory, BookRecommendation>> = {
  furusato: {
    title: "ふるさと納税の理論と実践",
    author: "橋本 恭之",
    description: "ふるさと納税制度を学術的に解説。地方財政への影響を理解する一冊",
    amazonDp: "https://www.amazon.co.jp/dp/4641165882",
  },
  economy: {
    title: "統計学が最強の学問である",
    author: "西内 啓",
    description: "統計リテラシーを高めるベストセラー。データの見方が変わる",
    amazonDp: "https://www.amazon.co.jp/dp/4478022216",
  },
  population: {
    title: "未来の年表",
    author: "河合 雅司",
    description: "人口減少がもたらす日本の未来を具体的なデータで読み解く",
    amazonDp: "https://www.amazon.co.jp/dp/4062884313",
  },
  health: {
    title: "医療の経済学",
    author: "河口 洋行",
    description: "日本の医療制度と費用の構造をデータで分析する入門書",
    amazonDp: "https://www.amazon.co.jp/dp/4535559317",
  },
  housing: {
    title: "地方消滅",
    author: "増田 寛也",
    description: "消滅可能性都市のデータから見る地方の未来と移住の意味",
    amazonDp: "https://www.amazon.co.jp/dp/4121505654",
  },
};
