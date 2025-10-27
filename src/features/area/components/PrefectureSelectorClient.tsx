"use client";

import { useState } from "react";

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

import { REGIONS } from "../constants/region-mapping";
import { Prefecture, Region } from "../types";

/**
 * PrefectureSelectorClient の Props
 */
interface PrefectureSelectorClientProps {
  /** 初期都道府県データ（サーバーサイドで取得済み） */
  initialPrefectures: Prefecture[];
  /** 初期地域データ（サーバーサイドで取得済み） */
  initialRegions: Record<string, string[]>;
  /** 選択された都道府県コード */
  selectedPrefectureCode?: string;
  /** 都道府県選択時のコールバック */
  onPrefectureSelect: (prefecture: Prefecture) => void;
  /** クラス名 */
  className?: string;
}

/**
 * 地域ブロック別に都道府県を選択するコンポーネント（クライアント側）
 *
 * サーバーサイドで取得したデータを受け取り、インタラクティブな選択UIを提供します。
 * 地域ブロックごとにアコーディオンでグループ化し、
 * 各グループ内でラジオボタンで都道府県を選択できます。
 */
export function PrefectureSelectorClient({
  initialPrefectures,
  initialRegions,
  selectedPrefectureCode,
  onPrefectureSelect,
  className,
}: PrefectureSelectorClientProps) {
  // 初期データで初期化（useEffect不要）
  const [prefectures, setPrefectures] =
    useState<Prefecture[]>(initialPrefectures || []);
  const [regions, setRegions] = useState<Record<string, Region>>(() => {
    // 地域データを変換
    const regionMap: Record<string, Region> = {};
    // initialRegionsがundefinedまたはnullの場合は空オブジェクトとして扱う
    const regionsData = initialRegions || {};
    Object.entries(regionsData).forEach(([key, prefectureCodes]) => {
      const region = REGIONS.find((r) => r.regionCode === key);
      if (region) {
        regionMap[key] = {
          regionCode: region.regionCode,
          regionName: region.regionName,
          prefectures: prefectureCodes,
        };
      }
    });
    return regionMap;
  });

  // エラー状態（初期データがあるので通常はエラーなし）
  const [error] = useState<string | null>(null);

  // 地域ブロック別の都道府県を取得
  const getPrefecturesByRegion = (regionKey: string): Prefecture[] => {
    const region = regions[regionKey];
    if (!region) return [];

    return prefectures.filter((prefecture) =>
      region.prefectures.includes(prefecture.prefCode)
    );
  };

  // 地域ブロックリストを取得
  const getRegionList = (): Region[] => {
    return Object.values(regions);
  };

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
            const regionPrefectures = getPrefecturesByRegion(region.regionCode);

            if (regionPrefectures.length === 0) {
              return null;
            }

            return (
              <AccordionItem key={region.regionCode} value={region.regionCode}>
                <AccordionTrigger className="text-sm font-medium">
                  {region.regionName}
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
