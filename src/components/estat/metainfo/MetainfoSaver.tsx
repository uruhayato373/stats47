"use client";

import { useState } from "react";
import { useStyles } from "@/hooks/useStyles";
import Message from "@/components/common/Message";
import { EstatMetaCategoryData } from "@/lib/estat/types";

interface SaveResult {
  success: boolean;
  message: string;
  data: EstatMetaCategoryData[];
  savedCount: number;
  totalCount: number;
  environment: string;
  result: EstatMetaCategoryData[];
  error?: string;
}

export default function MetainfoSaver() {
  const [statsDataId, setStatsDataId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);

  const styles = useStyles();

  const handleSave = async () => {
    if (!statsDataId.trim()) {
      setError("統計表IDを入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setProgress({ current: 0, total: 0, status: "処理開始..." });

    try {
      // APIを呼び出してメタ情報を保存
      const response = await fetch("/api/estat/metainfo/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statsDataId: statsDataId.trim() }),
      });

      const result = (await response.json()) as SaveResult;

      if (!response.ok) {
        throw new Error(result.error || "保存に失敗しました");
      }

      if (result.success) {
        setMessage(result.message);
        setStatsDataId("");
        setProgress(null);

        // 保存されたデータの詳細をログに出力（開発用）
        if (result.data) {
          console.log("保存されたデータ:", result.data);
          console.log("保存環境:", result.environment);
          console.log("保存結果:", result.result);
        }
      } else {
        throw new Error(result.error || "保存に失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      console.error("保存エラー:", err);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout.section}>
      {/* 単一保存 */}
      <div className={styles.card.base}>
        <h4 className={styles.heading.lg}>統計表IDの保存</h4>
        <div className={styles.layout.row}>
          <div>
            <label htmlFor="statsDataId" className={styles.label.base}>
              統計表ID
            </label>
            <input
              type="text"
              id="statsDataId"
              value={statsDataId}
              onChange={(e) => setStatsDataId(e.target.value)}
              placeholder="例: 0003448237"
              className={styles.input.base}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !statsDataId.trim()}
            className={styles.button.primary}
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* 進捗表示 */}
      {progress && (
        <div className={styles.card.base}>
          <h4 className={styles.heading.md}>処理進捗</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-neutral-400">
                {progress.status}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                {progress.current} / {progress.total}
              </span>
            </div>
            {progress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-neutral-700">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (progress.current / progress.total) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            )}
            <div className="text-xs text-gray-600 dark:text-neutral-500">
              💡 大量データの場合は処理に時間がかかります。Cloudflare
              D1のAPI制限に配慮して、データを小さなチャンクに分けて処理しています。
            </div>
          </div>
        </div>
      )}

      {/* メッセージ表示 */}
      {message && <Message type="success" message={message} />}
      {error && (
        <div className="space-y-2">
          <Message type="error" message={error} />
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="font-medium">⚠️ 処理が停止されました</p>
            <p>エラーが連続して発生したため、処理を安全に停止しました。</p>
            <p className="mt-2 text-xs">
              • 環境変数の設定を確認してください
              <br />
              • Cloudflare D1のテーブルが存在するか確認してください
              <br />• ネットワーク接続を確認してください
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
