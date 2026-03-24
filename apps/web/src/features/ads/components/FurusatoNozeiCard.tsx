import { ExternalLink } from "lucide-react";
import { buildFurusatoNozeiUrl, getFurusatoNozeiLink } from "../constants/furusato-nozei";
import { searchFurusatoItems } from "../lib/rakuten-api";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

interface FurusatoNozeiCardProps {
  areaCode: string;
}

/**
 * 閲覧中の都道府県に対応する楽天ふるさと納税カード。
 *
 * - RAKUTEN_APP_ID が設定されている場合: API で人気返礼品を動的表示
 * - 未設定の場合: 従来のエリアページ固定リンクにフォールバック
 */
export async function FurusatoNozeiCard({ areaCode }: FurusatoNozeiCardProps) {
  const link = getFurusatoNozeiLink(areaCode);
  if (!link) return null;

  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  const areaPageUrl = buildFurusatoNozeiUrl(link.rakutenAreaSlug, affiliateId);

  // API で返礼品を取得（APIキー未設定時は空配列）
  const items = await searchFurusatoItems(link.prefName, 4);

  // API 結果がある場合: 動的カード
  if (items.length > 0) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground/70">PR</span>
          <TrackedAffiliateLink
            href={areaPageUrl}
            category="furusato"
            label={`${link.prefName}のふるさと納税一覧`}
            position="sidebar"
            className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5"
          >
            もっと見る
            <ExternalLink size={10} />
          </TrackedAffiliateLink>
        </div>

        <p className="text-sm font-bold text-foreground mb-3">
          {link.prefName}の人気返礼品
        </p>

        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const imageUrl =
              item.mediumImageUrls[0]?.imageUrl ??
              item.smallImageUrls[0]?.imageUrl;
            const linkUrl = item.affiliateUrl ?? item.itemUrl;

            return (
              <TrackedAffiliateLink
                key={item.itemUrl}
                href={linkUrl}
                category="furusato"
                label={item.itemName}
                position="sidebar-item"
                className="flex flex-col rounded-lg bg-white border border-red-50 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
              >
                {imageUrl && (
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={item.itemName}
                      className="object-contain w-full h-full"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-[11px] leading-tight line-clamp-2 text-foreground">
                    {item.itemName}
                  </p>
                  <p className="text-xs font-bold text-red-600 mt-1">
                    {item.itemPrice.toLocaleString("ja-JP")}円
                  </p>
                  {item.reviewCount > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      ★{item.reviewAverage} ({item.reviewCount})
                    </p>
                  )}
                </div>
              </TrackedAffiliateLink>
            );
          })}
        </div>
      </div>
    );
  }

  // フォールバック: 従来の固定リンク
  return (
    <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground/70">PR</span>
      </div>
      <TrackedAffiliateLink
        href={areaPageUrl}
        category="furusato"
        label={`${link.prefName}のふるさと納税`}
        position="sidebar"
        className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
      >
        <div>
          <p className="text-sm font-bold text-foreground">
            {link.prefName}のふるさと納税を探す
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            楽天ふるさと納税で{link.prefName}の返礼品をチェック
          </p>
        </div>
        <ExternalLink size={16} className="shrink-0 text-red-400" />
      </TrackedAffiliateLink>
    </div>
  );
}
