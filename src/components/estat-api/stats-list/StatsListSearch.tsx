"use client";

import { useState } from "react";
import { StatsListSearchOptions } from "@/lib/estat-api";

interface StatsListSearchProps {
  onSearch: (options: StatsListSearchOptions) => void;
  isLoading?: boolean;
}

export function StatsListSearch({
  onSearch,
  isLoading = false,
}: StatsListSearchProps) {
  const [searchWord, setSearchWord] = useState("");
  const [statsCode, setStatsCode] = useState("");
  const [fieldCode, setFieldCode] = useState("");
  const [collectArea, setCollectArea] = useState<"1" | "2" | "3" | "">("");
  const [surveyYears, setSurveyYears] = useState("");
  const [limit, setLimit] = useState(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options: StatsListSearchOptions = {
      ...(searchWord && { searchWord }),
      ...(statsCode && { statsCode }),
      ...(fieldCode && { fieldCode }),
      ...(collectArea && { collectArea }),
      ...(surveyYears && { surveyYears }),
      limit,
    };

    onSearch(options);
  };

  const handleReset = () => {
    setSearchWord("");
    setStatsCode("");
    setFieldCode("");
    setCollectArea("");
    setSurveyYears("");
    setLimit(100);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">統計表検索</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* キーワード検索 */}
          <div>
            <label
              htmlFor="searchWord"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              キーワード
            </label>
            <input
              type="text"
              id="searchWord"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="例: 人口、就業構造"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 政府統計コード */}
          <div>
            <label
              htmlFor="statsCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              政府統計コード
            </label>
            <input
              type="text"
              id="statsCode"
              value={statsCode}
              onChange={(e) => setStatsCode(e.target.value)}
              placeholder="例: 00200522"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 分野コード */}
          <div>
            <label
              htmlFor="fieldCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              分野コード
            </label>
            <select
              id="fieldCode"
              value={fieldCode}
              onChange={(e) => setFieldCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              <option value="01">国土・気象</option>
              <option value="02">人口・世帯</option>
              <option value="03">労働・賃金</option>
              <option value="04">事業所</option>
              <option value="05">農林水産業</option>
              <option value="06">鉱工業</option>
              <option value="07">商業・サービス業</option>
              <option value="08">企業・家計・経済</option>
              <option value="09">住宅・土地・建設</option>
              <option value="10">エネルギー・水</option>
              <option value="11">運輸・観光</option>
              <option value="12">情報通信・科学技術</option>
              <option value="13">教育・文化・スポーツ・生活</option>
              <option value="14">行財政</option>
              <option value="15">司法・安全・環境</option>
              <option value="16">社会保障・衛生</option>
              <option value="17">国際</option>
            </select>
          </div>

          {/* 集計地域区分 */}
          <div>
            <label
              htmlFor="collectArea"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              集計地域区分
            </label>
            <select
              id="collectArea"
              value={collectArea}
              onChange={(e) =>
                setCollectArea(e.target.value as "1" | "2" | "3" | "")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="1">全国</option>
              <option value="2">都道府県</option>
              <option value="3">市区町村</option>
            </select>
          </div>

          {/* 調査年月 */}
          <div>
            <label
              htmlFor="surveyYears"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              調査年月
            </label>
            <input
              type="text"
              id="surveyYears"
              value={surveyYears}
              onChange={(e) => setSurveyYears(e.target.value)}
              placeholder="例: 202001-202312"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 取得件数 */}
          <div>
            <label
              htmlFor="limit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              取得件数
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={50}>50件</option>
              <option value={100}>100件</option>
              <option value={500}>500件</option>
              <option value={1000}>1000件</option>
            </select>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "検索中..." : "検索"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            リセット
          </button>
        </div>
      </form>
    </div>
  );
}
