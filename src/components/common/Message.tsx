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

  return (
    <div className={`${styles.message[type]} ${className}`}>
      <p className={styles.messageText[type]}>{message}</p>
    </div>
  );
}
