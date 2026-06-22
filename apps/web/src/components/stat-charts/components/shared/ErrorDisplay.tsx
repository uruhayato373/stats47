import React from "react";

import { ChartErrorState } from "@/components/charts/ChartState";

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
  <ChartErrorState title={title} message={message} />
);
