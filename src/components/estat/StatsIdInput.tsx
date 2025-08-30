"use client";

import { useState } from "react";
import { useStyles } from "@/hooks/useStyles";

interface StatsIdInputProps {
  onSubmit: (statsDataId: string) => void;
  loading?: boolean;
}

export default function StatsIdInput({ onSubmit, loading }: StatsIdInputProps) {
  const [statsDataId, setStatsDataId] = useState<string>("");
  const styles = useStyles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (statsDataId.trim()) {
      onSubmit(statsDataId.trim());
    }
  };

  return (
    <div className={styles.card.compact}>
      <h2 className={styles.heading.md}>統計表IDを入力</h2>

      <form onSubmit={handleSubmit} className={styles.layout.row}>
        <div>
          <label htmlFor="statsDataId" className={styles.label.base}>
            統計表ID
          </label>
          <div className={styles.layout.flex}>
            <input
              type="text"
              id="statsDataId"
              value={statsDataId}
              onChange={(e) => setStatsDataId(e.target.value)}
              placeholder="例: 0003448237"
              className={styles.input.base}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !statsDataId.trim()}
              className={styles.button.small}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  取得中...
                </div>
              ) : (
                "取得"
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg dark:bg-neutral-700 dark:border-neutral-600">
        <div className="flex items-start">
          <svg
            className="w-4 h-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
