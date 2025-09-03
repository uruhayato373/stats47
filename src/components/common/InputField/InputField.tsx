import { forwardRef } from "react";
import { useStyles } from "@/hooks/useStyles";

interface InputFieldProps {
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
    },
    ref
  ) => {
    const styles = useStyles();

    return (
      <div className={className}>
        <label
          htmlFor={name}
          className={required ? styles.label.required : styles.label.base}
        >
          {label}
          {description && (
            <span className={`ml-1 text-xs ${styles.text.muted}`}>({description})</span>
          )}
        </label>
        <input
          ref={ref}
          id={name}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input.base} ${
            disabled ? styles.input.disabled : ""
          } ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
        />
        {error && (
          <p className={`mt-1 text-sm ${styles.text.error}`}>{error}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
