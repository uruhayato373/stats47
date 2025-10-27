"use client";

import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { Prefecture } from "../types";

/**
 * AreaSelectorClient の Props
 */
interface AreaSelectorClientProps {
  /** 初期都道府県データ（サーバーサイドで取得済み） */
  initialPrefectures?: Prefecture[];
  /** 初期地域データ（サーバーサイドで取得済み） */
  initialRegions?: Record<string, string[]>;
  /** クラス名 */
  className?: string;
}

/**
 * 地域レベル（全国/都道府県）を選択するクライアントコンポーネント
 *
 * カード形式で全国と都道府県を表示し、クリックで即座にダッシュボードへ遷移します。
 */
export function AreaSelectorClient({
  initialPrefectures = [],
  className,
}: AreaSelectorClientProps) {
  const router = useRouter();
  const { category, subcategory } = useParams() as {
    category: string;
    subcategory: string;
  };

  const handleNationalClick = () => {
    router.push(`/${category}/${subcategory}/dashboard/00000`);
  };

  const handlePrefectureClick = (prefCode: string) => {
    router.push(`/${category}/${subcategory}/dashboard/${prefCode}`);
  };

  return (
    <div className={className}>
      {/* 全国カード */}
      <Card
        onClick={handleNationalClick}
        className="cursor-pointer hover:shadow-lg transition-shadow"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">全国データ</CardTitle>
          <CardDescription>日本全国の統計データを表示します</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            都道府県別の比較や地域ブロック別の分析が可能です
          </p>
        </CardContent>
      </Card>

      {/* 都道府県グリッド */}
      {initialPrefectures.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">都道府県</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {initialPrefectures.map((pref) => (
              <Card
                key={pref.prefCode}
                onClick={() => handlePrefectureClick(pref.prefCode)}
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium">{pref.prefName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
