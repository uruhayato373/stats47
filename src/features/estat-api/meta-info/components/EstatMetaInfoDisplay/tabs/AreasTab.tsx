import { useMemo } from "react";

import { MapPin } from "lucide-react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/ui/table";

import { PrefectureInfo } from "../../../types";

interface AreasTabProps {
  areas: PrefectureInfo[];
}

/**
 * AreasTab - 地域情報表示タブ
 *
 * 機能:
 * - 地域情報を階層レベル（全国、都道府県、市区町村）に応じてグループ化
 * - 各レベルごとに展開可能なセクションで表示
 * - 地域コード、名称、階層レベル、親コードなどの情報を整理
 */
export default function AreasTab({ areas }: AreasTabProps) {
  // 階層レベルごとにグループ化
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

  // 階層レベルのラベル
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

  // 地域コードの形式を判定
  const getCodeType = (code: string) => {
    if (code === "00000") return "全国";
    if (code.endsWith("000")) return "都道府県";
    return "市区町村";
  };

  if (areas.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 dark:text-gray-400">
          地域情報がありません
        </div>
      </div>
    );
  }

  const sortedLevels = Object.keys(groupedAreas)
    .map(Number)
    .sort((a, b) => a - b);

  // デフォルトで展開するレベル（全国と都道府県）
  const defaultExpandedLevels = sortedLevels
    .filter((level) => level <= 2)
    .map(String);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                    <div className="flex items-center space-x-2">
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
  );
}
