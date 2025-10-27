"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/atoms/ui/select";

import { StatsFieldCode, StatsListSearchOptions } from "@/features/estat-api";
import {
    COLLECT_AREA_OPTIONS,
    LIMIT_OPTIONS,
    STATS_FIELD_OPTIONS,
} from "@/features/estat-api/core/constants/search-options";
import { STATS_FIELDS } from "../../../types";

interface StatsListSearchProps {
  onSearch: (options: StatsListSearchOptions) => void;
  isLoading?: boolean;
  selectedField?: StatsFieldCode;
}

export function StatsListSearch({
  onSearch,
  isLoading = false,
  selectedField,
}: StatsListSearchProps) {
  const [searchWord, setSearchWord] = useState("");
  const [statsCode, setStatsCode] = useState("");
  const [statsField, setStatsField] = useState("");
  const [collectArea, setCollectArea] = useState<"1" | "2" | "3" | "">("");
  const [surveyYears, setSurveyYears] = useState("");
  const [limit, setLimit] = useState(100);

  // サイドバーで選択された分野を反映
  useEffect(() => {
    if (selectedField) {
      setStatsField(selectedField);
    }
  }, [selectedField]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options: StatsListSearchOptions = {
      ...(searchWord && { searchWord }),
      ...(statsCode && { statsCode }),
      ...(statsField && { statsField }),
      ...(collectArea && { collectArea }),
      ...(surveyYears && { surveyYears }),
      limit,
    };

    console.log("🔵 Component: 検索オプション", options);
    onSearch(options);
  };

  const handleReset = () => {
    setSearchWord("");
    setStatsCode("");
    setStatsField("");
    setCollectArea("");
    setSurveyYears("");
    setLimit(100);
  };

  // 選択された分野の名前を取得
  const selectedFieldName = selectedField
    ? STATS_FIELDS[selectedField]?.name
    : null;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">統計表検索</h2>
        {selectedFieldName && (
          <div className="text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-md">
            選択中の分野:{" "}
            <span className="font-medium">{selectedFieldName}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* キーワード検索 */}
          <div className="space-y-2">
            <Label htmlFor="searchWord">キーワード</Label>
            <Input
              id="searchWord"
              name="searchWord"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="例: 人口、就業構造"
              className="rounded-md"
            />
          </div>

          {/* 政府統計コード */}
          <div className="space-y-2">
            <Label htmlFor="statsCode">政府統計コード</Label>
            <Input
              id="statsCode"
              name="statsCode"
              value={statsCode}
              onChange={(e) => setStatsCode(e.target.value)}
              placeholder="例: 00200522"
              className="rounded-md"
            />
          </div>

          {/* 分野コード */}
          <div className="space-y-2">
            <Label htmlFor="statsField">分野コード</Label>
            <Select value={statsField} onValueChange={setStatsField}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {STATS_FIELD_OPTIONS.filter(
                  (option) => option.value !== ""
                ).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 集計地域区分 */}
          <div className="space-y-2">
            <Label htmlFor="collectArea">集計地域区分</Label>
            <Select
              value={collectArea}
              onValueChange={(value) =>
                setCollectArea(value as "1" | "2" | "3" | "")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                {COLLECT_AREA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 調査年月 */}
          <div className="space-y-2">
            <Label htmlFor="surveyYears">調査年月</Label>
            <Input
              id="surveyYears"
              name="surveyYears"
              value={surveyYears}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSurveyYears(e.target.value)
              }
              placeholder="例: 202001-202312"
              className="rounded-md"
            />
          </div>

          {/* 取得件数 */}
          <div className="space-y-2">
            <Label htmlFor="limit">取得件数</Label>
            <Select
              value={limit.toString()}
              onValueChange={(value) => setLimit(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="100件" />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                検索中...
              </>
            ) : (
              "検索"
            )}
          </Button>
          <Button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            variant="secondary"
            size="default"
          >
            リセット
          </Button>
        </div>
      </form>
    </div>
  );
}
