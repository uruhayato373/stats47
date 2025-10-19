import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface LoadingButtonProps {
  /** ボタンのテキスト */
  children: React.ReactNode;
  /** ローディング状態 */
  loading?: boolean;
  /** ローディング時のテキスト */
  loadingText?: string;
  /** ボタンが無効かどうか */
  disabled?: boolean;
  /** クリック時のハンドラー */
  onClick?: () => void;
  /** ボタンのタイプ */
  type?: "button" | "submit" | "reset";
  /** サイズバリエーション */
  size?: "sm" | "md" | "lg";
  /** カラーバリエーション */
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  /** カスタムクラス名 */
  className?: string;
  /** アイコンコンポーネント */
  icon?: React.ComponentType<{ className?: string }>;
  /** ローディングアイコンのサイズ */
  iconSize?: "sm" | "md" | "lg";
  /** ボタンの幅 */
  width?: "auto" | "full";
  /** 角丸の設定 */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      disabled = false,
      onClick,
      type = "button",
      size = "md",
      variant = "primary",
      className = "",
      icon: Icon,
      iconSize,
      width = "auto",
      rounded = "sm",
    },
    ref
  ) => {
    // 角丸クラスを取得
    const getRoundedClass = (rounded: string) => {
      switch (rounded) {
        case "none":
          return "rounded-none";
        case "sm":
          return "rounded-sm";
        case "md":
          return "rounded-md";
        case "lg":
          return "rounded-lg";
        case "xl":
          return "rounded-xl";
        case "2xl":
          return "rounded-2xl";
        case "3xl":
          return "rounded-3xl";
        case "full":
          return "rounded-full";
        default:
          return "rounded-lg";
      }
    };

    // サイズに応じたクラスを取得
    const getSizeClasses = (size: "sm" | "md" | "lg") => {
      switch (size) {
        case "sm":
          return "px-2 py-1 h-7 text-xs";
        case "lg":
          return "px-6 py-3 h-12 text-base";
        case "md":
        default:
          return "px-3 py-1.5 h-8 text-sm";
      }
    };

    // バリエーションに応じたクラスを取得
    const getVariantClasses = (variant: string) => {
      switch (variant) {
        case "secondary":
          return "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500";
        case "success":
          return "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500";
        case "warning":
          return "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500";
        case "danger":
          return "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";
        case "primary":
        default:
          return "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";
      }
    };

    // アイコンサイズに応じたクラスを取得
    const getIconSizeClasses = (iconSize?: "sm" | "md" | "lg") => {
      if (iconSize) {
        switch (iconSize) {
          case "sm":
            return "h-3 w-3";
          case "lg":
            return "h-5 w-5";
          case "md":
          default:
            return "h-4 w-4";
        }
      }
      // iconSizeが指定されていない場合は、ボタンサイズに応じて決定
      switch (size) {
        case "sm":
          return "h-3 w-3";
        case "lg":
          return "h-5 w-5";
        case "md":
        default:
          return "h-4 w-4";
      }
    };

    // 幅に応じたクラスを取得
    const getWidthClasses = (width: "auto" | "full") => {
      switch (width) {
        case "full":
          return "w-full";
        case "auto":
        default:
          return "w-auto";
      }
    };

    const baseClasses =
      "focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center whitespace-nowrap";
    const sizeClasses = getSizeClasses(size);
    const variantClasses = getVariantClasses(variant);
    const iconSizeClasses = getIconSizeClasses(iconSize);
    const widthClasses = getWidthClasses(width);

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${getRoundedClass(
          rounded
        )} ${className}`}
      >
        {loading ? (
          <div className="flex items-center gap-1.5">
            <Loader2 className={`animate-spin ${iconSizeClasses}`} />
            {loadingText || "処理中..."}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {Icon && <Icon className={iconSizeClasses} />}
            {children}
          </div>
        )}
      </button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
