"use client";

import { useState, useCallback, memo } from "react";
import { useStyles } from "@/hooks/useStyles";
import { Search, Loader2 } from "lucide-react";
import { InputField } from "@/components/atoms/InputField";

/**
 * EstatMetaInfoFetcherProps - e-Statメタ情報取得フォームのプロパティ
 */
interface EstatMetaInfoFetcherProps {
  /** 統計表IDが送信された時のコールバック関数 */
  onSubmit: (statsDataId: string) => void;
  /** API通信中のローディング状態 */
  loading?: boolean;
  /** 送信成功後に入力フィールドをクリアするかどうか（デフォルト: false） */
  clearOnSuccess?: boolean;
}

/**
 * EstatMetaInfoFetcher - e-Statメタ情報取得フォームコンポーネント
 *
 * 機能:
 * - 統計表IDの入力フォーム
 * - フォーム送信時のバリデーション
 * - ローディング状態の表示
 * - 送信成功後の入力クリア（オプション）
 *
 * レイアウト:
 * - レスポンシブデザイン（モバイル: 縦並び、デスクトップ: 横並び）
 * - 左側: アイコン + タイトル
 * - 右側: 入力フィールド + 送信ボタン
 *
 * 使用例:
 * ```tsx
 * <EstatMetaInfoFetcher
 *   onSubmit={(statsDataId) => handleFetchMetaInfo(statsDataId)}
 *   loading={isLoading}
 *   clearOnSuccess={true}
 * />
 * ```
 */
const EstatMetaInfoFetcher = memo(function EstatMetaInfoFetcher({
  onSubmit,
  loading,
  clearOnSuccess = false,
}: EstatMetaInfoFetcherProps) {
  // ===== 状態管理 =====

  /** 入力中の統計表ID */
  const [statsDataId, setStatsDataId] = useState<string>("");

  /** スタイルフック（テーマ対応） */
  const styles = useStyles();

  // ===== イベントハンドラー =====

  /**
   * フォーム送信時の処理
   * @param e - フォームイベント
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // 入力値の前後空白を除去してチェック
      if (statsDataId.trim()) {
        // 親コンポーネントに統計表IDを渡す
        onSubmit(statsDataId.trim());

        // オプション: 送信成功後に入力フィールドをクリア
        if (clearOnSuccess) {
          setStatsDataId("");
        }
      }
    },
    [statsDataId, onSubmit, clearOnSuccess]
  );

  /**
   * 入力値変更時の処理
   * @param e - 入力イベント
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStatsDataId(e.target.value);
    },
    []
  );

  /**
   * 統計表IDのバリデーション
   * @param value - 入力値
   * @returns バリデーション結果
   */
  const isValidStatsDataId = useCallback((value: string): boolean => {
    const trimmed = value.trim();
    // 基本的な統計表ID形式チェック（10桁の数字）
    return /^\d{10}$/.test(trimmed);
  }, []);

  /**
   * 送信可能かどうかの判定
   */
  const canSubmit =
    statsDataId.trim() && isValidStatsDataId(statsDataId) && !loading;

  // ===== レンダリング =====

  return (
    <form onSubmit={handleSubmit} className={styles.layout.row}>
      {/* メインレイアウト: レスポンシブ対応（モバイル: 縦並び、デスクトップ: 横並び） */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* 左側セクション: アイコン + タイトル */}
        <div className="flex items-center gap-2 md:flex-shrink-0">
          {/* 検索アイコン（視覚的なヒント） */}
          <Search className="w-5 h-5 text-indigo-600" />
          {/* セクションタイトル */}
          <h3 className="font-medium text-gray-900 dark:text-neutral-100">
            メタ情報取得
          </h3>
        </div>

        {/* 右側セクション: 入力フィールド + 送信ボタン */}
        <div className="flex flex-row gap-4 items-end flex-1">
          {/* 統計表ID入力フィールド */}
          <InputField
            name="statsDataId"
            label="例：0000010101"
            placeholder="統計表ID 例：0000010101"
            value={statsDataId}
            onChange={handleInputChange}
            disabled={loading}
            required
            inlineLabel
            width="max-w-xs"
            error={
              statsDataId.trim() && !isValidStatsDataId(statsDataId)
                ? "10桁の数字を入力してください"
                : undefined
            }
          />

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-10 whitespace-nowrap"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
                取得中...
              </div>
            ) : (
              "取得"
            )}
          </button>
        </div>
      </div>
    </form>
  );
});

EstatMetaInfoFetcher.displayName = "EstatMetaInfoFetcher";

export default EstatMetaInfoFetcher;
