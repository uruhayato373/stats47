import {
  JAPAN_ZUE_DETECTIONS,
  JAPAN_ZUE_EVIDENCE_KINDS,
  JAPAN_ZUE_SOURCE_KEY,
} from "./types";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ID_PATTERN = /^japan-zue-(\d{4}-\d{2})-p(\d{3})-(table|figure|textstat)(\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): string[] {
  const allowedSet = new Set(allowed);
  return Object.keys(value).filter((key) => !allowedSet.has(key)).map((key) => `${path}.${key}: unknown field`);
}

export function validateJapanZueCandidateDocument(value: unknown): string[] {
  if (!isRecord(value)) return ["document: expected object"];
  const errors = unknownKeys(
    value,
    ["schemaVersion", "sourceKey", "edition", "sourceBundleSha256", "pageRange", "pagesScanned", "candidates"],
    "document",
  );
  if (value.schemaVersion !== 1) errors.push("document.schemaVersion: must be 1");
  if (value.sourceKey !== JAPAN_ZUE_SOURCE_KEY) errors.push("document.sourceKey: must be japan-zue");
  if (typeof value.edition !== "string" || !/^\d{4}-\d{2}$/.test(value.edition)) {
    errors.push("document.edition: expected YYYY-YY edition");
  }
  if (typeof value.sourceBundleSha256 !== "string" || !SHA256_PATTERN.test(value.sourceBundleSha256)) {
    errors.push("document.sourceBundleSha256: invalid SHA-256");
  }

  let pageStart = 0;
  let pageEnd = -1;
  if (!isRecord(value.pageRange)) {
    errors.push("document.pageRange: expected object");
  } else {
    errors.push(...unknownKeys(value.pageRange, ["start", "end"], "document.pageRange"));
    pageStart = Number(value.pageRange.start);
    pageEnd = Number(value.pageRange.end);
    if (!Number.isInteger(value.pageRange.start) || !Number.isInteger(value.pageRange.end) || pageStart < 1 || pageEnd < pageStart) {
      errors.push("document.pageRange: invalid range");
    }
  }

  const expectedPages = pageEnd >= pageStart
    ? Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index)
    : [];
  if (!Array.isArray(value.pagesScanned) || value.pagesScanned.some((page) => !Number.isInteger(page))) {
    errors.push("document.pagesScanned: expected integer[]");
  } else if (JSON.stringify(value.pagesScanned) !== JSON.stringify(expectedPages)) {
    errors.push("document.pagesScanned: must contain every page exactly once in ascending order");
  }

  if (!Array.isArray(value.candidates)) {
    errors.push("document.candidates: expected array");
    return errors;
  }
  const ids: string[] = [];
  value.candidates.forEach((candidate, index) => {
    const prefix = `document.candidates[${index}]`;
    if (!isRecord(candidate)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    errors.push(...unknownKeys(candidate, ["id", "source", "locator", "detection", "contentSha256"], prefix));
    const idMatch = typeof candidate.id === "string" ? ID_PATTERN.exec(candidate.id) : null;
    if (!idMatch) errors.push(`${prefix}.id: invalid stable ID`);
    else ids.push(candidate.id as string);
    if (typeof candidate.detection !== "string" || !JAPAN_ZUE_DETECTIONS.includes(candidate.detection as never)) {
      errors.push(`${prefix}.detection: unsupported detection`);
    }
    if (typeof candidate.contentSha256 !== "string" || !SHA256_PATTERN.test(candidate.contentSha256)) {
      errors.push(`${prefix}.contentSha256: invalid SHA-256`);
    }

    if (!isRecord(candidate.source)) {
      errors.push(`${prefix}.source: expected object`);
    } else {
      errors.push(...unknownKeys(candidate.source, ["key", "edition", "chapter", "page", "continuationPages", "kind", "itemNumber"], `${prefix}.source`));
      const sourcePage = Number(candidate.source.page);
      if (candidate.source.key !== JAPAN_ZUE_SOURCE_KEY) errors.push(`${prefix}.source.key: must be japan-zue`);
      if (candidate.source.edition !== value.edition) errors.push(`${prefix}.source.edition: must match document edition`);
      if (!Number.isInteger(candidate.source.page) || sourcePage < pageStart || sourcePage > pageEnd) {
        errors.push(`${prefix}.source.page: outside pageRange`);
      }
      if (typeof candidate.source.kind !== "string" || !JAPAN_ZUE_EVIDENCE_KINDS.includes(candidate.source.kind as never)) {
        errors.push(`${prefix}.source.kind: unsupported kind`);
      }
      const expectedKind = idMatch?.[3] === "textstat" ? "text-stat" : idMatch?.[3];
      if (
        idMatch &&
        (idMatch[1] !== value.edition || Number(idMatch[2]) !== sourcePage || expectedKind !== candidate.source.kind)
      ) {
        errors.push(`${prefix}.source: edition/page/kind does not match id`);
      }
      if (candidate.source.continuationPages !== undefined) {
        if (
          !Array.isArray(candidate.source.continuationPages) ||
          candidate.source.continuationPages.some(
            (page) => !Number.isInteger(page) || Number(page) <= sourcePage || Number(page) > pageEnd,
          )
        ) {
          errors.push(`${prefix}.source.continuationPages: invalid continuation pages`);
        }
      }
    }

    if (!isRecord(candidate.locator)) {
      errors.push(`${prefix}.locator: expected object`);
    } else {
      errors.push(...unknownKeys(candidate.locator, ["markdownPath", "lineStart", "lineEnd"], `${prefix}.locator`));
      const expectedPath = `md/p${String(idMatch?.[2] ?? "").padStart(3, "0")}.md`;
      if (candidate.locator.markdownPath !== expectedPath) errors.push(`${prefix}.locator.markdownPath: does not match id page`);
      if (
        !Number.isInteger(candidate.locator.lineStart) ||
        !Number.isInteger(candidate.locator.lineEnd) ||
        Number(candidate.locator.lineStart) < 1 ||
        Number(candidate.locator.lineEnd) < Number(candidate.locator.lineStart)
      ) {
        errors.push(`${prefix}.locator: invalid line range`);
      }
    }
  });

  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) errors.push(`document.candidates: duplicate IDs ${[...new Set(duplicateIds)].sort().join(",")}`);
  return errors;
}
