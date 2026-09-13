import { ExternalLink } from "lucide-react";

import { getSurfaceCardClassName } from "@/components/surface";

import { buildFurusatoNozeiUrl, getFurusatoNozeiLink } from "../constants/furusato-nozei";
import { furusatoQualityReasons, selectQualityItems, type FurusatoContext } from "../lib/rakuten-item-quality";
import { readRakutenFurusatoFromR2 } from "../repositories/rakuten-snapshot";

import { AdImpressionTracker } from "./AdImpressionTracker";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

interface FurusatoNozeiCardProps {
  areaCode: string;
  position?: string;
  layout?: "sidebar" | "content";
  context?: FurusatoContext;
}

/**
 * 閲覧中の都道府県に対応する楽天ふるさと納税カード。
 *
 * 日次更新の返礼品 snapshot を表示し、在庫が無ければ県別一覧リンクへフォールバックする。
 */
export async function FurusatoNozeiCard({
  areaCode, position = "sidebar", layout = "sidebar", context,
}: FurusatoNozeiCardProps) {
  const link = getFurusatoNozeiLink(areaCode);
  if (!link) return null;

  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  if (!affiliateId) return null;
  const areaPageUrl = buildFurusatoNozeiUrl(link.rakutenAreaSlug, affiliateId);

  // ★ R2 snapshot を読む (実行時に楽天 API を叩かない)。日次 cron が焼く。
  //   絞り込み条件 (代表返礼品 → 0 件なら県名のみ) は取得側 sync-rakuten-catalog.ts が持つ。
  //   正典: repositories/rakuten-snapshot.ts
  // The blog placement contract is food culture; regional pages may still use local experience vouchers.
  const contentContext = context ?? (position === "blog-furusato-content" ? "food" : "regional");
  const items = selectQualityItems(await readRakutenFurusatoFromR2(link.prefCode),
    (item) => furusatoQualityReasons(item, link.prefName, { context: contentContext }));
  // 県別 CTR 計測用 ad_id (ad_id custom dimension 経由で県別のふるさと納税成果を追える)。
  const furusatoAdId = `furusato-${link.rakutenAreaSlug}`;

  // ★ 2026-08-04: impression 計装を追加 (それまでクリックのみ送信していた)。
  //    カード内の返礼品は 1 つの adId (県別) を共有するので **カード単位で 1 impression**。
  //    動的カードとフォールバックの両経路に付ける (片方だけだと県により欠測する)。

  // API 結果がある場合: 動的カード
  if (items.length > 0) {
    return (
      <AdImpressionTracker
        category="furusato"
        label={`${link.prefName}の人気返礼品`}
        position={position}
        adId={furusatoAdId}
      >
      <div className={getSurfaceCardClassName({ className: "p-4" })}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground/70">PR</span>
          <TrackedAffiliateLink
            href={areaPageUrl}
            category="furusato"
            adId={furusatoAdId}
            label={`${link.prefName}のふるさと納税一覧`}
            position={position}
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            もっと見る
            <ExternalLink size={10} />
          </TrackedAffiliateLink>
        </div>

        <p className="text-sm font-bold text-foreground mb-3">
          {link.prefName}の人気返礼品
        </p>

        <div className={layout === "content" ? "grid grid-cols-2 gap-3 sm:grid-cols-4" : "grid grid-cols-2 gap-2"}>
          {items.map((item) => {
            return (
              <TrackedAffiliateLink
                key={item.url}
                href={item.url}
                category="furusato"
                adId={furusatoAdId}
                label={item.name}
                position={position}
                className={getSurfaceCardClassName({
                  interactive: true,
                  className: "flex flex-col overflow-hidden p-0",
                })}
              >
                {item.image && (
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-contain w-full h-full"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-[11px] leading-tight line-clamp-2 text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs font-bold text-primary mt-1">
                    寄附額 {item.price.toLocaleString("ja-JP")}円
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
        <p className="mt-3 text-xs text-muted-foreground">寄附額・受付状況は楽天ふるさと納税でご確認ください。</p>
      </div>
      </AdImpressionTracker>
    );
  }

  // フォールバック: 従来の固定リンク
  return (
    <AdImpressionTracker
      category="furusato"
      label={`${link.prefName}のふるさと納税`}
      position={position}
      adId={furusatoAdId}
    >
    <div className={getSurfaceCardClassName({ className: "p-4" })}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground/70">PR</span>
      </div>
      <TrackedAffiliateLink
        href={areaPageUrl}
        category="furusato"
        adId={furusatoAdId}
        label={`${link.prefName}のふるさと納税`}
        position={position}
        className={getSurfaceCardClassName({
          interactive: true,
          className: "flex items-center justify-between gap-3 px-4 py-3",
        })}
      >
        <div>
          <p className="text-sm font-bold text-foreground">
            {link.prefName}のふるさと納税を探す
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            楽天ふるさと納税で{link.prefName}の返礼品をチェック
          </p>
        </div>
        <ExternalLink size={16} className="shrink-0 text-primary" />
      </TrackedAffiliateLink>
    </div>
    </AdImpressionTracker>
  );
}
