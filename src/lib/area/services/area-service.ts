/**
 * 地域サービス
 *
 * 国・都道府県・市区町村の階層構造を統合管理
 */

import type {
  AreaHierarchy,
  AreaType,
  AreaSearchOptions,
  AreaSearchResult,
} from "../types";
import { PrefectureService } from "./prefecture-service";
import { MunicipalityService } from "./municipality-service";
import {
  getAreaType,
  getParentPrefectureCode,
  extractPrefectureCode,
} from "../utils/code-converter";
import { validateArea } from "../validators/code-validator";

export class AreaService {
  /**
   * 地域コードから地域情報を取得
   */
  static getAreaByCode(areaCode: string): AreaHierarchy | null {
    const validation = validateArea(areaCode);
    if (!validation.isValid || !validation.areaType) {
      return null;
    }

    const areaType = validation.areaType;

    switch (areaType) {
      case "country":
        return {
          areaCode: "00000",
          areaName: "日本",
          areaType: "country",
          areaLevel: "national",
          children: PrefectureService.getAllPrefectures().map(
            (p) => p.prefCode
          ),
        };

      case "prefecture": {
        const pref = PrefectureService.getPrefectureByCode(areaCode);
        if (!pref) return null;

        const municipalities =
          MunicipalityService.getMunicipalitiesByPrefecture(areaCode);

        return {
          areaCode: pref.prefCode,
          areaName: pref.prefName,
          areaType: "prefecture",
          areaLevel: "prefectural",
          parentCode: "00000",
          children: municipalities.map((m) => m.code),
        };
      }

      case "municipality": {
        const munic = MunicipalityService.getMunicipalityByCode(areaCode);
        if (!munic) return null;

        const parentCode =
          munic.parentCode || getParentPrefectureCode(areaCode);
        const wards = munic.parentCode
          ? []
          : MunicipalityService.getDesignatedCityWards(areaCode);

        return {
          areaCode: munic.code,
          areaName: munic.name,
          areaType: "municipality",
          areaLevel: "municipal",
          parentCode,
          ...(wards.length > 0 && { children: wards.map((w) => w.code) }),
        };
      }

      default:
        return null;
    }
  }

  /**
   * 地域タイプを判定
   */
  static getAreaType(areaCode: string): AreaType | null {
    try {
      return getAreaType(areaCode);
    } catch {
      return null;
    }
  }

  /**
   * 親地域を取得
   */
  static getParentArea(areaCode: string): AreaHierarchy | null {
    const area = this.getAreaByCode(areaCode);
    if (!area || !area.parentCode) {
      return null;
    }

    return this.getAreaByCode(area.parentCode);
  }

  /**
   * 子地域リストを取得
   */
  static getChildAreas(areaCode: string): AreaHierarchy[] {
    const area = this.getAreaByCode(areaCode);
    if (!area || !area.children) {
      return [];
    }

    return area.children
      .map((code) => this.getAreaByCode(code))
      .filter((a): a is AreaHierarchy => a !== null);
  }

  /**
   * 階層パスを取得（国→都道府県→市区町村）
   */
  static getHierarchyPath(areaCode: string): AreaHierarchy[] {
    const path: AreaHierarchy[] = [];
    let currentCode: string | null = areaCode;

    while (currentCode) {
      const area = this.getAreaByCode(currentCode);
      if (!area) break;

      path.unshift(area);
      currentCode = area.parentCode || null;
    }

    return path;
  }

  /**
   * 地域名を取得（フルパス）
   */
  static getFullAreaName(areaCode: string): string | null {
    const path = this.getHierarchyPath(areaCode);
    if (path.length === 0) return null;

    return path.map((a) => a.areaName).join(" ");
  }

  /**
   * 地域を検索
   */
  static searchAreas(options: AreaSearchOptions): AreaSearchResult[] {
    const {
      query,
      areaType,
      prefCode,
      caseInsensitive = true,
      partialMatch = true,
      limit,
    } = options;

    const results: AreaSearchResult[] = [];

    // 都道府県を検索
    if (!areaType || areaType === "prefecture") {
      const prefs = PrefectureService.searchPrefectures({
        query,
        caseInsensitive,
        partialMatch,
      });

      for (const pref of prefs) {
        results.push({
          code: pref.prefCode,
          name: pref.prefName,
          type: "prefecture",
          prefCode: extractPrefectureCode(pref.prefCode),
        });
      }
    }

    // 市区町村を検索
    if (!areaType || areaType === "municipality") {
      const munics = MunicipalityService.searchMunicipalities({
        query,
        prefCode,
        caseInsensitive,
        partialMatch,
        limit: limit ? limit * 2 : undefined, // 後で制限するので多めに取得
      });

      for (const munic of munics) {
        const prefName = PrefectureService.getPrefectureNameFromCode(
          munic.prefCode + "000"
        );
        const fullName = prefName ? `${prefName} ${munic.name}` : munic.name;

        results.push({
          code: munic.code,
          name: munic.name,
          fullName,
          type: "municipality",
          prefCode: munic.prefCode,
        });
      }
    }

    // 制限
    if (limit && limit > 0) {
      return results.slice(0, limit);
    }

    return results;
  }

  /**
   * 地域の階層レベルを取得
   */
  static getHierarchyLevel(areaCode: string): number {
    const areaType = this.getAreaType(areaCode);

    switch (areaType) {
      case "country":
        return 0;
      case "prefecture":
        return 1;
      case "municipality":
        return 2;
      default:
        return -1;
    }
  }

  /**
   * 2つの地域の共通祖先を取得
   */
  static getCommonAncestor(
    areaCode1: string,
    areaCode2: string
  ): AreaHierarchy | null {
    const path1 = this.getHierarchyPath(areaCode1);
    const path2 = this.getHierarchyPath(areaCode2);

    // 共通の祖先を探す
    for (let i = 0; i < Math.min(path1.length, path2.length); i++) {
      if (path1[i].areaCode !== path2[i].areaCode) {
        return i > 0 ? path1[i - 1] : null;
      }
    }

    // 一方が他方の祖先の場合
    return path1.length <= path2.length
      ? path1[path1.length - 1]
      : path2[path2.length - 1];
  }

  /**
   * 地域が別の地域の子孫かチェック
   */
  static isDescendantOf(descendantCode: string, ancestorCode: string): boolean {
    const path = this.getHierarchyPath(descendantCode);
    return path.some((area) => area.areaCode === ancestorCode);
  }

  /**
   * 都道府県数を取得
   */
  static getPrefectureCount(): number {
    return 47;
  }

  /**
   * 市区町村数を取得
   */
  static getMunicipalityCount(): number {
    return MunicipalityService.getCount();
  }

  /**
   * 地域統計を取得
   */
  static getStatistics() {
    return {
      prefectures: this.getPrefectureCount(),
      municipalities: this.getMunicipalityCount(),
      municipalitiesByPrefecture: MunicipalityService.getCountByPrefecture(),
      municipalitiesByType: MunicipalityService.getCountByType(),
    };
  }
}
