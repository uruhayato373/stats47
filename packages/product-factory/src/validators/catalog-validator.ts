/**
 * カタログ決定的 validator。
 * 受入条件: 全パック ID が一意で、期待パック集合 (EXPECTED_PACK_IDS) と一致し、
 * 出品可能 (approved/listed) なパックは実データセットが実在する (誇大表示防止)。
 * 純関数 (availableDatasetKeys を注入することで fs に依存しない)。
 */
import type {
  ProductDefinition,
  PackTheme,
  ProductFormat,
  DataMode,
  SupportLevel,
  ProductRisk,
  ProductStatus,
} from "../catalog/types";
import { EXPECTED_PACK_IDS, EXPECTED_TOTAL, PACK_THEMES, ZERO_PRICE_THEMES } from "../catalog/packs";
import { LICENSE_IDS } from "../catalog/licenses";
import { TEMPLATE_IDS } from "../catalog/templates";
import { DATASET_KEYS } from "../data/datasets";

const FORMATS: ReadonlySet<ProductFormat> = new Set<ProductFormat>([
  "pptx",
  "xlsx",
  "csv",
  "svg",
  "png",
  "pdf",
  "docx",
  "web",
]);
const DATA_MODES: ReadonlySet<DataMode> = new Set<DataMode>([
  "empty",
  "sample",
  "fixed-year",
  "updated",
  "customer",
]);
const SUPPORT_LEVELS: ReadonlySet<SupportLevel> = new Set<SupportLevel>([
  "none",
  "manual",
  "limited",
  "custom",
]);
const RISKS: ReadonlySet<ProductRisk> = new Set<ProductRisk>(["normal", "high-stakes", "rights-review"]);
const STATUSES: ReadonlySet<ProductStatus> = new Set<ProductStatus>([
  "cataloged",
  "spike",
  "buildable",
  "generated",
  "reviewed",
  "approved",
  "listed",
  "paused",
]);

/** 出品可能な状態 (実データ接続が必須)。 */
const LISTABLE_STATUSES: ReadonlySet<ProductStatus> = new Set<ProductStatus>(["approved", "listed"]);

const ID_PATTERN = /^P-\d{2}$/;

/** 価格が刻み規則に合うか (¥10,000 以下=500円刻み / 超=1,000円刻み)。 */
function isPriceStepValid(yen: number): boolean {
  if (yen <= 0) return true;
  return yen <= 10000 ? yen % 500 === 0 : yen % 1000 === 0;
}

export interface ValidationIssue {
  readonly code: string;
  readonly id?: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly total: number;
  /** テーマ slug 別の件数。 */
  readonly perTheme: Readonly<Record<string, number>>;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}

export interface ValidateCatalogOptions {
  /** 実在する実データセット key の集合 (省略時は登録レジストリ)。 */
  readonly availableDatasetKeys?: ReadonlySet<string>;
}

/**
 * カタログを決定的に検証する。error があれば ok=false。warning は ok に影響しない。
 */
export function validateCatalog(
  products: readonly ProductDefinition[],
  options: ValidateCatalogOptions = {},
): ValidationResult {
  const datasetKeys = options.availableDatasetKeys ?? DATASET_KEYS;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. ID 形式 + 重複
  const seen = new Set<string>();
  for (const p of products) {
    if (!ID_PATTERN.test(p.id)) {
      errors.push({ code: "id-format", id: p.id, message: `ID が ^P-\\d{2}$ に一致しない: ${p.id}` });
      continue;
    }
    if (seen.has(p.id)) {
      errors.push({ code: "id-duplicate", id: p.id, message: `ID が重複: ${p.id}` });
    }
    seen.add(p.id);
  }

  // 2. 期待パック集合との一致 (欠落・余剰を機械検出)
  const expected = new Set(EXPECTED_PACK_IDS);
  for (const want of expected) {
    if (!seen.has(want)) {
      errors.push({ code: "id-missing", id: want, message: `期待パック ${want} がカタログに存在しない` });
    }
  }
  for (const have of seen) {
    if (!expected.has(have)) {
      errors.push({ code: "id-extra", id: have, message: `期待集合に無い ID がカタログに存在: ${have}` });
    }
  }

  // 3. 総数
  if (products.length !== EXPECTED_TOTAL) {
    errors.push({
      code: "count-total",
      message: `パック総数が期待値と不一致: ${products.length} (期待 ${EXPECTED_TOTAL})`,
    });
  }

  // 4. 各パックのフィールド検証
  const perTheme: Record<string, number> = {};
  for (const p of products) {
    perTheme[p.theme] = (perTheme[p.theme] ?? 0) + 1;

    // theme enum
    if (!PACK_THEMES.has(p.theme)) {
      errors.push({ code: "theme-enum", id: p.id, message: `未知の theme: ${p.theme}` });
    }

    // enum 群
    if (!DATA_MODES.has(p.dataMode)) {
      errors.push({ code: "datamode-enum", id: p.id, message: `未知の dataMode: ${p.dataMode}` });
    }
    if (!SUPPORT_LEVELS.has(p.supportLevel)) {
      errors.push({ code: "support-enum", id: p.id, message: `未知の supportLevel: ${p.supportLevel}` });
    }
    if (!RISKS.has(p.risk)) {
      errors.push({ code: "risk-enum", id: p.id, message: `未知の risk: ${p.risk}` });
    }
    if (!STATUSES.has(p.status)) {
      errors.push({ code: "status-enum", id: p.id, message: `未知の status: ${p.status}` });
    }

    // 文字列必須
    if (p.name.trim() === "") {
      errors.push({ code: "name-empty", id: p.id, message: "name が空" });
    }
    if (p.jobToBeDone.trim() === "") {
      errors.push({ code: "job-empty", id: p.id, message: "jobToBeDone が空" });
    }
    if (p.audience.length === 0) {
      errors.push({ code: "audience-empty", id: p.id, message: "audience が空" });
    }
    if (p.compatibility.length === 0) {
      errors.push({ code: "compatibility-empty", id: p.id, message: "compatibility が空" });
    }

    // formats: 非空・全要素が有効な形式
    if (p.formats.length === 0) {
      errors.push({ code: "formats-empty", id: p.id, message: "formats が空 (1 件以上必須)" });
    }
    for (const f of p.formats) {
      if (!FORMATS.has(f)) {
        errors.push({ code: "format-enum", id: p.id, message: `未知の format: ${f}` });
      }
    }

    // price: 0 <= min <= initial <= max。free-trial 以外は min > 0。価格刻み。
    const { minYen, maxYen, initialYen } = p.price;
    if (!Number.isFinite(minYen) || !Number.isFinite(maxYen) || !Number.isFinite(initialYen)) {
      errors.push({ code: "price-nan", id: p.id, message: "price に数値でない値" });
    } else {
      if (minYen < 0 || maxYen < 0 || initialYen < 0) {
        errors.push({ code: "price-negative", id: p.id, message: "price が負値" });
      }
      if (minYen > maxYen) {
        errors.push({ code: "price-inverted", id: p.id, message: `minYen(${minYen}) > maxYen(${maxYen})` });
      }
      if (initialYen < minYen || initialYen > maxYen) {
        errors.push({
          code: "price-initial-range",
          id: p.id,
          message: `initialYen(${initialYen}) が [${minYen}, ${maxYen}] の外`,
        });
      }
      if (!ZERO_PRICE_THEMES.has(p.theme) && minYen <= 0) {
        errors.push({ code: "price-zero", id: p.id, message: "有償テーマだが minYen<=0" });
      }
      for (const [label, yen] of [["minYen", minYen], ["initialYen", initialYen], ["maxYen", maxYen]] as const) {
        if (!isPriceStepValid(yen)) {
          errors.push({
            code: "price-step",
            id: p.id,
            message: `${label}(${yen}) が価格刻み (¥10,000以下=500円 / 超=1,000円) に合わない`,
          });
        }
      }
    }

    // licenseId 参照
    if (!LICENSE_IDS.includes(p.licenseId)) {
      errors.push({ code: "license-ref", id: p.id, message: `未知の licenseId: ${p.licenseId}` });
    }

    // templateIds 参照
    for (const t of p.templateIds) {
      if (!TEMPLATE_IDS.includes(t)) {
        errors.push({ code: "template-ref", id: p.id, message: `未知の templateId: ${t}` });
      }
    }

    // datasets: 出品可能 (approved/listed) なら全キーが実在する (誇大表示防止)
    if (LISTABLE_STATUSES.has(p.status)) {
      if (p.datasets.length === 0) {
        errors.push({
          code: "datasets-empty-listable",
          id: p.id,
          message: `status=${p.status} だが datasets が空 (実データ未接続では出品不可)`,
        });
      }
      for (const key of p.datasets) {
        if (!datasetKeys.has(key)) {
          errors.push({
            code: "datasets-missing",
            id: p.id,
            message: `status=${p.status} のパックが実在しない dataset を参照: ${key}`,
          });
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    total: products.length,
    perTheme,
    errors,
    warnings,
  };
}
