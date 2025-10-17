"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
}

export function PasswordInput({
  showStrength = false,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showStrength) {
      setStrength(calculateStrength(e.target.value));
    }
    props.onChange?.(e);
  };

  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ];
  const strengthLabels = ["弱い", "やや弱い", "普通", "やや強い", "強い"];

  return (
    <div>
      <div className="relative">
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          onChange={handleChange}
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {showStrength && props.value && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  i < strength
                    ? strengthColors[strength - 1]
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            パスワード強度: {strength > 0 ? strengthLabels[strength - 1] : ""}
          </p>
        </div>
      )}
    </div>
  );
}
