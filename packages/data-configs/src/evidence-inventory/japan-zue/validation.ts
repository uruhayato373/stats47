import {
  JAPAN_ZUE_CONTENT_ROLES,
  JAPAN_ZUE_EVIDENCE_KINDS,
  JAPAN_ZUE_GEO_SCOPES,
  JAPAN_ZUE_RESOLUTIONS,
  JAPAN_ZUE_RIGHTS,
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueEvidenceItem,
} from "./types";

const ITEM_ID_PATTERN = /^japan-zue-(\d{4}-\d{2})-p(\d{3})-(table|figure|textstat)\d{2}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS_PATTERN = /^https:\/\//;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  errors: string[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) errors.push(`${path}.${key}: unknown field`);
  }
}

function validateStringArray(
  value: unknown,
  path: string,
  errors: string[],
  options: { nonEmpty?: boolean; allowed?: readonly string[] } = {},
): void {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    errors.push(`${path}: expected string[]`);
    return;
  }
  if (options.nonEmpty && value.length === 0) errors.push(`${path}: must not be empty`);
  if (new Set(value).size !== value.length) errors.push(`${path}: duplicate values`);
  if (options.allowed) {
    const allowed = new Set(options.allowed);
    for (const entry of value) {
      if (!allowed.has(entry)) errors.push(`${path}: unsupported value '${entry}'`);
    }
  }
}

function validatePrimarySource(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path}: expected object`);
    return;
  }
  rejectUnknownKeys(
    value,
    ["organization", "publicationOrDataset", "datasetId", "url", "termsUrl", "dataYears", "checkedAt", "rights"],
    path,
    errors,
  );
  for (const key of ["organization", "publicationOrDataset"] as const) {
    if (typeof value[key] !== "string" || value[key].trim().length === 0) {
      errors.push(`${path}.${key}: required`);
    }
  }
  if (value.datasetId !== undefined && (typeof value.datasetId !== "string" || value.datasetId.trim().length === 0)) {
    errors.push(`${path}.datasetId: expected non-empty string`);
  }
  if (typeof value.url !== "string" || !HTTPS_PATTERN.test(value.url)) {
    errors.push(`${path}.url: expected HTTPS URL`);
  }
  if (value.termsUrl !== undefined && (typeof value.termsUrl !== "string" || !HTTPS_PATTERN.test(value.termsUrl))) {
    errors.push(`${path}.termsUrl: expected HTTPS URL`);
  }
  validateStringArray(value.dataYears, `${path}.dataYears`, errors, { nonEmpty: true });
  if (typeof value.checkedAt !== "string" || !ISO_DATE_PATTERN.test(value.checkedAt)) {
    errors.push(`${path}.checkedAt: expected ISO date`);
  }
  if (typeof value.rights !== "string" || !JAPAN_ZUE_RIGHTS.includes(value.rights as never)) {
    errors.push(`${path}.rights: unsupported rights state`);
  }
  if (value.rights === "allowed" && value.termsUrl === undefined) {
    errors.push(`${path}.termsUrl: required when rights=allowed`);
  }
}

export function validateJapanZueEvidenceItem(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["item: expected object"];
  rejectUnknownKeys(value, ["id", "source", "topicHint", "resolution", "primarySource", "primarySources", "mapping"], "item", errors);

  const idMatch = typeof value.id === "string" ? ITEM_ID_PATTERN.exec(value.id) : null;
  if (!idMatch) {
    errors.push("item.id: invalid stable ID");
  }
  if (typeof value.topicHint !== "string" || value.topicHint.trim().length === 0 || value.topicHint.length > 160) {
    errors.push("item.topicHint: expected 1-160 character reviewer summary");
  } else if (/\r|\n/.test(value.topicHint)) {
    errors.push("item.topicHint: line breaks are not allowed");
  }
  if (typeof value.resolution !== "string" || !JAPAN_ZUE_RESOLUTIONS.includes(value.resolution as never)) {
    errors.push("item.resolution: unsupported resolution");
  }

  if (!isRecord(value.source)) {
    errors.push("item.source: expected object");
  } else {
    rejectUnknownKeys(
      value.source,
      ["key", "edition", "chapter", "page", "continuationPages", "kind", "itemNumber"],
      "item.source",
      errors,
    );
    if (value.source.key !== JAPAN_ZUE_SOURCE_KEY) errors.push("item.source.key: must be japan-zue");
    if (typeof value.source.edition !== "string" || !/^\d{4}-\d{2}$/.test(value.source.edition)) {
      errors.push("item.source.edition: expected YYYY-YY edition");
    }
    const sourcePage = Number(value.source.page);
    if (!Number.isInteger(value.source.page) || sourcePage < 1) {
      errors.push("item.source.page: expected positive integer");
    }
    if (typeof value.source.kind !== "string" || !JAPAN_ZUE_EVIDENCE_KINDS.includes(value.source.kind as never)) {
      errors.push("item.source.kind: unsupported kind");
    }
    const idKind = idMatch?.[3] === "textstat" ? "text-stat" : idMatch?.[3];
    if (
      idMatch &&
      (idMatch[1] !== value.source.edition || Number(idMatch[2]) !== sourcePage || idKind !== value.source.kind)
    ) {
      errors.push("item.source: edition/page/kind does not match id");
    }
    if (value.source.chapter !== undefined && (!Number.isInteger(value.source.chapter) || Number(value.source.chapter) < 1)) {
      errors.push("item.source.chapter: expected positive integer");
    }
    if (value.source.continuationPages !== undefined) {
      if (
        !Array.isArray(value.source.continuationPages) ||
        value.source.continuationPages.some((page) => !Number.isInteger(page) || Number(page) <= sourcePage)
      ) {
        errors.push("item.source.continuationPages: expected pages after source.page");
      } else if (new Set(value.source.continuationPages).size !== value.source.continuationPages.length) {
        errors.push("item.source.continuationPages: duplicate pages");
      }
    }
    if (value.source.itemNumber !== undefined && typeof value.source.itemNumber !== "string") {
      errors.push("item.source.itemNumber: expected string");
    }
  }

  if (value.primarySource !== undefined && value.primarySources !== undefined) {
    errors.push("item: primarySource and primarySources are mutually exclusive");
  }
  if (value.primarySource !== undefined) validatePrimarySource(value.primarySource, "item.primarySource", errors);
  if (value.primarySources !== undefined) {
    if (!Array.isArray(value.primarySources) || value.primarySources.length === 0) {
      errors.push("item.primarySources: expected non-empty array");
    } else {
      value.primarySources.forEach((source, index) => validatePrimarySource(source, `item.primarySources[${index}]`, errors));
      const sourceKeys = value.primarySources
        .filter(isRecord)
        .map((source) => `${String(source.datasetId ?? "")}\u0000${String(source.url ?? "")}`);
      if (new Set(sourceKeys).size !== sourceKeys.length) errors.push("item.primarySources: duplicate sources");
    }
  }

  if (value.mapping !== undefined) {
    if (!isRecord(value.mapping)) {
      errors.push("item.mapping: expected object");
    } else {
      rejectUnknownKeys(
        value.mapping,
        ["metricKeys", "surveyIds", "categoryKey", "themeSlugs", "geoScopes", "contentRoles"],
        "item.mapping",
        errors,
      );
      for (const key of ["metricKeys", "surveyIds", "themeSlugs"] as const) {
        if (value.mapping[key] !== undefined) validateStringArray(value.mapping[key], `item.mapping.${key}`, errors);
      }
      if (value.mapping.categoryKey !== undefined && typeof value.mapping.categoryKey !== "string") {
        errors.push("item.mapping.categoryKey: expected string");
      }
      validateStringArray(value.mapping.geoScopes, "item.mapping.geoScopes", errors, {
        nonEmpty: true,
        allowed: JAPAN_ZUE_GEO_SCOPES,
      });
      if (value.mapping.contentRoles !== undefined) {
        validateStringArray(value.mapping.contentRoles, "item.mapping.contentRoles", errors, {
          allowed: JAPAN_ZUE_CONTENT_ROLES,
        });
      }
    }
  }

  return errors;
}

export function assertJapanZueEvidenceItems(values: readonly unknown[]): asserts values is readonly JapanZueEvidenceItem[] {
  const errors = values.flatMap((value, index) =>
    validateJapanZueEvidenceItem(value).map((error) => `items[${index}]: ${error}`),
  );
  if (errors.length > 0) throw new Error(`Japan Zue inventory validation failed:\n${errors.join("\n")}`);
}
