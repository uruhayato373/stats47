"use client";

import { MetaInfoPageView } from "@/features/estat-api/meta-info/components/MetaInfoPageView";

import { useMetaInfoPage } from "@/hooks/estat-api/useMetaInfoPage";

/**
 * MetaInfoPage - e-Statメタ情報管理ページ
 *
 * 責務: カスタムフックとPresenterの接続のみ
 * - useMetaInfoPageフックの呼び出し
 * - MetaInfoPageViewコンポーネントのレンダリング
 */
export default function MetaInfoPage() {
  const metaInfoPage = useMetaInfoPage();

  return <MetaInfoPageView {...metaInfoPage} />;
}
