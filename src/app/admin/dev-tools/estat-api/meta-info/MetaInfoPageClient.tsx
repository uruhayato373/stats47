"use client";

import { Database, FileText } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/ui/tabs";

import { EstatMetaInfoDisplay, EstatMetaInfoTable } from "@/features/estat-api/meta-info/components";
import type { MetaInfoSource } from "@/features/estat-api/meta-info";
import type { SavedEstatMetaInfo } from "@/features/estat-api/meta-info/types";
import type { EstatMetaInfoResponse } from "@/features/estat-api/meta-info/types";

/**
 * MetaInfoPageClientProps - e-Statメタ情報管理ページのクライアントコンポーネントのプロパティ
 */
interface MetaInfoPageClientProps {
  /** メタ情報データ */
  metaInfo: EstatMetaInfoResponse | null;
  /** 統計表ID */
  statsId: string | null;
  /** データ取得元（'r2': R2ストレージ, 'api': e-Stat API） */
  dataSource?: MetaInfoSource | null;
  /** エラーメッセージ */
  error?: string | null;
  /** 登録済みメタ情報の配列 */
  savedMetaInfoList: SavedEstatMetaInfo[];
}

/**
 * MetaInfoPageClient - e-Statメタ情報管理ページのクライアントコンポーネント
 *
 * 責務:
 * - タブ形式でメイン画面と登録済みデータを表示
 * - タブ1: メタ情報取得（EstatMetaInfoDisplay）
 * - タブ2: 登録済みデータ（EstatMetaInfoTable）
 */
export default function MetaInfoPageClient({
  metaInfo,
  statsId,
  dataSource,
  error,
  savedMetaInfoList,
}: MetaInfoPageClientProps) {
  return (
    <div className="h-full p-4">
      <Tabs defaultValue="meta-info" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="meta-info" className="gap-2">
            <FileText className="h-4 w-4" />
            メタ情報取得
          </TabsTrigger>
          <TabsTrigger value="saved-data" className="gap-2">
            <Database className="h-4 w-4" />
            登録済みデータ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta-info" className="mt-4">
          <EstatMetaInfoDisplay
            metaInfo={metaInfo}
            statsId={statsId}
            dataSource={dataSource}
            error={error}
          />
        </TabsContent>

        <TabsContent value="saved-data" className="mt-4">
          <EstatMetaInfoTable data={savedMetaInfoList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

