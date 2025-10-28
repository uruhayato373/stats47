"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ChevronDown } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/atoms/ui/dropdown-menu";

import { type Prefecture } from "@/features/area";

/**
 * BreadcrumbAreaDropdown の Props
 */
interface BreadcrumbAreaDropdownProps {
  /** 現在の地域コード */
  areaCode: string;
  /** カテゴリID */
  categoryId: string;
  /** サブカテゴリID */
  subcategoryId: string;
  /** ページタイプ */
  pageType: string;
}

/**
 * パンくずリスト内の地域選択ドロップダウンコンポーネント
 *
 * 現在の地域名を表示し、クリックするとドロップダウンメニューから
 * 全国または都道府県を選択して同じページタイプの該当地域に遷移します。
 */
export const BreadcrumbAreaDropdown = ({
  areaCode,
  categoryId,
  subcategoryId,
  pageType,
}: BreadcrumbAreaDropdownProps) => {
  const router = useRouter();
  const [areaName, setAreaName] = useState<string | null>(null);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);

  // 都道府県データと地域名の取得
  useEffect(() => {
    const loadData = async () => {
      // 00000は全国
      if (areaCode === "00000") {
        setAreaName("全国");
        if (pageType === "dashboard") {
          // 全国の場合も都道府県リストを取得（ドロップダウン用）
          try {
            const response = await fetch("/api/area/prefectures");
            if (response.ok) {
              const prefs = (await response.json()) as Prefecture[];
              setPrefectures(prefs);
            }
          } catch (error) {
            console.error("Failed to load prefectures:", error);
          }
        }
        return;
      }

      // 都道府県コード（末尾が000の5桁コード）
      if (areaCode.endsWith("000") && areaCode.length === 5) {
        try {
          const response = await fetch("/api/area/prefectures");
          if (response.ok) {
            const prefs = (await response.json()) as Prefecture[];
            setPrefectures(prefs);
            const pref = prefs.find((p) => p.prefCode === areaCode);
            setAreaName(pref?.prefName || null);
          } else {
            console.error(
              `Failed to load prefectures: ${response.status} ${response.statusText}`
            );
          }
        } catch (error) {
          console.error("Failed to load prefecture data:", error);
          setAreaName(null);
        }
        return;
      }

      // 市区町村コードの場合は後で対応
      setAreaName(null);
    };

    loadData();
  }, [areaCode, pageType]);

  // 地域選択のハンドラー
  const handleAreaSelect = (selectedAreaCode: string) => {
    const href = `/${categoryId}/${subcategoryId}/${pageType}/${selectedAreaCode}`;
    router.push(href);
  };

  // ドロップダウンUI
  if (areaName && prefectures.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 text-foreground font-medium hover:underline">
          {areaName}
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-[300px] overflow-y-auto"
        >
          <DropdownMenuItem onClick={() => handleAreaSelect("00000")}>
            全国
          </DropdownMenuItem>
          {prefectures.map((pref) => (
            <DropdownMenuItem
              key={pref.prefCode}
              onClick={() => handleAreaSelect(pref.prefCode)}
            >
              {pref.prefName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // データ未取得時の静的表示
  if (areaName) {
    return <span className="text-foreground font-medium">{areaName}</span>;
  }

  return null;
};

