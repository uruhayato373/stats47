"use client";

import { MunicipalityService } from "@/features/area/services/municipality-service";
import { PrefectureService } from "@/features/area/services/prefecture-service";
import { Municipality, Prefecture } from "@/features/area/types/index";
import { useCallback, useState } from "react";

/**
 * 地域選択状態の型定義
 */
export type AreaType = "country" | "prefecture" | "municipality";

export interface AreaSelection {
  /** 選択された地域タイプ */
  areaType: AreaType;
  /** 選択された地域コード（全国は"00000"） */
  selectedCode: string;
  /** 選択された地域名 */
  selectedName: string;
  /** 選択された都道府県コード（都道府県・市区町村選択時） */
  prefectureCode?: string;
  /** 選択された市区町村コード（市区町村選択時のみ） */
  municipalityCode?: string;
}

/**
 * 地域選択状態を管理するカスタムフック
 *
 * @returns 地域選択状態と操作関数
 */
export function useAreaSelection() {
  // 初期状態：全国を選択
  const [selection, setSelection] = useState<AreaSelection>({
    areaType: "country",
    selectedCode: "00000",
    selectedName: "全国",
  });

  // 都道府県データの取得
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [regions, setRegions] = useState<Record<string, string[]>>({});
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 都道府県データを読み込み
   */
  const loadPrefectureData = useCallback(async () => {
    if (prefectures.length > 0 && Object.keys(regions).length > 0) {
      return; // 既にデータが読み込まれている
    }

    setIsLoading(true);
    setError(null);

    try {
      const [prefecturesData, regionsData] = await Promise.all([
        PrefectureService.listPrefectures(),
        PrefectureService.listRegions(),
      ]);

      setPrefectures(prefecturesData);
      setRegions(regionsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  }, [prefectures.length, Object.keys(regions).length]);

  /**
   * 全国を選択
   */
  const selectCountry = useCallback(() => {
    setSelection({
      areaType: "country",
      selectedCode: "00000",
      selectedName: "全国",
    });
  }, []);

  /**
   * 都道府県を選択
   */
  const selectPrefecture = useCallback((prefecture: Prefecture) => {
    setSelection({
      areaType: "prefecture",
      selectedCode: prefecture.prefCode,
      selectedName: prefecture.prefName,
      prefectureCode: prefecture.prefCode,
    });
  }, []);

  /**
   * 市区町村を選択
   */
  const selectMunicipality = useCallback((municipality: Municipality) => {
    setSelection({
      areaType: "municipality",
      selectedCode: municipality.code,
      selectedName: municipality.name,
      prefectureCode: municipality.prefectureCode,
      municipalityCode: municipality.code,
    });
  }, []);

  /**
   * 地域タイプを変更
   */
  const changeAreaType = useCallback(
    (areaType: AreaType) => {
      if (areaType === "country") {
        selectCountry();
      } else if (areaType === "prefecture") {
        // 都道府県データが読み込まれていない場合は読み込む
        if (prefectures.length === 0) {
          loadPrefectureData();
        }
        // 都道府県タブに切り替えただけでは選択はしない
      } else if (areaType === "municipality") {
        // 市区町村タブに切り替えただけでは選択はしない
        // 都道府県が選択されていない場合は市区町村を選択できない
        if (selection.prefectureCode) {
          // 都道府県が選択されている場合は市区町村データを読み込む
          loadMunicipalityData(selection.prefectureCode);
        }
      }
    },
    [
      selectCountry,
      prefectures.length,
      loadPrefectureData,
      selection.prefectureCode,
    ]
  );

  /**
   * 地域ブロック別の都道府県を取得
   */
  const getPrefecturesByRegion = useCallback(
    (regionKey: string) => {
      return prefectures.filter((pref) => pref.regionKey === regionKey);
    },
    [prefectures]
  );

  /**
   * 地域ブロック一覧を取得
   */
  const getRegionList = useCallback(() => {
    return Object.entries(regions).map(([key, prefectureNames]) => ({
      key,
      name: getRegionDisplayName(key),
      prefectures: prefectureNames,
    }));
  }, [regions]);

  /**
   * 市区町村データを読み込み
   */
  const loadMunicipalityData = useCallback(
    async (prefectureCode: string) => {
      if (municipalities.length > 0) {
        return; // 既にデータが読み込まれている
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await MunicipalityService.listMunicipalitiesByPrefecture(
          prefectureCode
        );
        setMunicipalities(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "市区町村データの取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [municipalities.length]
  );

  /**
   * 特定の都道府県の市区町村を取得
   */
  const getMunicipalitiesByPrefecture = useCallback(
    (prefectureCode: string) => {
      return municipalities.filter(
        (muni) => muni.prefectureCode === prefectureCode
      );
    },
    [municipalities]
  );

  /**
   * 地域ブロックの表示名を取得
   */
  const getRegionDisplayName = useCallback((regionKey: string) => {
    const regionNames: Record<string, string> = {
      "hokkaido-tohoku": "北海道・東北地方",
      "kanto-chubu": "関東・中部地方",
      kinki: "近畿地方",
      "chugoku-shikoku": "中国・四国地方",
      "kyushu-okinawa": "九州・沖縄地方",
    };
    return regionNames[regionKey] || regionKey;
  }, []);

  return {
    // 状態
    selection,
    prefectures,
    regions,
    municipalities,
    isLoading,
    error,

    // 操作関数
    selectCountry,
    selectPrefecture,
    selectMunicipality,
    changeAreaType,
    loadPrefectureData,
    loadMunicipalityData,
    getPrefecturesByRegion,
    getMunicipalitiesByPrefecture,
    getRegionList,
    getRegionDisplayName,
  };
}
