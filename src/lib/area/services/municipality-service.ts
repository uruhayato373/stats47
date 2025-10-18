/**
 * 市区町村サービス
 *
 * 市区町村データの取得・検索機能を提供
 */

import municipalitiesData from "@/config/areas/municipalities.json";
import type {
  Municipality,
  MunicipalityType,
  MunicipalitySearchOptions,
} from "../types";
import { validateMunicipalityCode } from "../validators/code-validator";
import { extractPrefectureCode } from "../utils/code-converter";

interface EstatClass {
  "@code": string;
  "@name": string;
  "@level": string;
  "@parentCode"?: string;
}

export class MunicipalityService {
  private static municipalities: Municipality[];
  private static municipalityMap: Map<string, Municipality>;
  private static initialized = false;

  /**
   * 初期化
   */
  private static initialize() {
    if (this.initialized) return;

    // e-Stat構造から市区町村データを変換
    this.municipalities = municipalitiesData.map(
      (munic: EstatClass) => this.convertEstatClassToMunicipality(munic)
    );

    // マップを構築
    this.municipalityMap = new Map();
    for (const munic of this.municipalities) {
      this.municipalityMap.set(munic.code, munic);
    }

    this.initialized = true;
  }

  /**
   * e-Stat構造をMunicipality型に変換
   */
  private static convertEstatClassToMunicipality(
    estatClass: EstatClass
  ): Municipality {
    const code = estatClass["@code"];
    const fullName = estatClass["@name"];
    const level = parseInt(estatClass["@level"]);
    const parentCode = estatClass["@parentCode"];

    // 都道府県コードを抽出
    const prefCode = code.substring(0, 2);

    // 市区町村名を抽出
    const name = this.extractMunicipalityName(fullName);

    // 市区町村タイプを判定
    const type = this.determineMunicipalityType(fullName, level, parentCode);

    return {
      code,
      name,
      fullName,
      prefCode,
      ...(parentCode && { parentCode }),
      type,
      level,
    };
  }

  /**
   * 完全名称から市区町村名を抽出
   */
  private static extractMunicipalityName(fullName: string): string {
    // "北海道 札幌市" -> "札幌市"
    // "北海道 札幌市 中央区" -> "中央区"
    const parts = fullName.split(/\s+/);

    if (parts.length >= 3) {
      // "北海道 札幌市 中央区" の場合は最後の部分のみ
      return parts[parts.length - 1];
    } else if (parts.length === 2) {
      // "北海道 札幌市" の場合は2番目の部分
      return parts[1];
    }

    return fullName;
  }

  /**
   * 市区町村タイプを判定
   */
  private static determineMunicipalityType(
    fullName: string,
    level: number,
    parentCode?: string
  ): MunicipalityType {
    // レベル3は区
    if (level === 3) {
      return "ward";
    }

    // 政令指定都市の区（親が市で末尾が000でない）
    if (parentCode && !parentCode.endsWith("000")) {
      return "ward";
    }

    // 名前から判定
    if (fullName.includes("市")) return "city";
    if (fullName.includes("区")) return "ward";
    if (fullName.includes("町")) return "town";
    if (fullName.includes("村")) return "village";

    return "city"; // デフォルト
  }

  /**
   * 全市区町村を取得
   */
  static getAllMunicipalities(): Municipality[] {
    this.initialize();
    return [...this.municipalities];
  }

  /**
   * 市区町村コードから市区町村を取得
   */
  static getMunicipalityByCode(municCode: string): Municipality | null {
    this.initialize();

    // 検証
    const validation = validateMunicipalityCode(municCode);
    if (!validation.isValid) {
      return null;
    }

    return this.municipalityMap.get(municCode) || null;
  }

  /**
   * 市区町村名から市区町村を取得
   * @param name 市区町村名
   * @param prefCode 都道府県コード（指定すると検索範囲を絞る）
   */
  static getMunicipalityByName(
    name: string,
    prefCode?: string
  ): Municipality | null {
    this.initialize();

    if (!name) return null;

    let candidates = this.municipalities;

    // 都道府県コードで絞り込み
    if (prefCode) {
      const prefCode2digit = extractPrefectureCode(prefCode);
      candidates = candidates.filter((m) => m.prefCode === prefCode2digit);
    }

    // 名前で検索（完全一致）
    return candidates.find((m) => m.name === name) || null;
  }

  /**
   * 都道府県内の全市区町村を取得
   */
  static getMunicipalitiesByPrefecture(prefCode: string): Municipality[] {
    this.initialize();

    const prefCode2digit = extractPrefectureCode(prefCode);

    return this.municipalities.filter((m) => m.prefCode === prefCode2digit);
  }

  /**
   * 市区町村タイプで絞り込み
   */
  static getMunicipalitiesByType(type: MunicipalityType): Municipality[] {
    this.initialize();

    return this.municipalities.filter((m) => m.type === type);
  }

  /**
   * 都道府県×タイプで市区町村を取得
   */
  static getMunicipalitiesByPrefectureAndType(
    prefCode: string,
    type: MunicipalityType
  ): Municipality[] {
    this.initialize();

    const prefCode2digit = extractPrefectureCode(prefCode);

    return this.municipalities.filter(
      (m) => m.prefCode === prefCode2digit && m.type === type
    );
  }

  /**
   * 市区町村を検索
   */
  static searchMunicipalities(
    options: MunicipalitySearchOptions
  ): Municipality[] {
    this.initialize();

    const {
      query,
      prefCode,
      type,
      caseInsensitive = true,
      partialMatch = true,
      limit,
    } = options;

    let results = this.municipalities;

    // 都道府県フィルター
    if (prefCode) {
      const prefCode2digit = extractPrefectureCode(prefCode);
      results = results.filter((m) => m.prefCode === prefCode2digit);
    }

    // タイプフィルター
    if (type) {
      results = results.filter((m) => m.type === type);
    }

    // クエリ検索
    if (query) {
      const searchQuery = caseInsensitive ? query.toLowerCase() : query;

      results = results.filter((m) => {
        const name = caseInsensitive ? m.name.toLowerCase() : m.name;
        const code = m.code;

        if (partialMatch) {
          return name.includes(searchQuery) || code.includes(searchQuery);
        } else {
          return name === searchQuery || code === searchQuery;
        }
      });
    }

    // 制限
    if (limit && limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  }

  /**
   * 市区町村が存在するかチェック
   */
  static existsMunicipality(municCode: string): boolean {
    return this.getMunicipalityByCode(municCode) !== null;
  }

  /**
   * 政令指定都市の区を取得
   */
  static getDesignatedCityWards(cityCode: string): Municipality[] {
    this.initialize();

    return this.municipalities.filter(
      (m) => m.parentCode === cityCode && m.type === "ward"
    );
  }

  /**
   * 市区町村の親（政令指定都市）を取得
   */
  static getParentCity(municCode: string): Municipality | null {
    const munic = this.getMunicipalityByCode(municCode);

    if (!munic || !munic.parentCode) {
      return null;
    }

    return this.getMunicipalityByCode(munic.parentCode);
  }

  /**
   * 市区町村数を取得
   */
  static getCount(): number {
    this.initialize();
    return this.municipalities.length;
  }

  /**
   * 都道府県ごとの市区町村数を取得
   */
  static getCountByPrefecture(): Record<string, number> {
    this.initialize();

    return this.municipalities.reduce((acc, m) => {
      acc[m.prefCode] = (acc[m.prefCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * タイプ別の市区町村数を取得
   */
  static getCountByType(): Record<MunicipalityType, number> {
    this.initialize();

    return this.municipalities.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<MunicipalityType, number>);
  }
}
