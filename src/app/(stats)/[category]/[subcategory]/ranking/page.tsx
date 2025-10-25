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

export default async function RankingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ランキング項目を選択</CardTitle>
        <CardDescription>
          右側のサイドバーからランキング項目を選択して、詳細なランキングデータを表示してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            ランキング項目を選択すると、ここにランキングデータが表示されます
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
