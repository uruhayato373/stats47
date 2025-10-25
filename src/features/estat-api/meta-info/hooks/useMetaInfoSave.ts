"use client";

import { useState, useCallback, useRef, useEffect } from "react";

import { EstatMetaInfoResponse } from "@/lib/estat-api";

/**
 * メタ情報保存フックのオプション
 */
interface UseMetaInfoSaveOptions {
  /** タイムアウト時間（ミリ秒、デフォルト: 120秒） */
  timeout?: number;
}

/**
 * 保存結果の型定義
 */
interface SaveResult {
  /** 保存成功フラグ */
  success: boolean;
  /** 結果メッセージ */
  message: string;
}

/**
 * e-Statメタ情報保存カスタムフック
 *
 * 機能:
 * - e-Statメタ情報をサーバーに保存
 * - タイムアウト処理（デフォルト120秒）
 * - 保存状態の管理（ローディング、結果）
 * - エラーハンドリング
 * - 保存成功後の自動ページリロード
 *
 * @param options - フックのオプション設定
 * @returns 保存関数、状態、リセット関数
 *
 * @example
 * ```tsx
 * const { save, saving, saveResult, reset } = useMetaInfoSave();
 *
 * const handleSave = () => {
 *   if (metaInfo) {
 *     save(metaInfo);
 *   }
 * };
 * ```
 */
export function useMetaInfoSave(options: UseMetaInfoSaveOptions = {}) {
  const { timeout = 120000 } = options;

  // ===== 状態管理 =====
  /** 保存処理中のローディング状態 */
  const [saving, setSaving] = useState(false);
  /** 保存結果（成功/失敗とメッセージ） */
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);

  // ===== リファレンス管理 =====
  /** ページリロード用のタイマーを管理 */
  const reloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  /** タイムアウト用のタイマーを管理 */
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===== クリーンアップ =====
  /**
   * コンポーネントアンマウント時のクリーンアップ
   * 実行中のタイマーをすべてクリアしてメモリリークを防止
   */
  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  /**
   * メタ情報を保存する非同期関数（メモ化済み）
   *
   * 処理フロー:
   * 1. メタ情報の存在確認
   * 2. 統計表IDの抽出
   * 3. APIエンドポイントへのPOSTリクエスト
   * 4. タイムアウト処理
   * 5. レスポンスの検証
   * 6. 成功時のページリロード
   * 7. エラーハンドリング
   *
   * @param metaInfo - 保存するe-Statメタ情報レスポンス
   * @returns 保存結果（成功/失敗とメッセージ）
   */
  const save = useCallback(
    async (metaInfo: EstatMetaInfoResponse): Promise<SaveResult> => {
      // ===== 入力検証 =====
      if (!metaInfo) {
        return { success: false, message: "メタ情報がありません" };
      }

      console.log("🔵 保存開始");
      setSaving(true);
      setSaveResult(null);

      // ===== タイムアウト設定 =====
      const controller = new AbortController();
      timeoutRef.current = setTimeout(() => {
        console.log(`⏰ タイムアウト発生（${timeout / 1000}秒）`);
        controller.abort();
      }, timeout);

      try {
        // ===== 統計表IDの抽出 =====
        const statsDataId =
          metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

        if (!statsDataId) {
          throw new Error("統計表IDが見つかりません");
        }

        console.log("🔵 API呼び出し開始:", statsDataId);

        // ===== APIリクエスト =====
        const response = await fetch("/api/estat-api/meta-info/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ statsDataId }),
          signal: controller.signal,
        });

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        console.log("🔵 API応答受信:", response.status);

        // ===== レスポンス検証 =====
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ APIエラー:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = (await response.json()) as { message?: string };
        console.log("✅ 保存成功:", result);

        // ===== 成功結果の設定 =====
        const successResult = {
          success: true,
          message:
            result.message ||
            "メタ情報を正常に保存しました。画面を更新しています...",
        };

        setSaveResult(successResult);

        // ===== 自動ページリロード =====
        // 保存成功後、2秒後にページをリロードして最新データを表示
        // タイマーをrefで管理してクリーンアップ可能にする
        reloadTimerRef.current = setTimeout(() => {
          console.log("🔄 ページをリロードして最新データを表示");
          window.location.reload();
        }, 2000);

        return successResult;
      } catch (err) {
        // ===== エラーハンドリング =====
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
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
        // ===== クリーンアップ =====
        console.log("🔵 保存処理終了");
        setSaving(false);
      }
    },
    [timeout]
  );

  /**
   * 保存結果をリセットする関数（メモ化済み）
   * エラーメッセージや成功メッセージをクリアし、実行中のタイマーもクリアする
   */
  const reset = useCallback(() => {
    setSaveResult(null);
    if (reloadTimerRef.current) {
      clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ===== フックの戻り値 =====
  return {
    /** メタ情報保存関数 */
    save,
    /** 保存処理中のローディング状態 */
    saving,
    /** 保存結果（成功/失敗とメッセージ） */
    saveResult,
    /** 保存結果をリセットする関数 */
    reset,
  };
}
