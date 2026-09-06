import { notFound, redirect } from "next/navigation";

import {
  buildNoteProductDestination,
  findStorefrontProduct,
  isValidNoteKey,
} from "@/features/products";

interface PageProps {
  readonly params: Promise<{ slug: string; noteKey: string }>;
}

/**
 * note の外部リンクカード用 clean URL。
 * カード取得時もクリック時も同じ決定的な UTM 付き商品詳細へ転送する。
 */
export default async function NoteProductReferralPage({ params }: PageProps) {
  const { slug, noteKey } = await params;
  if (!findStorefrontProduct(slug) || !isValidNoteKey(noteKey)) notFound();

  redirect(buildNoteProductDestination(slug, noteKey));
}
