"use client";

import { useState } from "react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";

interface UseMetaInfoSaveOptions {
  timeout?: number;
}

interface SaveResult {
  success: boolean;
  message: string;
}

export function useMetaInfoSave(options: UseMetaInfoSaveOptions = {}) {
  const { timeout = 120000 } = options;
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);

  const save = async (metaInfo: EstatMetaInfoResponse): Promise<SaveResult> => {
    if (!metaInfo) {
      return { success: false, message: "メタ情報がありません" };
    }

    console.log("🔵 保存開始");
    setSaving(true);
    setSaveResult(null);

    // タイムアウト設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ タイムアウト発生（${timeout / 1000}秒）`);
      controller.abort();
    }, timeout);

    try {
      const statsDataId =
        metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

      if (!statsDataId) {
        throw new Error("統計表IDが見つかりません");
      }

      console.log("🔵 API呼び出し開始:", statsDataId);

      const response = await fetch("/api/estat/metainfo/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statsDataId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("🔵 API応答受信:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ APIエラー:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = (await response.json()) as { message?: string };
      console.log("✅ 保存成功:", result);

      const successResult = {
        success: true,
        message:
          result.message ||
          "メタ情報を正常に保存しました。画面を更新しています...",
      };

      setSaveResult(successResult);

      // 保存成功後、2秒後にページをリロードして最新データを表示
      setTimeout(() => {
        console.log("🔄 ページをリロードして最新データを表示");
        window.location.reload();
      }, 2000);

      return successResult;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("❌ 保存エラー:", err);

      let errorMessage = "保存に失敗しました";
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = `保存処理がタイムアウトしました（${
            timeout / 1000
          }秒）。APIサーバーが応答していない可能性があります。`;
        } else {
          errorMessage = err.message;
        }
      }

      const errorResult = {
        success: false,
        message: errorMessage,
      };

      setSaveResult(errorResult);
      return errorResult;
    } finally {
      console.log("🔵 保存処理終了");
      setSaving(false);
    }
  };

  const reset = () => {
    setSaveResult(null);
  };

  return { save, saving, saveResult, reset };
}
