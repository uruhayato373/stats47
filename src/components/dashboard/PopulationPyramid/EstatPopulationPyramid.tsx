/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as d3 from "d3";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  AlertCircle,
  Play,
  Pause,
  Download,
  Save,
} from "lucide-react";
import {
  EstatStatsDataFormatter,
  GetStatsDataParams,
  FormattedValue,
} from "@/lib/estat-api";

export interface EstatPopulationPyramidProps {
  /**
   * e-stat API パラメータ
   * statsDataId は必須
   */
  params: Omit<GetStatsDataParams, "appId">;

  /**
   * 都道府県コード（指定しない場合は全国データ "00000" を使用）
   */
  areaCode?: string;

  /**
   * 幅（ピクセル）
   */
  width?: number;

  /**
   * 高さ（ピクセル）
   */
  height?: number;

  /**
   * CSSクラス名
   */
  className?: string;

  /**
   * グラフタイトル
   */
  title?: string;

  /**
   * データ取得成功時のコールバック
   */
  onDataLoaded?: (data: FormattedValue[]) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

interface PyramidData {
  age: string;
  male: number;
  female: number;
}

/**
 * e-stat APIから年齢別人口データを取得して人口ピラミッドを表示するコンポーネント
 */
export const EstatPopulationPyramid: React.FC<EstatPopulationPyramidProps> = ({
  params,
  areaCode = "00000", // デフォルトは全国
  width: containerWidth,
  height: containerHeight = 400,
  className = "",
  title = "人口ピラミッド",
  onDataLoaded,
  onError,
}) => {
  const [data, setData] = useState<FormattedValue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playInterval, setPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          "[EstatPopulationPyramid] Fetching data with params:",
          params
        );

        // e-stat APIからデータを取得
        const response = await EstatStatsDataFormatter.getAndFormatStatsData(
          params.statsDataId,
          {
            limit: params.limit || 100000,
          }
        );

        console.log("[EstatPopulationPyramid] Data fetched:", {
          totalValues: response.values.length,
        });

        // 指定されたエリアコードのデータをフィルタリング
        const filteredValues = response.values.filter(
          (v) => v.areaCode === areaCode && v.numericValue !== null
        );

        console.log(
          "[EstatPopulationPyramid] Filtered values for area",
          areaCode,
          ":",
          filteredValues.length
        );

        if (filteredValues.length === 0) {
          throw new Error(
            `指定された地域（${areaCode}）のデータが見つかりませんでした`
          );
        }

        setData(filteredValues);

        if (onDataLoaded) {
          onDataLoaded(filteredValues);
        }
      } catch (err) {
        console.error("[EstatPopulationPyramid] Error fetching data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "データの取得に失敗しました";
        setError(errorMessage);

        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.statsDataId, params.limit, areaCode]);

  // 年齢区分のルックアップマップ（パフォーマンス最適化）
  const ageGroupMap = useMemo(() => {
    const map = new Map();

    // dataからcategoryCodeとcategoryNameを抽出してAGE_GROUPSを動的に作成
    const dynamicAgeGroups = data.reduce((groups: any[], item) => {
      const categoryCode = item.categoryCode;
      const categoryName = item.categoryName;

      // 既存のグループに追加されていない場合のみ追加
      if (!groups.find((group) => group.code === categoryCode)) {
        // 年齢区分名から年齢範囲と性別を抽出
        let ageRange = "";
        let gender = "";

        if (categoryName.includes("0～4歳")) ageRange = "0～4歳";
        else if (categoryName.includes("5～9歳")) ageRange = "5～9歳";
        else if (categoryName.includes("10～14歳")) ageRange = "10～14歳";
        else if (categoryName.includes("15～19歳")) ageRange = "15～19歳";
        else if (categoryName.includes("20～24歳")) ageRange = "20～24歳";
        else if (categoryName.includes("25～29歳")) ageRange = "25～29歳";
        else if (categoryName.includes("30～34歳")) ageRange = "30～34歳";
        else if (categoryName.includes("35～39歳")) ageRange = "35～39歳";
        else if (categoryName.includes("40～44歳")) ageRange = "40～44歳";
        else if (categoryName.includes("45～49歳")) ageRange = "45～49歳";
        else if (categoryName.includes("50～54歳")) ageRange = "50～54歳";
        else if (categoryName.includes("55～59歳")) ageRange = "55～59歳";
        else if (categoryName.includes("60～64歳")) ageRange = "60～64歳";
        else if (categoryName.includes("65～69歳")) ageRange = "65～69歳";
        else if (categoryName.includes("70～74歳")) ageRange = "70～74歳";
        else if (categoryName.includes("75～79歳")) ageRange = "75～79歳";
        else if (categoryName.includes("80～84歳")) ageRange = "80～84歳";
        else if (categoryName.includes("85～89歳")) ageRange = "85～89歳";
        else if (categoryName.includes("90～94歳")) ageRange = "90～94歳";
        else if (categoryName.includes("95～99歳")) ageRange = "95～99歳";
        else if (categoryName.includes("100歳以上")) ageRange = "100歳以上";

        if (categoryName.includes("（男）")) gender = "男";
        else if (categoryName.includes("（女）")) gender = "女";

        if (ageRange && gender) {
          groups.push({
            code: categoryCode,
            name: ageRange,
            gender: gender,
          });
        }
      }

      return groups;
    }, []);

    // 年齢順にソート
    const sortedGroups = dynamicAgeGroups.sort((a, b) => {
      const ageOrder = [
        "0～4歳",
        "5～9歳",
        "10～14歳",
        "15～19歳",
        "20～24歳",
        "25～29歳",
        "30～34歳",
        "35～39歳",
        "40～44歳",
        "45～49歳",
        "50～54歳",
        "55～59歳",
        "60～64歳",
        "65～69歳",
        "70～74歳",
        "75～79歳",
        "80～84歳",
        "85～89歳",
        "90～94歳",
        "95～99歳",
        "100歳以上",
      ];
      return ageOrder.indexOf(a.name) - ageOrder.indexOf(b.name);
    });

    // Mapに変換
    sortedGroups.forEach((group) => {
      map.set(group.code, group);
    });

    return map;
  }, [data]);

  // 年齢区分名の一覧（パフォーマンス最適化）
  const ageGroupNames = useMemo(() => {
    return [
      ...new Set(Array.from(ageGroupMap.values()).map((group) => group.name)),
    ];
  }, [ageGroupMap]);

  // 利用可能な年度を取得
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach((item) => {
      years.add(item.timeCode);
    });
    const result = Array.from(years).sort((a, b) => Number(a) - Number(b));
    return result;
  }, [data]);

  // ウィンドウのリサイズを監視
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // 初期値を設定
    setWindowWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 初期表示時に最新の年度を選択
  useEffect(() => {
    if (availableYears.length > 0 && selectedYearIndex === -1) {
      setSelectedYearIndex(availableYears.length - 1);
    }
  }, [availableYears, selectedYearIndex]);

  // 選択された年度
  const selectedYear = availableYears[selectedYearIndex] || "";

  // 再生ボタンクリック時の処理（最適化版）
  const handlePlayClick = useCallback(() => {
    if (!isPlaying) {
      setSelectedYearIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  // 再生・停止の制御
  useEffect(() => {
    if (isPlaying && availableYears.length > 1) {
      const interval = setInterval(() => {
        setSelectedYearIndex((prev) => {
          const next = prev + 1;
          if (next >= availableYears.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000);
      setPlayInterval(interval);
    } else if (playInterval) {
      clearInterval(playInterval);
      setPlayInterval(null);
    }

    // クリーンアップ関数
    return () => {
      if (playInterval) {
        clearInterval(playInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, availableYears.length]);

  // 選択された年度のデータを整形（最適化版）
  const chartData = useMemo(() => {
    if (!selectedYear) {
      return [];
    }

    const ageGroupData: { [key: string]: any } = {};

    // 事前に初期化
    ageGroupNames.forEach((name) => {
      ageGroupData[name] = {
        age: name,
        male: 0,
        female: 0,
      };
    });

    // フィルタリングされた年度データ
    const yearData = data.filter((item) => item.timeCode === selectedYear);

    // Mapを使用した高速ルックアップ
    yearData.forEach((item) => {
      const ageGroup = ageGroupMap.get(item.categoryCode);
      if (ageGroup) {
        if (ageGroup.gender === "男") {
          ageGroupData[ageGroup.name].male = item.numericValue || 0;
        } else {
          ageGroupData[ageGroup.name].female = item.numericValue || 0;
        }
      }
    });

    return ageGroupNames.map((name) => ageGroupData[name]).reverse();
  }, [data, selectedYear, ageGroupMap, ageGroupNames]);

  // データをlocalのjsonに保存する機能
  const handleSaveData = useCallback(() => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `population_pyramid_data_${timestamp}.json`;

      const dataToSave = {
        title,
        timestamp: new Date().toISOString(),
        data,
        chartData,
        selectedYear,
        ageGroupMap: Array.from(ageGroupMap.entries()),
        ageGroupNames,
      };

      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("データの保存に失敗しました:", error);
    }
  }, [title, data, chartData, selectedYear, ageGroupMap, ageGroupNames]);

  // D3.jsでチャートを描画
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return;

    // 既存のSVGをクリア
    d3.select(chartRef.current).selectAll("*").remove();

    // チャートの設定
    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const chartContainerWidth = chartRef.current.clientWidth;
    const width = Math.max(
      chartContainerWidth - margin.left - margin.right,
      200
    );
    const height = containerHeight - margin.top - margin.bottom;

    // 最大値を計算
    const maxValue = d3.max(chartData, (d) => Math.max(d.male, d.female)) || 0;
    const maxValueWithMargin = maxValue * 1.1;

    // SVGを作成
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", containerHeight)
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${containerHeight}`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // スケールを設定
    const xScale = d3
      .scaleLinear()
      .domain([-maxValueWithMargin, maxValueWithMargin])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.age))
      .range([0, height])
      .padding(0.1);

    // 色の設定
    const colors = {
      male: "#3b82f6",
      female: "#ec4899",
    };

    // 中央線を描画
    svg
      .append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    // ツールチップ用のdiv
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "pyramid-tooltip")
      .style("position", "absolute")
      .style("background", "#ffffff")
      .style("border", "1px solid #e5e7eb")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("color", "#374151")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

    const formatValue = (value: number) => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}百万人`;
      } else if (value >= 10000) {
        return `${(value / 10000).toFixed(1)}万人`;
      } else {
        return `${value.toLocaleString()}人`;
      }
    };

    // 男性のバーを描画
    svg
      .selectAll(".male-bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "male-bar")
      .attr("x", (d) => xScale(-d.male))
      .attr("y", (d) => yScale(d.age) || 0)
      .attr("width", (d) => xScale(0) - xScale(-d.male))
      .attr("height", yScale.bandwidth())
      .attr("fill", colors.male)
      .attr("rx", 2)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8);
        tooltip.style("opacity", 1).html(`
            <div><strong>${d.age}</strong></div>
            <div>男性: ${formatValue(d.male)}</div>
          `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 0);
      });

    // 女性のバーを描画
    svg
      .selectAll(".female-bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "female-bar")
      .attr("x", xScale(0))
      .attr("y", (d) => yScale(d.age) || 0)
      .attr("width", (d) => xScale(d.female) - xScale(0))
      .attr("height", yScale.bandwidth())
      .attr("fill", colors.female)
      .attr("rx", 2)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8);
        tooltip.style("opacity", 1).html(`
            <div><strong>${d.age}</strong></div>
            <div>女性: ${formatValue(d.female)}</div>
          `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 0);
      });

    // Y軸を描画
    svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale))
      .style("color", "#374151")
      .style("font-size", "10px");

    // X軸を描画（左側 - 男性）
    svg
      .append("g")
      .attr("class", "x-axis-left")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale.copy().domain([0, maxValueWithMargin]))
          .tickFormat(() => "")
      )
      .style("color", "#374151")
      .style("font-size", "10px");

    // X軸を描画（右側 - 女性）
    svg
      .append("g")
      .attr("class", "x-axis-right")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale.copy().domain([0, maxValueWithMargin]))
          .tickFormat(() => "")
      )
      .style("color", "#374151")
      .style("font-size", "10px");

    // 凡例を描画（チャート下部）
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width / 2 - 60}, ${height + 40})`);

    // 男性の凡例
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colors.male);

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("男性")
      .style("font-size", "12px")
      .style("fill", "#374151");

    // 女性の凡例
    legend
      .append("rect")
      .attr("x", 80)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colors.female);

    legend
      .append("text")
      .attr("x", 100)
      .attr("y", 12)
      .text("女性")
      .style("font-size", "12px")
      .style("fill", "#374151");

    // クリーンアップ
    return () => {
      tooltip.remove();
    };
  }, [chartData, windowWidth, containerHeight]);

  // CSVデータの生成（最適化版）
  const generateCSV = useCallback(() => {
    if (!selectedYear || chartData.length === 0) return "";

    const headers = ["年齢区分", "男性", "女性"];
    const csvContent = [headers.join(",")];

    chartData
      .slice()
      .reverse()
      .forEach((item) => {
        const row = [
          String(item.age || ""),
          Math.abs(Number(item.male) || 0).toString(),
          Number(item.female || 0).toString(),
        ];
        csvContent.push(row.join(","));
      });

    return csvContent.join("\n");
  }, [selectedYear, chartData]);

  // CSVダウンロード処理（最適化版）
  const handleDownloadCSV = useCallback(() => {
    const csvContent = generateCSV();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `人口ピラミッド_${selectedYear}年.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generateCSV, selectedYear]);

  // ローディング状態
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{
            width: containerWidth || "100%",
            height: containerHeight || "400px",
          }}
        >
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データを読み込み中...
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">
              e-stat APIからデータを取得しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
          style={{
            width: containerWidth || "100%",
            height: containerHeight || "400px",
          }}
        >
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データの取得に失敗しました
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
              {error}
            </p>
            <div className="text-xs text-gray-600 dark:text-neutral-400 mt-4">
              <p>統計表ID: {params.statsDataId}</p>
              <p>地域コード: {areaCode}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合
  if (chartData.length === 0 || availableYears.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{
            width: containerWidth || "100%",
            height: containerHeight || "400px",
          }}
        >
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データがありません
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">
              指定された条件に一致するデータが見つかりませんでした
            </p>
          </div>
        </div>
      </div>
    );
  }

  // グラフ表示
  return (
    <div
      className={`p-4 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex flex-row items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 mb-4">
        <h3 className="text-xl my-0 font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSaveData}
            className="p-2 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-700 dark:hover:bg-green-600 text-green-700 dark:text-green-200 focus:outline-none flex items-center justify-center"
            title="データをJSONとして保存"
          >
            <Save size={16} />
          </button>
          <button
            onClick={handleDownloadCSV}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 focus:outline-none flex items-center justify-center"
            title="CSVダウンロード"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="pt-0">
        <div className="relative">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <button
                className="p-2 rounded-full mr-3 focus:outline-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                onClick={handlePlayClick}
                aria-label={isPlaying ? "停止" : "再生"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <div className="relative flex-grow">
                <input
                  ref={sliderRef}
                  type="range"
                  min={0}
                  max={availableYears.length - 1}
                  value={selectedYearIndex}
                  onChange={(e) => {
                    setSelectedYearIndex(Number(e.target.value));
                    if (isPlaying) setIsPlaying(false);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />

                <div
                  className="absolute top-6 px-2 py-1 bg-gray-800 text-white text-xs rounded pointer-events-none whitespace-nowrap"
                  style={{
                    left: `calc(${
                      (selectedYearIndex / (availableYears.length - 1)) * 100
                    }% - 20px)`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {selectedYear}年
                </div>
              </div>
            </div>
          </div>

          <div
            className="w-full overflow-hidden"
            style={{ height: containerHeight }}
            ref={chartRef}
          ></div>

          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-left">
            出典:{" "}
            <a
              href="https://www.e-stat.go.jp/dbview?sid=0000010101"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              政府統計の総合窓口 e-Stat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
