import React from "react";

interface ErrorDisplayProps {
  title: string;
  message: string;
}

/**
 * チャートのエラー表示コンポーネント（共通）
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
}) => (
  <div className="bg-card border rounded-lg p-4 shadow-sm">
    <h3 className="font-semibold text-lg mb-3">{title}</h3>
    <div className="h-[250px] flex items-center justify-center bg-muted/10 rounded">
      <p className="text-destructive text-sm">{message}</p>
    </div>
  </div>
);
