import { forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string;
  className?: string;
  width?: string;
  size?: "sm" | "md" | "lg";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      name,
      label,
      options,
      placeholder,
      description,
      required = false,
      disabled = false,
      value,
      onChange,
      onBlur,
      error,
      className = "",
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
    const baseSelectClasses =
      "w-full border border-gray-200 shadow-xs bg-white text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-50";
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
        <select
          ref={ref}
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`${baseSelectClasses} ${getSizeClasses(
            size
          )} ${getRoundedClass(rounded)} ${disabled ? disabledClasses : ""} ${
            error ? errorClasses : ""
          } ${width || ""}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className={`mt-1 text-sm ${errorTextClasses}`}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export default Select;
