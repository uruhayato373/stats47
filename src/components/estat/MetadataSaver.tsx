"use client";

import { useState } from "react";
import { estatAPI } from "@/services/estat-api";
import { useStyles } from "@/hooks/useStyles";
import Message from "@/components/common/Message";

export default function MetadataSaver() {
  const [statsDataId, setStatsDataId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const styles = useStyles();

  const handleSave = async () => {
    if (!statsDataId.trim()) {
      setError("統計表IDを入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // ここでAPIを呼び出してメタ情報を保存
      // 実際の実装では、Cloudflare D1に保存する処理を追加
      setMessage(`${statsDataId}のメタ情報を保存しました`);
      setStatsDataId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
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

      {/* メッセージ表示 */}
      {message && <Message type="success" message={message} />}
      {error && <Message type="error" message={error} />}
    </div>
  );
}
