import React from "react";

interface RankingHeaderProps {
  title: string;
  yearSelector: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const RankingHeader: React.FC<RankingHeaderProps> = ({
  title,
  yearSelector,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`px-4 mb-4 flex items-center justify-between gap-4 ${className}`}
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {actions}
        {yearSelector}
      </div>
    </div>
  );
};
