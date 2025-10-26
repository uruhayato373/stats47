"use client";

import { useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/atoms/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/ui/tabs";

import { AreaType, Municipality, Prefecture } from "../types";

import { MunicipalitySelector } from "./MunicipalitySelector";
import { PrefectureSelector } from "./PrefectureSelector";

/**
 * AreaSelector の Props
 */
interface AreaSelectorProps {
  /** クラス名 */
  className?: string;
}

/**
 * 地域レベル（全国/都道府県/市区町村）を切り替えるメインコンポーネント
 *
 * タブで地域レベルを切り替え、各レベルに応じた選択UIを提供します。
 * 選択時に自動的に/area/[areaCode]へ遷移します。
 */
export function AreaSelector({ className }: AreaSelectorProps) {
  const router = useRouter();
  const { category, subcategory } = useParams() as {
    category: string;
    subcategory: string;
  };
  const [selectedAreaType, setSelectedAreaType] = useState<AreaType>("country");
  const [selectedPrefectureCode, setSelectedPrefectureCode] =
    useState<string>();

  const handleAreaTypeChange = (areaType: AreaType) => {
    setSelectedAreaType(areaType);

    // 全国選択時は即座に遷移
    if (areaType === "country") {
      router.push(`/${category}/${subcategory}/area/00000`);
    }
  };

  const handlePrefectureSelect = (prefecture: Prefecture) => {
    setSelectedPrefectureCode(prefecture.prefCode);
    router.push(`/${category}/${subcategory}/area/${prefecture.prefCode}`);
  };

  const handleMunicipalitySelect = (municipality: Municipality) => {
    router.push(`/${category}/${subcategory}/area/${municipality.code}`);
  };

  return (
    <div className={className}>
      <Tabs
        value={selectedAreaType}
        onValueChange={(value) => handleAreaTypeChange(value as AreaType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="country" className="text-sm">
            全国
          </TabsTrigger>
          <TabsTrigger value="prefecture" className="text-sm">
            都道府県
          </TabsTrigger>
          <TabsTrigger value="municipality" className="text-sm">
            市区町村
          </TabsTrigger>
        </TabsList>

        {/* 全国タブ */}
        <TabsContent value="country" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                全国データ
                <Badge variant="secondary">選択中</Badge>
              </CardTitle>
              <CardDescription>
                全国の統計データを表示します。都道府県別の比較や地域ブロック別の分析が可能です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  全国データが選択されています
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  都道府県タブから特定の都道府県を選択することもできます
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 都道府県タブ */}
        <TabsContent value="prefecture" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>都道府県選択</CardTitle>
              <CardDescription>
                表示したい都道府県を地域ブロック別に選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrefectureSelector
                selectedPrefectureCode={selectedPrefectureCode}
                onPrefectureSelect={handlePrefectureSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 市区町村タブ */}
        <TabsContent value="municipality" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>市区町村選択</CardTitle>
              <CardDescription>
                市区町村別の統計データを表示します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPrefectureCode ? (
                <MunicipalitySelector
                  prefectureCode={selectedPrefectureCode}
                  selectedMunicipalityCode={undefined}
                  onMunicipalitySelect={handleMunicipalitySelect}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">
                    市区町村を選択するには、まず都道府県を選択してください
                  </p>
                  <p className="text-sm text-muted-foreground">
                    都道府県タブから都道府県を選択してから市区町村を選択できます
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
