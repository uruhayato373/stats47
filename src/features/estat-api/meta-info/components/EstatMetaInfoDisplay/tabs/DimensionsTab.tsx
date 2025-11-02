"use client";

import { useMemo, useState } from "react";

import { Calendar, Clock, MapPin, Tag, TrendingUp } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import { Badge } from "@/components/atoms/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/ui/table";

import type { parseCompleteMetaInfo } from "@/features/estat-api/meta-info/services/formatter";

type ParsedMetaInfo = ReturnType<typeof parseCompleteMetaInfo>;
type CategoryInfo = ParsedMetaInfo["dimensions"]["categories"][number];
type PrefectureInfo = ParsedMetaInfo["dimensions"]["areas"][number];
type TimeAxisInfo = ParsedMetaInfo["dimensions"]["timeAxis"];

/**
 * 次元タブのプロパティ
 */
interface DimensionsTabProps {
  /** 分類情報 */
  categories: CategoryInfo[];
  /** 地域情報 */
  areas: PrefectureInfo[];
  /** 時間軸情報 */
  timeAxis: TimeAxisInfo;
}

/**
 * 個別の分類アイテムコンポーネント（ページネーション付き）
 */
function CategoryAccordionItem({ category }: { category: CategoryInfo }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const itemCount = category.items.length;
  const totalPages = Math.ceil(itemCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = category.items.slice(startIndex, endIndex);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <AccordionItem
      value={category.id}
      className="border border-gray-200 rounded-lg dark:border-neutral-700"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center justify-between w-full mr-4">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {category.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ID: {category.id} • {itemCount}項目
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {itemCount}項目
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コード</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>単位</TableHead>
                  <TableHead>階層レベル</TableHead>
                  <TableHead>親コード</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map(
                  (item: CategoryInfo["items"][number], index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.unit || "-"}</TableCell>
                      <TableCell>{item.level || "-"}</TableCell>
                      <TableCell>{item.parentCode || "-"}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      aria-disabled={currentPage === 1}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <span className="text-sm text-muted-foreground px-4">
                      {currentPage} / {totalPages} ページ
                    </span>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages &&
                        setCurrentPage(currentPage + 1)
                      }
                      aria-disabled={currentPage === totalPages}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * 次元タブコンポーネント
 *
 * 分類、地域、時間軸の情報をh2見出しで区切られたセクションとして表示します。
 * 各セクション内では、分類と地域はアコーディオンで詳細を表示し、時間軸はカード形式で表示します。
 *
 * @param categories - 分類情報の配列
 * @param areas - 地域情報の配列
 * @param timeAxis - 時間軸情報
 */
export default function DimensionsTab({
  categories,
  areas,
  timeAxis,
}: DimensionsTabProps) {
  // 地域情報を階層レベルごとにグループ化
  const groupedAreas = useMemo(() => {
    const groups: Record<number, PrefectureInfo[]> = {};
    areas.forEach((area) => {
      if (!groups[area.level]) {
        groups[area.level] = [];
      }
      groups[area.level].push(area);
    });
    return groups;
  }, [areas]);

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return "全国";
      case 2:
        return "都道府県";
      case 3:
        return "市区町村";
      default:
        return `レベル${level}`;
    }
  };

  const getCodeType = (code: string) => {
    if (code === "00000") return "全国";
    if (code.endsWith("000")) return "都道府県";
    return "市区町村";
  };

  const sortedLevels = Object.keys(groupedAreas)
    .map(Number)
    .sort((a, b) => a - b);

  const defaultExpandedLevels = sortedLevels
    .filter((level) => level <= 2)
    .map(String);

  // 時間軸情報の処理
  const { availableYears, formattedYears, minYear, maxYear } = timeAxis;
  const sortedYears = [...availableYears].sort((a, b) => b.localeCompare(a));
  const sortedFormattedYears = [...formattedYears].sort((a, b) =>
    b.localeCompare(a)
  );
  const yearRange = minYear && maxYear ? `${minYear} - ${maxYear}` : "不明";
  const yearCount = availableYears.length;
  const latestYear = sortedYears[0];
  const oldestYear = sortedYears[sortedYears.length - 1];

  return (
    <div className="space-y-8">
      {/* 分類セクション */}
      <section className="space-y-4">
        <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          <Tag className="w-5 h-5 text-gray-500" />
          <span>分類</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({categories.length}個)
          </span>
        </h2>

        {categories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              分類情報がありません
            </div>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {categories.map((category) => (
              <CategoryAccordionItem key={category.id} category={category} />
            ))}
          </Accordion>
        )}
      </section>

      {/* 地域セクション */}
      <section className="space-y-4">
        <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          <MapPin className="w-5 h-5 text-gray-500" />
          <span>地域</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({areas.length}個)
          </span>
        </h2>

        {areas.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400">
              地域情報がありません
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {areas.length}個の地域が見つかりました
            </div>

            <Accordion
              type="multiple"
              defaultValue={defaultExpandedLevels}
              className="space-y-2"
            >
              {sortedLevels.map((level) => {
                const levelAreas = groupedAreas[level];
                const areaCount = levelAreas.length;

                return (
                  <AccordionItem
                    key={level}
                    value={String(level)}
                    className="border border-gray-200 rounded-lg dark:border-neutral-700"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {getLevelLabel(level)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              レベル {level} • {areaCount}地域
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {areaCount}地域
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>コード</TableHead>
                              <TableHead>名称</TableHead>
                              <TableHead>種別</TableHead>
                              <TableHead>親コード</TableHead>
                              <TableHead>単位</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {levelAreas.map((area, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono">
                                  {area.code}
                                </TableCell>
                                <TableCell>{area.name}</TableCell>
                                <TableCell>{getCodeType(area.code)}</TableCell>
                                <TableCell>{area.parentCode || "-"}</TableCell>
                                <TableCell>{area.unit || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </section>

      {/* 時間軸セクション */}
      <section className="space-y-4">
        <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span>時間軸</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({yearCount}個)
          </span>
        </h2>

        {availableYears.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400">
              時間軸情報がありません
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 統計情報セクション */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      利用可能年数
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {yearCount}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    年
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      最新年
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {latestYear || "-"}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300">
                    {sortedFormattedYears[0] || ""}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      最古年
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {oldestYear || "-"}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-300">
                    {sortedFormattedYears[sortedFormattedYears.length - 1] ||
                      ""}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 年次範囲情報 */}
            <Card>
              <CardHeader>
                <CardTitle>年次範囲</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      最小年
                    </div>
                    <div className="text-lg text-gray-900 dark:text-gray-100">
                      {minYear || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      最大年
                    </div>
                    <div className="text-lg text-gray-900 dark:text-gray-100">
                      {maxYear || "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 年次リスト */}
            <Card>
              <CardHeader>
                <CardTitle>利用可能な年次一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {sortedYears.map((year, index) => (
                    <div
                      key={year}
                      className={`p-3 rounded-lg border text-center ${
                        index === 0
                          ? "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100"
                          : "bg-gray-50 border-gray-200 text-gray-900 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-100"
                      }`}
                    >
                      <div className="text-sm font-mono">{year}</div>
                      {sortedFormattedYears[index] && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {sortedFormattedYears[index]}
                        </div>
                      )}
                      {index === 0 && (
                        <Badge variant="default" className="text-xs mt-1">
                          最新
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 年次統計 */}
            {availableYears.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>年次統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">
                        年次間隔
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
                        {availableYears.length > 1 ? "複数年" : "単年"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">
                        データ期間
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
                        {yearRange}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
