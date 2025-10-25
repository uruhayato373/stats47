import { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

/**
 * 地域別ダッシュボードページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * 地域別ダッシュボードページのメタデータを生成
 * SEO対応のためのタイトルと説明を動的に生成
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;

  return {
    title: `${subcategory} 地域別ダッシュボード - ${category}`,
    description: `${category}の${subcategory}に関する地域別統計ダッシュボード`,
  };
}

/**
 * 地域別ダッシュボードページのメインコンポーネント
 *
 * 指定されたカテゴリとサブカテゴリの地域別統計データを表示するページです。
 * 現在は準備中状態で、将来的に地域選択機能とダッシュボード表示機能を実装予定です。
 *
 * @returns 地域別ダッシュボードページのJSX要素
 */
export default async function AreaPage() {
  return (
    <div className="space-y-6">
      {/* 地域選択カード */}
      <Card>
        <CardHeader>
          <CardTitle>地域選択</CardTitle>
          <CardDescription>表示したい地域を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              地域別ダッシュボード機能は準備中です
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
