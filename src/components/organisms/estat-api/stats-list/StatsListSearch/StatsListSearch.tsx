"use client";

import { useState, useEffect } from "react";
import { StatsListSearchOptions, StatsFieldCode } from "@/lib/estat-api";
import { STATS_FIELDS } from "@/lib/estat-api/types/stats-list";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";
import { Select } from "@/components/atoms/Select";
import { Button } from "@/components/atoms/Button";
import { LoadingButton } from "@/components/atoms/LoadingButton";
import {
  STATS_FIELD_OPTIONS,
  COLLECT_AREA_OPTIONS,
  LIMIT_OPTIONS,
} from "@/lib/estat-api/constants/search-options";

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
          <Select
            name="statsField"
            label="分野コード"
            options={STATS_FIELD_OPTIONS}
            value={statsField}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatsField(e.target.value)
            }
            size="md"
            rounded="md"
          />

          {/* 集計地域区分 */}
          <Select
            name="collectArea"
            label="集計地域区分"
            options={COLLECT_AREA_OPTIONS}
            value={collectArea}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCollectArea(e.target.value as "1" | "2" | "3" | "")
            }
            size="md"
            rounded="md"
          />

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
          <Select
            name="limit"
            label="取得件数"
            options={LIMIT_OPTIONS}
            value={limit.toString()}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setLimit(Number(e.target.value))
            }
            size="md"
            rounded="md"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-2 pt-4">
          <LoadingButton
            type="submit"
            loading={isLoading}
            loadingText="検索中..."
            variant="primary"
            size="md"
            rounded="md"
          >
            検索
          </LoadingButton>
          <Button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            variant="secondary"
            size="md"
            rounded="md"
          >
            リセット
          </Button>
        </div>
      </form>
    </div>
  );
}
