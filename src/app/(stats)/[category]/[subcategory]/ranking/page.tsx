import { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;

  return {
    title: `${subcategory} ランキング - ${category}`,
    description: `${category}の${subcategory}に関する都道府県ランキング`,
  };
}

export default async function RankingPage({ params }: PageProps) {
  const { category, subcategory } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ランキング一覧
        </h2>
        <p className="text-muted-foreground">
          {category}の{subcategory}に関する都道府県ランキングを表示します
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ランキング項目</CardTitle>
          <CardDescription>
            利用可能なランキング項目を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">ランキング機能は準備中です</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
