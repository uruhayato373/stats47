/**
 * useMapResourcesフックのモック実装（Storybook用）
 * 地図データを直接インポートして提供します
 */

import { useCallback, useEffect, useState } from "react";

import { geoshape } from "@stats47/mock";
const jpPrefecturesData = geoshape.jpPrefectures;

import type { D3Module, TopojsonModule } from "../../types/d3";

/**
 * useMapResourcesフックが返すオブジェクトの型定義
 */
interface UseMapResourcesReturn {
  d3Module: D3Module | null;
  topojsonModule: TopojsonModule | null;
  topologyData: any | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * useMapResourcesフックのオプションの型定義
 */
interface UseMapResourcesOptions {
  // オプションなし（将来の拡張用に型定義のみ保持）
}

/**
 * useMapResourcesフックのモック実装
 * Storybook環境で地図データを提供します
 */
export function useMapResources(options: UseMapResourcesOptions = {}): UseMapResourcesReturn {
  
  // D3モジュールの状態管理
  const [d3Module, setD3Module] = useState<D3Module | null>(null);
  // TopoJSONモジュールの状態管理
  const [topojsonModule, setTopojsonModule] = useState<TopojsonModule | null>(null);
  // 地図データ（TopoJSON）の状態管理
  const [topologyData, setTopologyData] = useState<any | null>(null);
  // 読み込み状態の管理
  const [isLoading, setIsLoading] = useState(true);
  // エラー状態の管理
  const [error, setError] = useState<string | null>(null);

  /**
   * 全てのリソースを非同期に読み込む関数
   */
  const loadResources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // D3とTopoJSONを動的インポート（並列実行で読み込み時間を短縮）
      const [d3, topojson] = await Promise.all([
        import("d3"),
        import("topojson-client")
      ]);

      // 地図データの取得処理（モックデータを使用）
      const topology = jpPrefecturesData;

      // 取得したリソースをstateに保存
      setD3Module(d3);
      setTopojsonModule(topojson);
      setTopologyData(topology);
      setError(null);

    } catch (err) {
      // エラーハンドリング
      const errorMessage =
        err instanceof Error
          ? err.message
          : "リソースの読み込みに失敗しました";

      setError(errorMessage);
    } finally {
      // 処理が成功しても失敗しても、ローディング状態を解除
      setIsLoading(false);
    }
  }, []);

  // コンポーネントのマウント時にリソースを読み込む
  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // 読み込んだリソースと状態を返す
  return {
    d3Module,
    topojsonModule,
    topologyData,
    isLoading,
    error,
  };
}
