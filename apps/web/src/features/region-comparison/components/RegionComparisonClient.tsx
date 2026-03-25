"use client";

import { type Category } from "@stats47/category";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-1">
          <h1 className="text-lg font-bold">
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
      )}
    </div>
  );
}
