"use client";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import { Badge } from "@/components/atoms/ui/badge";
import { Label } from "@/components/atoms/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import { Skeleton } from "@/components/atoms/ui/skeleton";
import { AlertCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { listMunicipalitiesByPrefecture } from "../services/municipality-service";
import { City } from "../types";

/**
 * CitySelector の Props
 */
interface CitySelectorProps {
  /** 選択された都道府県コード */
  prefectureCode: string;
  /** 選択された市区町村コード */
  selectedCityCode?: string;
  /** 市区町村選択時のコールバック */
  onCitySelect: (city: City) => void;
  /** クラス名 */
  className?: string;
}

/**
 * 都道府県内の市区町村を選択するコンポーネント
 *
 * 都道府県が選択された後に、その都道府県内の市区町村を
 * 検索・フィルタリングして選択できます。
 */
export function CitySelector({
  prefectureCode,
  selectedCityCode,
  onCitySelect,
  className,
}: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 都道府県が変更されたときに市区町村データを読み込み
  useEffect(() => {
    if (!prefectureCode) {
      setCities([]);
      return;
    }

    loadCities();
  }, [prefectureCode]);

  /**
   * 市区町村データを読み込み
   */
  const loadCities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listMunicipalitiesByPrefecture(prefectureCode);
      setCities(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタリングされた市区町村リスト
  const filteredCities = cities.filter((city) => {
    const matchesSearch = city.cityName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // エラー状態の表示
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          市区町村データの読み込みに失敗しました: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-3/4" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // データが空の場合
  if (cities.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-center py-4">
          市区町村データが見つかりません
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* 検索 */}
        <div>
          <Label htmlFor="search">市区町村を検索</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="search"
              type="text"
              placeholder="市区町村名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        {/* 市区町村選択 */}
        <div>
          <Label htmlFor="municipality-select">市区町村を選択</Label>
          <Select
            value={selectedCityCode || ""}
            onValueChange={(value) => {
              const city = cities.find((c) => c.cityCode === value);
              if (city) {
                onCitySelect(city);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="市区町村を選択してください" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {filteredCities.map((city) => (
                <SelectItem key={city.cityCode} value={city.cityCode}>
                  <span>{city.cityName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 検索結果の表示 */}
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            「{searchQuery}」の検索結果: {filteredCities.length}件
          </div>
        )}
      </div>
    </div>
  );
}
