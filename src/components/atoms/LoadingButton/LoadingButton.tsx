import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import Button, { ButtonProps } from "../Button/Button";

export interface LoadingButtonProps extends Omit<ButtonProps, "icon"> {
  /** ローディング状態 */
  loading?: boolean;
  /** ローディング時のテキスト */
  loadingText?: string;
  /** アイコンコンポーネント */
  icon?: React.ComponentType<{ className?: string }>;
  /** ローディングアイコンのサイズ */
  iconSize?: "sm" | "md" | "lg";
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      disabled = false,
      icon: Icon,
      iconSize,
      ...props
    },
    ref
  ) => {
    const getIconSizeClass = (size?: "sm" | "md" | "lg") => {
      switch (size || props.size) {
        case "sm":
          return "h-3 w-3";
        case "lg":
          return "h-5 w-5";
        case "md":
        default:
          return "h-4 w-4";
      }
    };

    const iconClass = getIconSizeClass(iconSize);

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        icon={
          loading
            ? () => <Loader2 className={`animate-spin ${iconClass}`} />
            : Icon
        }
        {...props}
      >
        {loading ? loadingText || children : children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
