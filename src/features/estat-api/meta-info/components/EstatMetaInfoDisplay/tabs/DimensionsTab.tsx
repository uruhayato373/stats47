import { Calendar, MapPin, Tag } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";

import { CategoryInfo, PrefectureInfo, TimeAxisInfo } from "../../../../types";

import AreasTab from "./AreasTab";
import CategoriesTab from "./CategoriesTab";
import TimeAxisTab from "./TimeAxisTab";

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
 * 次元タブコンポーネント
 *
 * 分類、地域、時間軸の情報をアコーディオンセクションとして縦に並べて表示します。
 * 各セクションは独立して展開/折りたたみが可能です。
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
  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-2">
        {/* 分類セクション */}
        <AccordionItem
          value="categories"
          className="border border-gray-200 rounded-lg dark:border-neutral-700"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center space-x-3">
              <Tag className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  分類
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {categories.length}個の分類
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CategoriesTab categories={categories} />
          </AccordionContent>
        </AccordionItem>

        {/* 地域セクション */}
        <AccordionItem
          value="areas"
          className="border border-gray-200 rounded-lg dark:border-neutral-700"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  地域
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {areas.length}個の地域
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <AreasTab areas={areas} />
          </AccordionContent>
        </AccordionItem>

        {/* 時間軸セクション */}
        <AccordionItem
          value="time"
          className="border border-gray-200 rounded-lg dark:border-neutral-700"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  時間軸
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {timeAxis.availableYears.length}個の年次
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <TimeAxisTab timeAxis={timeAxis} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

