"use client";

import { EstatMetaInfoResponse } from "@/lib/estat-api";

export function useMetaInfoDownload() {
  const download = async (metaInfo: EstatMetaInfoResponse): Promise<void> => {
    if (!metaInfo) {
      throw new Error("メタ情報がありません");
    }

    try {
      // 統計表IDを抽出
      const statsDataId =
        metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

      if (!statsDataId) {
        throw new Error("統計表IDが見つかりません");
      }

      // ファイル名を生成（統計表ID + 日時）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `estat-metainfo-${statsDataId}-${timestamp}.json`;

      // JSONデータを準備
      const jsonData = {
        statsDataId,
        downloadedAt: new Date().toISOString(),
        metaInfo: metaInfo,
      };

      // Blobを作成してダウンロード
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(
        "ダウンロードに失敗しました: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
      throw err;
    }
  };

  return { download };
}
