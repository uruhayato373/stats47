import React from "react";

export interface MessageProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  className?: string;
}

export default function Message({
  type,
  message,
  className = "",
}: MessageProps) {
  // メッセージタイプに応じたスタイルクラス
  const getMessageClasses = (
    type: "success" | "error" | "info" | "warning"
  ) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200";
      case "error":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200";
    }
  };

  const getTextClasses = (type: "success" | "error" | "info" | "warning") => {
    switch (type) {
      case "success":
        return "text-green-800 dark:text-green-200";
      case "error":
        return "text-red-800 dark:text-red-200";
      case "info":
        return "text-blue-800 dark:text-blue-200";
      case "warning":
        return "text-yellow-800 dark:text-yellow-200";
      default:
        return "text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg ${getMessageClasses(
        type
      )} ${className}`}
    >
      <p className={`text-sm font-medium ${getTextClasses(type)}`}>{message}</p>
    </div>
  );
}
