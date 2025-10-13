import React from "react";

interface RankingLayoutProps {
  main: React.ReactNode;
  navigation: React.ReactNode;
  className?: string;
}

export const RankingLayout: React.FC<RankingLayoutProps> = ({
  main,
  navigation,
  className = "",
}) => {
  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* メインコンテンツ */}
      <div className="flex-1">{main}</div>

      {/* ナビゲーション */}
      <div className="w-full lg:w-80">{navigation}</div>
    </div>
  );
};
