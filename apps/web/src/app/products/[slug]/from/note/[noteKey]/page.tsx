import { notFound } from "next/navigation";

import {
  buildNoteProductDestination,
  findStorefrontProduct,
  isValidNoteKey,
} from "@/features/products";

import { getRequiredBaseUrl } from "@/lib/env";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";

import type { Metadata } from "next";

interface PageProps {
  readonly params: Promise<{ slug: string; noteKey: string }>;
}

const ROBOTS = { index: false, follow: true } as const;

/**
 * note の外部リンクカードは転送先ではなくこの URL 自身の OGP を見て
 * カードを生成する。noindex は維持しつつ、商品の title/description/image を
 * このページ自身に持たせないと、note にはサイト全体の汎用メタデータしか
 * 見えずカードが解決できない (2026-09-20: 対象記事全数でカードが空表示と判明)。
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, noteKey } = await params;
  const product = findStorefrontProduct(slug);
  if (!product || !isValidNoteKey(noteKey)) return { robots: ROBOTS };

  const title = `${product.title} | stats47`;
  const baseUrl = getRequiredBaseUrl();
  const url = `${baseUrl}/products/${product.slug}/from/note/${noteKey}`;

  return {
    title,
    description: product.description,
    robots: ROBOTS,
    ...generateOGMetadata({
      title,
      description: product.description,
      imageUrl: ogpImageUrl(ogpImageKeys.product(product.slug)),
      url,
    }),
  };
}

/**
 * note の外部リンクカード用 clean URL。
 * サーバー redirect() は 307 応答の本文にこのページの generateMetadata を乗せない
 * (リダイレクトを追わないクローラにはサイト全体の汎用メタデータしか見えず、
 * 2026-09-20 に note 側で対象記事全数のカードが空表示になっていたと判明)。
 * OGP をクロール可能な形で見せるため 200 でこのページ自体を描画し、
 * 実際の遷移は meta refresh に委譲する。
 */
export default async function NoteProductReferralPage({ params }: PageProps) {
  const { slug, noteKey } = await params;
  if (!findStorefrontProduct(slug) || !isValidNoteKey(noteKey)) notFound();

  const destination = buildNoteProductDestination(slug, noteKey);
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${destination}`} />
      <p>
        <a href={destination}>商品ページへ移動します</a>
      </p>
    </>
  );
}
