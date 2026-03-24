"use client";

import { type Category } from "@stats47/category";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AdSenseAd, COMPARE_PAGE_SIDEBAR } from "@/lib/google-adsense";
import type { ComparisonRegion } from "../types";
import { ComparisonEmpty } from "./ComparisonEmpty";
import { type ChoroplethMapData, MunicipalityChoroplethSection } from "./MunicipalityChoroplethSection";
import { RegionSelector } from "./RegionSelector";

interface RegionComparisonClientProps {
  regions: [ComparisonRegion, ComparisonRegion] | null;
  categories: Category[];
  currentCategoryKey: string;
  selectedAreaCodes: string[];
  choroplethMapData?: ChoroplethMapData | null;
  children?: React.ReactNode;
}

/**
 * 地域間比較のメインクライアントコンポーネント
 */
export function RegionComparisonClient({
  regions,
  categories,
  currentCategoryKey,
  selectedAreaCodes,
  choroplethMapData,
  children,
}: RegionComparisonClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // 2地域ちょうど選択されているか確認
  const hasEnoughRegions = selectedAreaCodes.length === 2;

  const currentCategory = categories.find((c) => c.categoryKey === currentCategoryKey);

  const handleCategoryChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    startTransition(() => {
      router.push(`/compare/${key}?${params.toString()}`);
    });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-1">
          <h1 className="text-2xl font-bold">
            地域間比較
          </h1>
          <Select value={currentCategoryKey} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-10 w-40 rounded-lg border text-sm font-bold">
              <SelectValue>
                {currentCategory?.categoryName ?? "カテゴリ"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {categories.map((cat) => (
                <SelectItem key={cat.categoryKey} value={cat.categoryKey}>
                  {cat.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          2つの都道府県を選んで、カテゴリごとのデータを比較しましょう。
        </p>
      </div>

      {/* 地域選択セクション（モバイル: フル幅 / PC: フル幅） */}
      <section>
        <RegionSelector selectedAreaCodes={selectedAreaCodes} categoryKey={currentCategoryKey} startTransition={startTransition} />
      </section>

      {!hasEnoughRegions ? (
        <section className="py-4">
          <ComparisonEmpty />
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* メインコンテンツ */}
          <div className="space-y-6 relative">
            {isPending && (
              <div className="absolute inset-0 z-10 bg-background/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
              </div>
            )}

            {currentCategoryKey === "population" && regions && choroplethMapData && (
              <MunicipalityChoroplethSection regions={regions} mapData={choroplethMapData} />
            )}

            {children}
          </div>

          {/* PC版: 右サイドバー */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              {/* 選択中の地域 */}
              <Card>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    比較中
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  {regions?.map((region) => (
                    <div key={region.areaCode} className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: region.color }}
                      />
                      <span className="text-sm font-semibold">{region.areaName}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 広告 */}
              <Card>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    広告
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center px-4 pb-4 pt-0">
                  <AdSenseAd
                    format={COMPARE_PAGE_SIDEBAR.format}
                    slotId={COMPARE_PAGE_SIDEBAR.slotId}
                    showLabel={false}
                  />
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
