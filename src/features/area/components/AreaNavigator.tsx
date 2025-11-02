/**
 * 地域選択ナビゲーターコンポーネント
 *
 * 全国・都道府県・市区町村を選択し、該当するダッシュボードへ遷移するためのコンポーネントです。
 * 選択された地域タイプに応じて、適切なセレクターを表示します。
 *
 * 機能:
 * - 地域タイプ（全国/都道府県/市区町村）の選択
 * - 都道府県・市区町村のセレクター表示
 * - 選択に応じたダッシュボードへの遷移
 */

"use client";

import React from "react";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";
import { Label } from "@/components/atoms/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/atoms/ui/tabs";

import {
  listCitiesAction,
  listPrefecturesAction,
} from "@/features/area/actions";
import type { City, Prefecture } from "@/features/area/types";

/** 地域タイプ: 全国、都道府県、市区町村 */
type AreaType = "national" | "prefecture" | "city";

/**
 * 地域選択ナビゲーターコンポーネント
 *
 * カテゴリ・サブカテゴリに基づいて、地域を選択し、ダッシュボードへ遷移します。
 *
 * @returns {JSX.Element} 地域選択UIを含むコンポーネント
 */
export function AreaNavigator() {
  // URLパラメータからカテゴリ・サブカテゴリを取得
  // Next.jsのuseParams()は文字列または文字列配列を返す可能性があるため、文字列に統一
  const params = useParams();
  const category =
    typeof params.category === "string"
      ? params.category
      : Array.isArray(params.category)
      ? params.category[0]
      : "";
  const subcategory =
    typeof params.subcategory === "string"
      ? params.subcategory
      : Array.isArray(params.subcategory)
      ? params.subcategory[0]
      : "";

  // React Hooks（全Hook先頭で呼び出し必須）
  const router = useRouter();

  /** 選択された地域タイプ */
  const [areaType, setAreaType] = React.useState<AreaType>("national");

  /** 都道府県一覧 */
  const [prefectures, setPrefectures] = React.useState<Prefecture[]>([]);

  /** 市区町村一覧 */
  const [cities, setCities] = React.useState<City[]>([]);

  /** 選択された都道府県コード */
  const [selectedPref, setSelectedPref] = React.useState<string>("");

  /** 選択された市区町村コード */
  const [selectedCity, setSelectedCity] = React.useState<string>("");

  /** 読み込み中フラグ */
  const [loading, setLoading] = React.useState<boolean>(false);

  /** エラーメッセージ */
  const [error, setError] = React.useState<string | null>(null);

  /**
   * 都道府県・市区町村データを取得する副作用
   * コンポーネントマウント時に一度だけ実行
   */
  React.useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [prefs, cts] = await Promise.all([
          listPrefecturesAction(),
          listCitiesAction(),
        ]);
        setPrefectures(prefs);
        setCities(cts);
      } catch {
        setError("地域データの読み込みに失敗しました");
      }
    };
    void load();
  }, []);

  /**
   * 選択された都道府県に属する市区町村をフィルタリング
   * 都道府県が選択されていない場合は空配列を返す
   */
  const filteredCities = React.useMemo(() => {
    if (!selectedPref) return [] as City[];
    return cities.filter((c) => c.prefCode === selectedPref);
  }, [cities, selectedPref]);

  /**
   * 送信ボタンの有効/無効を判定
   * 地域タイプに応じて必要な選択が完了しているかをチェック
   */
  const canSubmit = React.useMemo(() => {
    if (areaType === "national") return true;
    if (areaType === "prefecture") return !!selectedPref;
    if (areaType === "city") return !!selectedPref && !!selectedCity;
    return false;
  }, [areaType, selectedPref, selectedCity]);

  // カテゴリ・サブカテゴリが未取得の場合は早期リターン
  // 注意: この時点で全Hookは呼び出し済みである必要がある
  if (!category || !subcategory) {
    return <div>カテゴリ情報未指定</div>;
  }

  /**
   * ダッシュボードへの遷移処理
   * 選択された地域タイプに応じて適切なコードを使用してダッシュボードへ遷移します。
   */
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      // 地域タイプに応じたコードを決定
      // 全国: "00000", 都道府県: 都道府県コード, 市区町村: 市区町村コード
      const code =
        areaType === "national"
          ? "00000"
          : areaType === "prefecture"
          ? selectedPref
          : selectedCity;

      // ダッシュボードページへ遷移
      router.push(`/${category}/${subcategory}/dashboard/${code}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      {/* 地域タイプ選択タブ */}
      <Tabs value={areaType} onValueChange={(v) => setAreaType(v as AreaType)}>
        <TabsList>
          <TabsTrigger value="national">全国</TabsTrigger>
          <TabsTrigger value="prefecture">都道府県</TabsTrigger>
          <TabsTrigger value="city">市区町村</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 都道府県選択セレクター（都道府県タイプ選択時） */}
      {areaType === "prefecture" && (
        <div className="grid gap-2">
          <Label htmlFor="pref-select">都道府県</Label>
          <Select
            value={selectedPref}
            onValueChange={(v) => setSelectedPref(v)}
          >
            <SelectTrigger id="pref-select">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {prefectures.map((p) => (
                <SelectItem key={p.prefCode} value={p.prefCode}>
                  {p.prefName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 都道府県・市区町村選択セレクター（市区町村タイプ選択時） */}
      {areaType === "city" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 都道府県選択 */}
          <div className="grid gap-2">
            <Label htmlFor="pref-select-city">都道府県</Label>
            <Select
              value={selectedPref}
              onValueChange={(v) => {
                setSelectedPref(v);
                // 都道府県変更時は市区町村の選択をリセット
                setSelectedCity("");
              }}
            >
              <SelectTrigger id="pref-select-city">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {prefectures.map((p) => (
                  <SelectItem key={p.prefCode} value={p.prefCode}>
                    {p.prefName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 市区町村選択（都道府県選択後に有効化） */}
          <div className="grid gap-2">
            <Label htmlFor="city-select">市区町村</Label>
            <Select
              value={selectedCity}
              onValueChange={(v) => setSelectedCity(v)}
              disabled={!selectedPref}
            >
              <SelectTrigger id="city-select">
                <SelectValue
                  placeholder={
                    selectedPref ? "選択してください" : "先に都道府県を選択"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredCities.map((c) => (
                  <SelectItem key={c.cityCode} value={c.cityCode}>
                    {c.cityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* エラーメッセージ表示 */}
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* ダッシュボード遷移ボタン */}
      <div>
        <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? "遷移中..." : "ダッシュボードへ"}
        </Button>
      </div>
    </div>
  );
}
