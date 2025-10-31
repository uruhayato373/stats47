"use client";

import { Archive } from "lucide-react";

import { EstatMetaInfoFetcher } from "./EstatMetaInfoFetcher";
import { SavedMetaInfoList } from "./SavedMetaInfoList";

import type { EstatMetaInfo } from "../../types";

/**
 * EstatMetaInfoSidebar のプロパティ定義
 */
interface EstatMetaInfoSidebarProps {
  /** カスタムクラス名 */
  className?: string;
  /** 初期データ（保存済み統計表一覧） */
  initialData?: EstatMetaInfo[];
}

/**
 * EstatMetaInfoSidebar - e-Statメタ情報サイドバーコンポーネント
 *
 * 保存済み統計表一覧を表示するサイドバーのレイアウトを提供します。
 *
 * 機能:
 * - 検索フォームの表示
 * - ヘッダーの表示
 * - 保存済みメタ情報リストの表示（SavedMetaInfoListに委譲）
 *
 * @param className - カスタムクラス名
 * @param initialData - 初期データ（保存済み統計表一覧）
 */
export default function EstatMetaInfoSidebar({
  className = "",
  initialData = [],
}: EstatMetaInfoSidebarProps) {
  return (
    <div
      className={`w-full h-full flex flex-col bg-background ${className}`}
      style={{ minHeight: "400px" }}
    >
      {/* 検索フォーム */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <EstatMetaInfoFetcher />
      </div>

      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">保存済みデータ</h3>
        </div>
      </div>

      {/* データリスト（ページネーション含む） */}
      <SavedMetaInfoList initialData={initialData} />
    </div>
  );
}
