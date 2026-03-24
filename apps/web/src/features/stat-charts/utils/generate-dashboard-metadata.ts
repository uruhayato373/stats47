import { Metadata } from 'next';

export async function generateDashboardPageMetadata({
  category,
  areaCode,
}: {
  category: string;
  areaCode: string;
}): Promise<Metadata> {
  // TODO: カテゴリ名と地域名を取得
  // TODO: メタデータを生成
  return {
    title: `Dashboard for ${category} in ${areaCode}`,
  };
}
