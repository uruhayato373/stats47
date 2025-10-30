"use client";

import React from "react";

import { useRouter } from "next/navigation";

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

type AreaType = "national" | "prefecture" | "city";

// [追加] カテゴリ・サブカテゴリを必須propsとする
interface AreaNavigatorProps {
  category: string;
  subcategory: string;
}

export function AreaNavigator({ category, subcategory }: AreaNavigatorProps) {
  const router = useRouter();

  const [areaType, setAreaType] = React.useState<AreaType>("national");
  const [prefectures, setPrefectures] = React.useState<Prefecture[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);
  const [selectedPref, setSelectedPref] = React.useState<string>("");
  const [selectedCity, setSelectedCity] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

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
      } catch (e) {
        setError("地域データの読み込みに失敗しました");
      }
    };
    void load();
  }, []);

  const filteredCities = React.useMemo(() => {
    if (!selectedPref) return [] as City[];
    return cities.filter((c) => c.prefCode === selectedPref);
  }, [cities, selectedPref]);

  const canSubmit = React.useMemo(() => {
    if (areaType === "national") return true;
    if (areaType === "prefecture") return !!selectedPref;
    if (areaType === "city") return !!selectedPref && !!selectedCity;
    return false;
  }, [areaType, selectedPref, selectedCity]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const code =
        areaType === "national"
          ? "00000"
          : areaType === "prefecture"
          ? selectedPref
          : selectedCity;
      // ここで新パス仕様でpush
      router.push(`/stats/${category}/${subcategory}/dashboard/${code}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={areaType} onValueChange={(v) => setAreaType(v as AreaType)}>
        <TabsList>
          <TabsTrigger value="national">全国</TabsTrigger>
          <TabsTrigger value="prefecture">都道府県</TabsTrigger>
          <TabsTrigger value="city">市区町村</TabsTrigger>
        </TabsList>
      </Tabs>

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

      {areaType === "city" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="pref-select-city">都道府県</Label>
            <Select
              value={selectedPref}
              onValueChange={(v) => {
                setSelectedPref(v);
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

      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <div>
        <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? "遷移中..." : "ダッシュボードへ"}
        </Button>
      </div>
    </div>
  );
}
