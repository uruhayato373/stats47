import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Metadata } from "next";

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
    title: `${subcategory} 地域別ダッシュボード - ${category}`,
    description: `${category}の${subcategory}に関する地域別統計ダッシュボード`,
  };
}

export default async function AreaPage({ params }: PageProps) {
  const { category, subcategory } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          地域別ダッシュボード
        </h2>
        <p className="text-muted-foreground">
          {category}の{subcategory}に関する地域別統計データを表示します
        </p>
      </div>

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
