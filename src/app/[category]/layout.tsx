import { listCategories } from "@/lib/taxonomy/category";
import { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { category } = await params;
  const categories = listCategories();
  const categoryData = categories.find((c) => c.id === category);

  return {
    title: categoryData?.name || "カテゴリ",
    description: `${categoryData?.name}に関する統計データ`,
  };
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
