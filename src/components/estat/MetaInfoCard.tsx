"use client";

import { EstatMetaInfoResponse } from "@/types/estat";
import { useStyles } from "@/hooks/useStyles";

interface MetaInfoCardProps {
  metaInfo: EstatMetaInfoResponse | null;
  loading?: boolean;
  error?: string | null;
}

// 安全にレンダリングするためのヘルパー関数
function safeRender(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "object") {
    // オブジェクトの場合は、$プロパティがあればそれを表示
    if (value.$ && typeof value.$ === "string") {
      return value.$;
    }
    // @noプロパティがあればそれを表示
    if (value["@no"] && typeof value["@no"] === "string") {
      return value["@no"];
    }
    // その他の場合は、JSON.stringifyで表示
    return JSON.stringify(value);
  }
  return String(value);
}

export default function MetaInfoCard({
  metaInfo,
  loading,
  error,
}: MetaInfoCardProps) {
  const styles = useStyles();

  if (loading) {
    return (
      <div className={styles.card.compact}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.message.error}>
        <div className="flex items-center">
          <svg
            className="w-4 h-4 text-red-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-red-800 font-medium dark:text-red-400">エラー</h3>
        </div>
        <p className="text-red-700 mt-1 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!metaInfo) {
    return (
      <div className={styles.card.compact}>
        <p className={styles.text.muted}>メタ情報がありません</p>
      </div>
    );
  }

  const { GET_META_INFO } = metaInfo;
  const { TABLE_INF, CLASS_INF } = GET_META_INFO.METADATA_INF;

  return (
    <div className={styles.card.compact}>
      <div className="mb-4">
        <h2 className={styles.heading.md}>統計表基本情報</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <h3 className={styles.heading.sm}>統計表題名</h3>
            <p className={styles.text.body}>{safeRender(TABLE_INF.TITLE)}</p>
          </div>

          <div>
            <h3 className={styles.heading.sm}>政府統計名</h3>
            <p className={styles.text.body}>
              {safeRender(TABLE_INF.STAT_NAME)}
            </p>
          </div>

          <div>
            <h3 className={styles.heading.sm}>作成機関</h3>
            <p className={styles.text.body}>{safeRender(TABLE_INF.GOV_ORG)}</p>
          </div>

          <div>
            <h3 className={styles.heading.sm}>調査年月</h3>
            <p className={styles.text.body}>
              {safeRender(TABLE_INF.SURVEY_DATE)}
            </p>
          </div>

          <div>
            <h3 className={styles.heading.sm}>公開日</h3>
            <p className={styles.text.body}>
              {safeRender(TABLE_INF.OPEN_DATE)}
            </p>
          </div>

          <div>
            <h3 className={styles.heading.sm}>更新日</h3>
            <p className={styles.text.body}>
              {safeRender(TABLE_INF.UPDATED_DATE)}
            </p>
          </div>
        </div>

        {TABLE_INF.TITLE_SPEC && (
          <div className="mt-3">
            <h3 className={styles.heading.sm}>表題詳細</h3>
            <p className={styles.text.body}>
              {safeRender(TABLE_INF.TITLE_SPEC.TABLE_NAME)}
            </p>
            {TABLE_INF.TITLE_SPEC.TABLE_EXPLANATION && (
              <p className="text-sm text-gray-600 mt-1 dark:text-neutral-400">
                {safeRender(TABLE_INF.TITLE_SPEC.TABLE_EXPLANATION)}
              </p>
            )}
          </div>
        )}
      </div>

      {CLASS_INF && CLASS_INF.CLASS_OBJ && CLASS_INF.CLASS_OBJ.length > 0 && (
        <div>
          <h3 className={styles.heading.md}>分類情報</h3>

          <div className="space-y-3">
            {CLASS_INF.CLASS_OBJ.map((classObj, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-neutral-700 dark:border-neutral-600"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-2 dark:text-neutral-400">
                  {safeRender(classObj["@name"])}
                </h4>

                {classObj.CLASS && (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(classObj.CLASS) ? (
                      classObj.CLASS.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="bg-white border border-gray-200 rounded p-2 dark:bg-neutral-800 dark:border-neutral-600"
                        >
                          <div className="text-sm">
                            <span className="font-medium text-gray-800 dark:text-neutral-200">
                              {safeRender(item["@name"])}
                            </span>
                            {item["@explanation"] && (
                              <p className="text-sm text-gray-600 mt-1 dark:text-neutral-400">
                                {safeRender(item["@explanation"])}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border border-gray-200 rounded p-2 dark:bg-neutral-800 dark:border-neutral-600">
                        <div className="text-sm">
                          <span className="font-medium text-gray-800 dark:text-neutral-200">
                            {safeRender(classObj.CLASS["@name"])}
                          </span>
                          {classObj.CLASS["@explanation"] && (
                            <p className="text-sm text-gray-600 mt-1 dark:text-neutral-400">
                              {safeRender(classObj.CLASS["@explanation"])}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
