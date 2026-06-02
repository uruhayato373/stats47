import { BannerAd } from "@/features/ads";
import { resolveAffiliateBanners } from "@/features/ads/server";

interface ArticleAffiliateBannerProps {
  tagKeys: string[];
}

/**
 * 記事タグキーからカテゴリを判定し、DB からバナー広告を最大3つ表示。
 * PC: 3列並び / モバイル: 1つだけ表示。
 * バナー未登録のカテゴリの場合は何も表示しない。
 */
export async function ArticleAffiliateBanner({ tagKeys }: ArticleAffiliateBannerProps) {
  const banners = await resolveAffiliateBanners(tagKeys, 3);

  if (banners.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="rounded-none border border-border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center">
          {banners.map((banner, i) => (
            <div key={i} className={`flex justify-center ${i > 0 ? "hidden md:flex" : ""}`}>
              <BannerAd
                href={banner.href}
                imageUrl={banner.imageUrl}
                trackingPixelUrl={banner.trackingPixelUrl}
                width={banner.width}
                height={banner.height}
                label={banner.title}
                position="article-bottom"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
