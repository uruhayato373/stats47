/**
 * データセット決定的 validator。
 * 仕様 §検証「47 都道府県の件数・コード・順位・欠損」「出典・年・単位」を機械検査する。
 */
import type { Dataset } from "../data/dataset";
import { PREFECTURE_CODES5 } from "../data/prefectures";

export interface DatasetIssue {
  readonly code: string;
  readonly message: string;
}

export interface DatasetValidation {
  readonly ok: boolean;
  readonly errors: readonly DatasetIssue[];
}

const CODE_SET: ReadonlySet<string> = new Set(PREFECTURE_CODES5);

export function validateDataset(ds: Dataset): DatasetValidation {
  const errors: DatasetIssue[] = [];

  // 件数
  if (ds.values.length !== 47) {
    errors.push({ code: "count", message: `values が 47 件でない: ${ds.values.length}` });
  }

  // コード集合 (欠落・余剰・重複)
  const seen = new Set<string>();
  for (const d of ds.values) {
    if (!CODE_SET.has(d.code5)) {
      errors.push({ code: "code-unknown", message: `未知の都道府県コード: ${d.code5}` });
    }
    if (seen.has(d.code5)) {
      errors.push({ code: "code-duplicate", message: `コード重複: ${d.code5}` });
    }
    seen.add(d.code5);
  }
  for (const c of CODE_SET) {
    if (!seen.has(c)) errors.push({ code: "code-missing", message: `コード欠落: ${c}` });
  }

  // 欠損の 0 埋め禁止: missing 理由があるのに value が数値、または null なのに理由なし
  for (const d of ds.values) {
    if (d.missing && d.value !== null) {
      errors.push({ code: "missing-zero", message: `${d.code5}: 欠損理由(${d.missing})なのに value が非 null` });
    }
    if (d.value === null && !d.missing) {
      errors.push({ code: "null-no-reason", message: `${d.code5}: value が null だが missing 理由なし` });
    }
    if (d.value !== null && !Number.isFinite(d.value)) {
      errors.push({ code: "value-nan", message: `${d.code5}: value が数値でない` });
    }
  }

  // メタ
  if (ds.indicator.trim() === "") errors.push({ code: "indicator-empty", message: "indicator が空" });
  if (ds.unit.trim() === "") errors.push({ code: "unit-empty", message: "unit が空" });
  if (!/^\d{4}$/.test(ds.year)) errors.push({ code: "year-format", message: `year が 4 桁でない: ${ds.year}` });
  if (ds.source.surveyName.trim() === "") errors.push({ code: "source-empty", message: "source.surveyName が空" });
  if (ds.source.url.trim() === "") errors.push({ code: "source-url-empty", message: "source.url が空" });

  return { ok: errors.length === 0, errors };
}
