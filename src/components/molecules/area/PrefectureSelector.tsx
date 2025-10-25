"use client";

import { useEffect } from "react";

import { AlertCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { Label } from "@/components/atoms/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/ui/radio-group";
import { Skeleton } from "@/components/atoms/ui/skeleton";

import { Prefecture } from "@/features/area/types";

import { useAreaSelection } from "@/hooks/area/useAreaSelection";

/**
 * PrefectureSelector の Props
 */
interface PrefectureSelectorProps {
  /** 選択された都道府県コード */
  selectedPrefectureCode?: string;
  /** 都道府県選択時のコールバック */
  onPrefectureSelect: (prefecture: Prefecture) => void;
  /** クラス名 */
  className?: string;
}

/**
 * 地域ブロック別に都道府県を選択するコンポーネント
 *
 * 地域ブロックごとにアコーディオンでグループ化し、
 * 各グループ内でラジオボタンで都道府県を選択できます。
 */
export function PrefectureSelector({
  selectedPrefectureCode,
  onPrefectureSelect,
  className,
}: PrefectureSelectorProps) {
  const {
    prefectures,
    regions,
    isLoading,
    error,
    loadPrefectureData,
    getPrefecturesByRegion,
    getRegionList,
    getRegionDisplayName,
  } = useAreaSelection();

  // コンポーネントマウント時に都道府県データを読み込み
  useEffect(() => {
    loadPrefectureData();
  }, [loadPrefectureData]);

  // エラー状態の表示
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          都道府県データの読み込みに失敗しました: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-1 pl-4">
                {Array.from({ length: 4 }).map((_, itemIndex) => (
                  <Skeleton key={itemIndex} className="h-6 w-3/4" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // データが空の場合
  if (prefectures.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-center py-4">
          都道府県データが見つかりません
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <RadioGroup
        value={selectedPrefectureCode || ""}
        onValueChange={(value) => {
          const prefecture = prefectures.find((p) => p.prefCode === value);
          if (prefecture) {
            onPrefectureSelect(prefecture);
          }
        }}
        className="space-y-2"
      >
        <Accordion type="multiple" className="w-full">
          {getRegionList().map((region) => {
            const regionPrefectures = getPrefecturesByRegion(region.key);

            if (regionPrefectures.length === 0) {
              return null;
            }

            return (
              <AccordionItem key={region.key} value={region.key}>
                <AccordionTrigger className="text-sm font-medium">
                  {region.name}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {regionPrefectures.map((prefecture) => (
                      <div
                        key={prefecture.prefCode}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={prefecture.prefCode}
                          id={prefecture.prefCode}
                        />
                        <Label
                          htmlFor={prefecture.prefCode}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {prefecture.prefName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </RadioGroup>
    </div>
  );
}
