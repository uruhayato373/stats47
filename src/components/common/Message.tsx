import React from "react";
import { useStyles } from "@/hooks/useStyles";

interface MessageProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  className?: string;
}

export default function Message({
  type,
  message,
  className = "",
}: MessageProps) {
  const styles = useStyles();

  // メッセージタイプに応じたテキスト色を決定
  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-blue-800 dark:text-blue-200";
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
    <div className={`${styles.message[type]} ${className}`}>
      <p className={getTextColor()}>{message}</p>
    </div>
  );
}
