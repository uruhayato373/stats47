import React from "react";
import { EstatRankingClient } from "./EstatRankingClient";
import { EstatRankingProps } from "./EstatRankingClient";

/**
 * EstatRankingのサーバーコンポーネント
 * サーバー側で初期データを取得し、EstatRankingClientをレンダリング
 */
export const EstatRankingServer: React.FC<EstatRankingProps> = (props) => {
  return <EstatRankingClient {...props} />;
};
