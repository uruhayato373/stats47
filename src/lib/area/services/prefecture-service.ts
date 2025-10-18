/**
 * 都道府県サービス
 *
 * 都道府県データの取得・検索・変換機能を提供
 */

import prefecturesData from "@/config/areas/prefectures.json";
import type { Prefecture, Region, PrefectureSearchOptions } from "../types";
import {
  normalizePrefectureCode,
  extractPrefectureCode,
} from "../utils/code-converter";
import { validatePrefectureCode } from "../validators/code-validator";

export class PrefectureService {
  private static prefectures: Prefecture[];
  private static regions: Record<string, Region>;
  private static prefectureMap: Map<string, Prefecture>;
  private static prefectureNameMap: Map<string, Prefecture>;

  /**
   * 初期化
   */
  private static initialize() {
    if (this.prefectures) return;

    // 都道府県データを読み込み
    this.prefectures = prefecturesData.prefectures.map((pref) => ({
      prefCode: pref.prefCode,
      prefName: pref.prefName,
    }));

    // 地域ブロックデータを読み込み
    this.regions = Object.entries(prefecturesData.regions).reduce(
      (acc, [key, region]) => {
        acc[key] = {
          key,
          name: region.name,
          prefectures: region.prefectures,
        };
        return acc;
      },
      {} as Record<string, Region>
    );

    // マップを構築
    this.prefectureMap = new Map();
    this.prefectureNameMap = new Map();

    for (const pref of this.prefectures) {
      // 2桁コードでマップに追加
      const code2digit = extractPrefectureCode(pref.prefCode);
      this.prefectureMap.set(code2digit, pref);
      this.prefectureMap.set(pref.prefCode, pref);

      // 名前でマップに追加
      this.prefectureNameMap.set(pref.prefName, pref);
    }

    // 地域ブロックキーを都道府県に紐付け
    for (const [regionKey, region] of Object.entries(this.regions)) {
      for (const prefName of region.prefectures) {
        const pref = this.prefectureNameMap.get(prefName);
        if (pref) {
          pref.regionKey = regionKey;
        }
      }
    }
  }

  /**
   * 全都道府県を取得
   */
  static getAllPrefectures(): Prefecture[] {
    this.initialize();
    return [...this.prefectures];
  }

  /**
   * 都道府県コードから都道府県を取得
   * @param prefCode 都道府県コード（2桁または5桁）
   */
  static getPrefectureByCode(prefCode: string): Prefecture | null {
    this.initialize();

    // 検証
    const validation = validatePrefectureCode(prefCode);
    if (!validation.isValid) {
      return null;
    }

    // 2桁コードに正規化
    const code2digit = extractPrefectureCode(prefCode);
    return this.prefectureMap.get(code2digit) || null;
  }

  /**
   * 都道府県名から都道府県を取得
   */
  static getPrefectureByName(prefName: string): Prefecture | null {
    this.initialize();

    if (!prefName) return null;

    return this.prefectureNameMap.get(prefName) || null;
  }

  /**
   * 都道府県コードから都道府県名を取得
   * @param prefCode 都道府県コード（2桁または5桁）
   */
  static getPrefectureNameFromCode(prefCode: string): string | null {
    const pref = this.getPrefectureByCode(prefCode);
    return pref ? pref.prefName : null;
  }

  /**
   * 都道府県名から都道府県コード（2桁）を取得
   */
  static getPrefectureCodeFromName(prefName: string): string | null {
    const pref = this.getPrefectureByName(prefName);
    return pref ? extractPrefectureCode(pref.prefCode) : null;
  }

  /**
   * 全地域ブロックを取得
   */
  static getAllRegions(): Region[] {
    this.initialize();
    return Object.values(this.regions);
  }

  /**
   * 地域ブロックキーから地域ブロックを取得
   */
  static getRegionByKey(regionKey: string): Region | null {
    this.initialize();
    return this.regions[regionKey] || null;
  }

  /**
   * 都道府県が属する地域ブロックを取得
   */
  static getRegionByPrefecture(prefCode: string): Region | null {
    const pref = this.getPrefectureByCode(prefCode);
    if (!pref || !pref.regionKey) return null;

    return this.getRegionByKey(pref.regionKey);
  }

  /**
   * 地域ブロック内の都道府県リストを取得
   */
  static getPrefecturesByRegion(regionKey: string): Prefecture[] {
    this.initialize();

    const region = this.regions[regionKey];
    if (!region) return [];

    return region.prefectures
      .map((prefName) => this.prefectureNameMap.get(prefName))
      .filter((pref): pref is Prefecture => pref !== undefined);
  }

  /**
   * 都道府県を検索
   */
  static searchPrefectures(options: PrefectureSearchOptions): Prefecture[] {
    this.initialize();

    const {
      query,
      regionKey,
      caseInsensitive = true,
      partialMatch = true,
    } = options;

    let results = this.prefectures;

    // 地域ブロックフィルター
    if (regionKey) {
      results = this.getPrefecturesByRegion(regionKey);
    }

    // クエリ検索
    if (query) {
      const searchQuery = caseInsensitive ? query.toLowerCase() : query;

      results = results.filter((pref) => {
        const name = caseInsensitive
          ? pref.prefName.toLowerCase()
          : pref.prefName;
        const code = extractPrefectureCode(pref.prefCode);

        if (partialMatch) {
          return name.includes(searchQuery) || code.includes(searchQuery);
        } else {
          return name === searchQuery || code === searchQuery;
        }
      });
    }

    return results;
  }

  /**
   * 都道府県が存在するかチェック
   */
  static existsPrefecture(prefCode: string): boolean {
    return this.getPrefectureByCode(prefCode) !== null;
  }

  /**
   * 都道府県コードを5桁形式に正規化
   */
  static normalize(prefCode: string): string {
    return normalizePrefectureCode(prefCode);
  }

  /**
   * 都道府県マップを取得（コード→名前）
   */
  static getPrefectureMap(): Record<string, string> {
    this.initialize();

    const map: Record<string, string> = {};
    for (const pref of this.prefectures) {
      const code2digit = extractPrefectureCode(pref.prefCode);
      map[code2digit] = pref.prefName;
    }

    return map;
  }

  /**
   * 都道府県マップを取得（名前→コード）
   */
  static getPrefectureNameToCodeMap(): Record<string, string> {
    this.initialize();

    const map: Record<string, string> = {};
    for (const pref of this.prefectures) {
      const code2digit = extractPrefectureCode(pref.prefCode);
      map[pref.prefName] = code2digit;
    }

    return map;
  }
}
