"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";

import type { RankingMetadataTime } from "@/features/estat-api/ranking-mappings/types";

interface RankingYearSelectorProps {
  /** 年度情報配列 */
  times: RankingMetadataTime[];
  /** デフォルト値（最新年度の`timeCode`またはクエリパラメータ） */
  defaultValue?: string;
  /** 変更時のコールバック（オプション） */
  onChange?: (timeCode: string) => void;
}

/**
 * ランキング年度選択コンポーネント
 * セレクトボックスで年度を選択できる
 */
export function RankingYearSelector({
  times,
  defaultValue,
  onChange,
}: RankingYearSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 年度が空の場合は何も表示しない
  if (times.length === 0) {
    return null;
  }

  // 年度を降順ソート（最新が先頭）
  const sortedTimes = [...times].sort((a, b) => {
    const timeCodeA = parseInt(a.timeCode, 10);
    const timeCodeB = parseInt(b.timeCode, 10);
    return timeCodeB - timeCodeA;
  });

  // デフォルト値が指定されていない場合は最新年度を使用
  const defaultTimeCode = defaultValue || sortedTimes[0]?.timeCode;

  // 年度選択時のハンドラー
  const handleYearChange = (timeCode: string) => {
    // カスタムonChangeコールバックがある場合は実行
    if (onChange) {
      onChange(timeCode);
    }

    // URLを更新（クエリパラメータに年度を追加）
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", timeCode);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="year-select" className="text-sm font-medium">
        年度:
      </label>
      <Select
        defaultValue={defaultTimeCode}
        onValueChange={handleYearChange}
      >
        <SelectTrigger id="year-select" className="w-[180px]">
          <SelectValue placeholder="年度を選択" />
        </SelectTrigger>
        <SelectContent>
          {sortedTimes.map((time) => (
            <SelectItem key={time.timeCode} value={time.timeCode}>
              {time.timeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

