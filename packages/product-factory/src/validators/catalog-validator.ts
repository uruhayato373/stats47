/**
 * カタログ決定的 validator。
 * 正典受入条件: 全商品 ID が一意で、レビュー文書の商品候補との対応を機械検証できる。
 * fs には依存しない純関数 (レビュー Markdown との突合は golden test 側が担う)。
 */
import type {
  ProductDefinition,
  ProductFamily,
  ProductFormat,
  DataMode,
  SupportLevel,
  ProductRisk,
  ProductStatus,
} from "../catalog/types";
import {
  FAMILY_BY_LETTER,
  EXPECTED_FAMILY_COUNTS,
  EXPECTED_TOTAL,
  ZERO_PRICE_FAMILIES,
  expectedIds,
} from "../catalog/families";
import { LICENSE_IDS } from "../catalog/licenses";
import { TEMPLATE_IDS } from "../catalog/templates";

/** 実行時 enum 集合 (TS の静的検査に加えた二重チェック用)。 */
const FAMILIES: ReadonlySet<ProductFamily> = new Set<ProductFamily>([
  "asset",
  "powerpoint",
  "excel",
  "data",
  "industry",
  "government",
  "media",
  "education",
  "consumer",
  "service",
  "license",
  "entry",
]);
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

const ID_PATTERN = /^[A-L]-\d{2}$/;

export interface ValidationIssue {
  readonly code: string;
  readonly id?: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly total: number;
  readonly perFamily: Readonly<Record<string, number>>;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}

/**
 * カタログを決定的に検証する。
 * error があれば ok=false。warning は ok に影響しない。
 */
export function validateCatalog(products: readonly ProductDefinition[]): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. ID 形式 + 重複
  const seen = new Set<string>();
  for (const p of products) {
    if (!ID_PATTERN.test(p.id)) {
      errors.push({ code: "id-format", id: p.id, message: `ID が ^[A-L]-\\d{2}$ に一致しない: ${p.id}` });
      continue;
    }
    if (seen.has(p.id)) {
      errors.push({ code: "id-duplicate", id: p.id, message: `ID が重複: ${p.id}` });
    }
    seen.add(p.id);
  }

  // 2. レビュー候補との対応 (集合一致)。欠落・余剰を機械検出。
  const expected = new Set(expectedIds());
  for (const want of expected) {
    if (!seen.has(want)) {
      errors.push({ code: "id-missing", id: want, message: `レビュー候補 ${want} がカタログに存在しない` });
    }
  }
  for (const have of seen) {
    if (!expected.has(have)) {
      errors.push({ code: "id-extra", id: have, message: `レビューに無い ID がカタログに存在: ${have}` });
    }
  }

  // 3. 総数
  if (products.length !== EXPECTED_TOTAL) {
    errors.push({
      code: "count-total",
      message: `商品総数が期待値と不一致: ${products.length} (期待 ${EXPECTED_TOTAL})`,
    });
  }

  // 4. 各商品のフィールド検証
  const perFamily: Record<string, number> = {};
  for (const p of products) {
    const letter = p.id.slice(0, 1);
    perFamily[letter] = (perFamily[letter] ?? 0) + 1;

    // family ↔ ID 先頭文字の整合
    const expectedFamily = FAMILY_BY_LETTER[letter];
    if (expectedFamily && p.family !== expectedFamily) {
      errors.push({
        code: "family-mismatch",
        id: p.id,
        message: `family=${p.family} は ID 先頭 ${letter} (=${expectedFamily}) と不一致`,
      });
    }
    if (!FAMILIES.has(p.family)) {
      errors.push({ code: "family-enum", id: p.id, message: `未知の family: ${p.family}` });
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

    // formats: license 以外は非空。全要素が有効な形式。
    if (p.family !== "license" && p.formats.length === 0) {
      errors.push({ code: "formats-empty", id: p.id, message: "formats が空 (license 以外は 1 件以上必須)" });
    }
    for (const f of p.formats) {
      if (!FORMATS.has(f)) {
        errors.push({ code: "format-enum", id: p.id, message: `未知の format: ${f}` });
      }
    }

    // price: 0 <= min <= initial <= max。priced family は min > 0。
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
      if (!ZERO_PRICE_FAMILIES.has(p.family) && minYen <= 0) {
        errors.push({ code: "price-zero", id: p.id, message: "有償 family だが minYen<=0" });
      }
    }

    // licenseId 参照
    if (!LICENSE_IDS.includes(p.licenseId)) {
      errors.push({ code: "license-ref", id: p.id, message: `未知の licenseId: ${p.licenseId}` });
    }

    // templateIds 参照 (Phase 1 は空レジストリ → 実質すべて [])
    for (const t of p.templateIds) {
      if (!TEMPLATE_IDS.includes(t)) {
        errors.push({ code: "template-ref", id: p.id, message: `未知の templateId: ${t}` });
      }
    }
  }

  // 5. family 別件数
  for (const [letter, want] of Object.entries(EXPECTED_FAMILY_COUNTS)) {
    const got = perFamily[letter] ?? 0;
    if (got !== want) {
      errors.push({
        code: "count-family",
        message: `family ${letter} の件数が不一致: ${got} (期待 ${want})`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    total: products.length,
    perFamily,
    errors,
    warnings,
  };
}
