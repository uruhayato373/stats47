"use client";

import { AreaSelector } from "@/features/area";

/**
 * 地域選択ページのメインコンポーネント
 *
 * 地域選択機能のみを提供します。
 * 地域ごとのダッシュボードは area/[areaCode] で表示されます。
 *
 * @returns 地域選択ページのJSX要素
 */
export default function AreaPage() {
  return (
    <div className="space-y-6">
      {/* 地域選択コンポーネント */}
      <AreaSelector />
    </div>
  );
}
