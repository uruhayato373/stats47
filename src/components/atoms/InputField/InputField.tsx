import { forwardRef } from "react";

export interface InputFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  required?: boolean;
  disabled?: boolean;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  inlineLabel?: boolean; // ラベルをフィールド内に表示するかどうか
  width?: string; // 横幅を指定（例: "w-64", "w-full", "max-w-xs"など）
  size?: "sm" | "md" | "lg"; // サイズバリエーション
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"; // 角丸の設定
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      name,
      label,
      placeholder,
      description,
      type = "text",
      required = false,
      disabled = false,
      value,
      onChange,
      onBlur,
      error,
      className = "",
      inlineLabel = false,
      width,
      size = "sm",
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
          return "px-2 py-1 h-7 text-sm";
        case "lg":
          return "px-4 py-3 h-12 text-base";
        case "md":
        default:
          return "px-3 py-2 h-8 text-base";
      }
    };

    // ベースクラス
    const baseInputClasses =
      "w-full border border-gray-200 shadow-xs placeholder-gray-600 bg-white text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-50 dark:placeholder-neutral-400";
    const disabledClasses = "opacity-50 cursor-not-allowed";
    const errorClasses =
      "border-red-500 focus:border-red-500 focus:ring-red-500";

    // ラベルクラス
    const baseLabelClasses =
      "block text-sm font-medium text-gray-700 dark:text-neutral-300";
    const requiredLabelClasses =
      "block text-sm font-medium text-gray-700 dark:text-neutral-300 after:content-['*'] after:ml-0.5 after:text-red-500";

    // テキストクラス
    const mutedTextClasses = "text-gray-500 dark:text-neutral-400";
    const errorTextClasses = "text-red-600 dark:text-red-400";

    return (
      <div className={className}>
        {!inlineLabel && (
          <label
            htmlFor={name}
            className={required ? requiredLabelClasses : baseLabelClasses}
          >
            {label}
            {description && (
              <span className={`ml-1 text-xs ${mutedTextClasses}`}>
                ({description})
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={name}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={inlineLabel ? label : placeholder}
          disabled={disabled}
          className={`${baseInputClasses} ${getSizeClasses(
            size
          )} ${getRoundedClass(rounded)} ${disabled ? disabledClasses : ""} ${
            error ? errorClasses : ""
          } ${width || ""}`}
        />
        {error && <p className={`mt-1 text-sm ${errorTextClasses}`}>{error}</p>}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
