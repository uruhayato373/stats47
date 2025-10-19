import { forwardRef } from "react";

export interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "ghost"
    | "outline";
  size?: "sm" | "md" | "lg";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  width?: "auto" | "full";
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: "left" | "right";
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      type = "button",
      disabled = false,
      onClick,
      onBlur,
      variant = "primary",
      size = "md",
      rounded = "sm",
      width = "auto",
      icon: Icon,
      iconPosition = "left",
      className = "",
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
          return "rounded-sm";
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
          return "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600";
        case "success":
          return "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600";
        case "warning":
          return "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600";
        case "danger":
          return "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600";
        case "ghost":
          return "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800";
        case "outline":
          return "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800";
        case "primary":
        default:
          return "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600";
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

    // アイコンサイズに応じたクラスを取得
    const getIconSizeClasses = (size: "sm" | "md" | "lg") => {
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

    const baseClasses =
      "focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center whitespace-nowrap";
    const sizeClasses = getSizeClasses(size);
    const variantClasses = getVariantClasses(variant);
    const widthClasses = getWidthClasses(width);
    const iconSizeClasses = getIconSizeClasses(size);

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        onBlur={onBlur}
        disabled={disabled}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${getRoundedClass(
          rounded
        )} ${className}`}
      >
        {Icon && iconPosition === "left" && (
          <Icon className={`${iconSizeClasses} ${children ? "mr-1.5" : ""}`} />
        )}
        {children}
        {Icon && iconPosition === "right" && (
          <Icon className={`${iconSizeClasses} ${children ? "ml-1.5" : ""}`} />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
