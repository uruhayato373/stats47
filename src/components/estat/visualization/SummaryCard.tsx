"use client";

import React from "react";

interface SummaryCardProps {
  label: string;
  value: string | number;
  formatValue?: (value: string | number) => string;
}

export default function SummaryCard({
  label,
  value,
  formatValue
}: SummaryCardProps) {
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className="bg-white dark:bg-neutral-700 p-3 rounded border border-gray-200 dark:border-neutral-600">
      <div className="text-gray-600 dark:text-neutral-400">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
        {displayValue}
      </div>
    </div>
  );
}