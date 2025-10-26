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
import { Municipality, MunicipalityType } from "../types";

/**
 * MunicipalitySelector の Props
 */
interface MunicipalitySelectorProps {
  /** 選択された都道府県コード */
  prefectureCode: string;
  /** 選択された市区町村コード */
  selectedMunicipalityCode?: string;
  /** 市区町村選択時のコールバック */
  onMunicipalitySelect: (municipality: Municipality) => void;
  /** クラス名 */
  className?: string;
}

/**
 * 都道府県内の市区町村を選択するコンポーネント
 *
 * 都道府県が選択された後に、その都道府県内の市区町村を
 * 検索・フィルタリングして選択できます。
 */
export function MunicipalitySelector({
  prefectureCode,
  selectedMunicipalityCode,
  onMunicipalitySelect,
  className,
}: MunicipalitySelectorProps) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MunicipalityType | "all">(
    "all"
  );

  // 都道府県が変更されたときに市区町村データを読み込み
  useEffect(() => {
    if (!prefectureCode) {
      setMunicipalities([]);
      return;
    }

    loadMunicipalities();
  }, [prefectureCode]);

  /**
   * 市区町村データを読み込み
   */
  const loadMunicipalities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listMunicipalitiesByPrefecture(prefectureCode);
      setMunicipalities(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタリングされた市区町村リスト
  const filteredMunicipalities = municipalities.filter((muni) => {
    const matchesSearch = muni.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || muni.type === selectedType;
    return matchesSearch && matchesType;
  });

  // 市区町村タイプ別の統計
  const typeStats = municipalities.reduce((acc, muni) => {
    acc[muni.type] = (acc[muni.type] || 0) + 1;
    return acc;
  }, {} as Record<MunicipalityType, number>);

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
  if (municipalities.length === 0) {
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
        {/* 検索とフィルタリング */}
        <div className="space-y-3">
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

          <div>
            <Label htmlFor="type-filter">市区町村タイプで絞り込み</Label>
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as MunicipalityType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  全て ({municipalities.length})
                </SelectItem>
                <SelectItem value="city">市 ({typeStats.city || 0})</SelectItem>
                <SelectItem value="ward">区 ({typeStats.ward || 0})</SelectItem>
                <SelectItem value="town">町 ({typeStats.town || 0})</SelectItem>
                <SelectItem value="village">
                  村 ({typeStats.village || 0})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 市区町村選択 */}
        <div>
          <Label htmlFor="municipality-select">市区町村を選択</Label>
          <Select
            value={selectedMunicipalityCode || ""}
            onValueChange={(value) => {
              const municipality = municipalities.find((m) => m.code === value);
              if (municipality) {
                onMunicipalitySelect(municipality);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="市区町村を選択してください" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {filteredMunicipalities.map((municipality) => (
                <SelectItem key={municipality.code} value={municipality.code}>
                  <div className="flex items-center gap-2">
                    <span>{municipality.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getTypeDisplayName(municipality.type)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 検索結果の表示 */}
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            「{searchQuery}」の検索結果: {filteredMunicipalities.length}件
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 市区町村タイプの表示名を取得
 */
function getTypeDisplayName(type: MunicipalityType): string {
  const typeNames: Record<MunicipalityType, string> = {
    city: "市",
    ward: "区",
    town: "町",
    village: "村",
  };
  return typeNames[type];
}
