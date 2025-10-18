import React from "react";
import { Check, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

/**
 * AlertProps - Alertコンポーネントのプロパティ
 */
export interface AlertProps {
  /** アラートの種類 */
  type: "success" | "error" | "info" | "warning";
  /** 表示するメッセージ */
  message: string;
  /** 追加のCSSクラス */
  className?: string;
  /** アイコンを表示するかどうか（デフォルト: true） */
  showIcon?: boolean;
  /** カスタムアイコンコンポーネント */
  icon?: React.ComponentType<{ className?: string }>;
  /** 閉じるボタンがクリックされた時のコールバック */
  onDismiss?: () => void;
}

/**
 * Alert - メッセージ表示用の共通コンポーネント
 *
 * 機能:
 * - 成功・エラー・情報・警告の4種類のメッセージ表示
 * - アイコンの表示/非表示制御
 * - カスタムアイコンの使用
 * - 閉じるボタン（オプション）
 * - ダークモード対応
 * - アクセシビリティ対応
 *
 * 使用例:
 * ```tsx
 * <Alert type="success" message="保存が完了しました" />
 * <Alert type="error" message="エラーが発生しました" showIcon={false} />
 * <Alert type="warning" message="警告メッセージ" onDismiss={() => setShow(false)} />
 * ```
 */
export default function Alert({
  type,
  message,
  className = "",
  showIcon = true,
  icon: CustomIcon,
  onDismiss,
}: AlertProps) {
  /**
   * 型に応じたスタイルクラスを取得
   */
  const getAlertClasses = (type: AlertProps["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300";
      case "error":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300";
    }
  };

  /**
   * 型に応じたデフォルトアイコンを取得
   */
  const getDefaultIcon = (type: AlertProps["type"]) => {
    const iconClass = "w-4 h-4 flex-shrink-0";

    switch (type) {
      case "success":
        return <Check className={iconClass} />;
      case "error":
        return <AlertCircle className={iconClass} />;
      case "info":
        return <Info className={iconClass} />;
      case "warning":
        return <AlertTriangle className={iconClass} />;
      default:
        return null;
    }
  };

  /**
   * アイコンをレンダリング
   */
  const renderIcon = () => {
    if (!showIcon) return null;

    if (CustomIcon) {
      return <CustomIcon className="w-4 h-4 flex-shrink-0" />;
    }

    return getDefaultIcon(type);
  };

  return (
    <div
      className={`p-4 border rounded-lg ${getAlertClasses(type)} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* アイコン */}
        {renderIcon()}

        {/* メッセージ */}
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>

        {/* 閉じるボタン */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="アラートを閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
