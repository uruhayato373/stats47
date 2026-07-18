/**
 * denominator 系 metric config から「自分の分母 family に対応する normalizationOptions」を
 * 取り除く純粋ロジック (T3-RANKING-NORM-DATA-CLEAN-01)。
 *
 * 背景: isBaseMetric() ガード導入以前に自動付与されたデータが git TS config に残存しており、
 * 例えば total-population に per_population (「人口10万人あたりの人口」) が付いている。
 * DENOMINATOR_KEYS 該当 metric から、その metric 自身が属する分母 family の type だけを除外する
 * (total-population の per_area = 人口密度 のような意味のある組み合わせは残す)。
 *
 * 実行入口: packages/ranking/src/scripts/drop-invalid-norm-options.ts (--dry-run 既定)
 */
import { DENOMINATOR_KEYS } from "./is-base-metric";

/** 分母 family → その family の metric に付いていたら無意味になる normalization type */
const FAMILY_INVALID_TYPE: ReadonlyArray<{ pattern: RegExp; type: string }> = [
  { pattern: /^total-population/, type: "per_population" },
  { pattern: /^(total-area|habitable-area|habitable-land-area)/, type: "per_area" },
  { pattern: /^(households|general-households|private-households)$/, type: "per_household" },
];

/**
 * この metric key が denominator 系である場合、除外すべき normalization type を返す。
 * denominator 系でなければ null。
 */
export function invalidNormTypeForKey(key: string): string | null {
  if (!DENOMINATOR_KEYS.has(key)) return null;
  for (const { pattern, type } of FAMILY_INVALID_TYPE) {
    if (pattern.test(key)) return type;
  }
  return null;
}

export interface DropResult {
  readonly source: string;
  readonly dropped: number;
  readonly remaining: number;
}

/**
 * metric config TS ソース文字列から、指定 type の normalizationOptions 要素を取り除く。
 * 残要素ゼロになった場合は "normalizationOptions" プロパティごと削除する (空配列を残さない)。
 * 対象が無ければソースを変更しない。
 */
export function dropNormOptionsOfType(source: string, type: string): DropResult {
  const propMatch = source.match(/^(\s*)"normalizationOptions":\s*\[/m);
  if (!propMatch || propMatch.index === undefined) {
    return { source, dropped: 0, remaining: 0 };
  }
  const arrayStart = propMatch.index + propMatch[0].length - 1; // "[" の位置
  const arrayEnd = findMatching(source, arrayStart, "[", "]");
  if (arrayEnd < 0) return { source, dropped: 0, remaining: 0 };

  const inner = source.slice(arrayStart + 1, arrayEnd);
  const chunks = splitTopLevelObjects(inner);
  const kept = chunks.filter((c) => !new RegExp(`"type":\\s*"${type}"`).test(c));
  const dropped = chunks.length - kept.length;
  if (dropped === 0) return { source, dropped: 0, remaining: chunks.length };

  if (kept.length === 0) {
    // プロパティごと削除 (行頭インデント〜 "]," または "]" + 改行 まで)
    const propStart = propMatch.index;
    let propEnd = arrayEnd + 1;
    if (source[propEnd] === ",") propEnd++;
    if (source[propEnd] === "\n") propEnd++;
    return {
      source: source.slice(0, propStart) + source.slice(propEnd),
      dropped,
      remaining: 0,
    };
  }

  const indent = propMatch[1];
  const rebuiltInner = `\n${kept.map((c) => `${indent}  ${c.trim()}`).join(",\n")},\n${indent}`;
  return {
    source: source.slice(0, arrayStart + 1) + rebuiltInner + source.slice(arrayEnd),
    dropped,
    remaining: kept.length,
  };
}

/** open 位置の括弧に対応する close 位置を返す (文字列リテラルは考慮不要な生成 config 前提) */
function findMatching(text: string, openIndex: number, open: string, close: string): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** 配列 inner テキストをトップレベルの {…} 単位に分割する */
function splitTopLevelObjects(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(inner.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}
