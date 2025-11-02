"use client";

import { useMemo, useState } from "react";

import { Calendar, MapPin, Tag } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import { Badge } from "@/components/atoms/ui/badge";
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
      className="border rounded-lg border-border"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center justify-between w-full mr-4">
          <div className="font-medium text-foreground">{category.name}</div>
          <div className="text-sm text-muted-foreground">{itemCount}項目</div>
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

  // 時間軸情報の処理
  const { availableYears, formattedYears, minYear, maxYear } = timeAxis;
  const sortedYears = [...availableYears].sort((a, b) => b.localeCompare(a));
  const sortedFormattedYears = [...formattedYears].sort((a, b) =>
    b.localeCompare(a)
  );
  const yearRange = minYear && maxYear ? `${minYear} - ${maxYear}` : "不明";
  const yearCount = availableYears.length;

  return (
    <div className="space-y-8">
      {/* 分類セクション */}
      <section className="space-y-4">
        <h2 className="flex items-center space-x-2 text-xl font-semibold text-foreground">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <span>分類</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({categories.length}個)
          </span>
        </h2>

        {categories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">分類情報がありません</div>
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
        <h2 className="flex items-center space-x-2 text-xl font-semibold text-foreground">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <span>地域</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({areas.length}個)
          </span>
        </h2>

        {areas.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">地域情報がありません</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {areas.length}個の地域が見つかりました
            </div>

            <Accordion type="multiple" className="space-y-2">
              {sortedLevels.map((level) => {
                const levelAreas = groupedAreas[level];
                const areaCount = levelAreas.length;

                return (
                  <AccordionItem
                    key={level}
                    value={String(level)}
                    className="border rounded-lg border-border"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="font-medium text-foreground">
                          {getLevelLabel(level)}
                        </div>
                        <div className="text-sm text-muted-foreground">
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
        <h2 className="flex items-center space-x-2 text-xl font-semibold text-foreground">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span>時間軸</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({yearCount}個)
          </span>
        </h2>

        {availableYears.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">時間軸情報がありません</div>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem
              value="time-axis"
              className="border rounded-lg border-border"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="font-medium text-foreground">時間軸情報</div>
                  <div className="text-sm text-muted-foreground">
                    {yearCount}年
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>年次</TableHead>
                          <TableHead>フォーマット済み年次</TableHead>
                          <TableHead>状態</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedYears.map((year, index) => (
                          <TableRow key={year}>
                            <TableCell className="font-mono">{year}</TableCell>
                            <TableCell>
                              {sortedFormattedYears[index] || "-"}
                            </TableCell>
                            <TableCell>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">
                                  最新
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 年次統計 */}
                  {availableYears.length > 1 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
                        年次統計
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">
                            年次間隔
                          </div>
                          <div className="text-foreground">
                            {availableYears.length > 1 ? "複数年" : "単年"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            データ期間
                          </div>
                          <div className="text-foreground">{yearRange}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </section>
    </div>
  );
}
