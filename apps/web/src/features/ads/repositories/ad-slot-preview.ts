import {
  AFFILIATE_VERTICALS,
  type AffiliateVertical,
} from '../constants/affiliate-category';

import type { AffiliateAd } from '../types';

/**
 * 開発用の広告枠の表示 (2026-10-30)。`AD_SLOT_PREVIEW=1` で開発サーバーを起動すると (`npm run dev:web:ad-preview`)、
 * アフィリエイトの在庫を全ての意図軸 (vertical) で代わりの広告に置き換え、在庫が満ちたときの配置をローカルで確かめられる。
 *
 * 置き換えるのは在庫だけで、ページの意図の解決・広告を出さない決まり (null の写像・人口と医療は対象 key 必須)・
 * 枠の数の上限は本番と同じに通る。本番のビルド (NODE_ENV=production) では設定があっても働かない。
 * AdSense は環境変数 NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED が無い開発環境で、もともと台帳の箱の代わりの表示を描く。
 */
export function isAdSlotPreviewEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.AD_SLOT_PREVIEW === '1';
}

/** 1 つの意図軸に用意する代わりのバナーの数 (本文の PR の列 4 + 末尾 1 + 右レール 2 を超える数) */
const BANNERS_PER_VERTICAL = 8;
/** 1 つの意図軸に用意する代わりのテキスト広告の数 (場所ごと。本文の自動挿入は最大 4 本) */
const TEXTS_PER_LOCATION = 4;
const TEXT_LOCATIONS = ['sidebar-bottom', 'footer'] as const;

function previewBannerImage(vertical: AffiliateVertical, index: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250">` +
    `<rect x="1" y="1" width="298" height="248" fill="#f4f4f5" stroke="#71717a" stroke-width="2" stroke-dasharray="8 6"/>` +
    `<text x="150" y="112" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#3f3f46">PR の代わり 300×250</text>` +
    `<text x="150" y="142" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#71717a">${vertical} #${index + 1}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function previewAd(fields: Pick<AffiliateAd, 'id' | 'title' | 'htmlContent' | 'locationCode' | 'adType' | 'vertical' | 'priority'> &
  Partial<Pick<AffiliateAd, 'imageUrl' | 'width' | 'height'>>): AffiliateAd {
  return {
    areaCode: null,
    categoryKey: null,
    isActive: true,
    startDate: null,
    endDate: null,
    targetCategories: null,
    targetRankingKeys: null,
    imageUrl: null,
    trackingPixelUrl: null,
    width: null,
    height: null,
    createdAt: null,
    updatedAt: null,
    ...fields,
  };
}

/** 全ての意図軸に、代わりのバナー (300×250) とテキスト広告を用意する */
export function buildPreviewAffiliateAds(): AffiliateAd[] {
  return AFFILIATE_VERTICALS.flatMap((vertical) => [
    ...Array.from({ length: BANNERS_PER_VERTICAL }, (_, index) =>
      previewAd({
        id: `preview-${vertical}-banner-${index + 1}`,
        title: `PR の代わり (${vertical} #${index + 1})`,
        htmlContent: `#ad-slot-preview-${vertical}-banner-${index + 1}`,
        locationCode: 'blog-bottom',
        adType: 'banner',
        vertical,
        priority: 1000 - index,
        imageUrl: previewBannerImage(vertical, index),
        width: 300,
        height: 250,
      })
    ),
    ...TEXT_LOCATIONS.flatMap((locationCode) =>
      Array.from({ length: TEXTS_PER_LOCATION }, (_, index) =>
        previewAd({
          id: `preview-${vertical}-${locationCode}-text-${index + 1}`,
          title: `テキスト広告の代わり (${vertical} #${index + 1})`,
          htmlContent: `#ad-slot-preview-${vertical}-${locationCode}-text-${index + 1}`,
          locationCode,
          adType: 'text',
          vertical,
          priority: 1000 - index,
        })
      )
    ),
  ]);
}
