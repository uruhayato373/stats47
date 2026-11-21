/**
 * 手動取り込みの指標の出典ページの変化を前回と比べる (純関数)。
 * 検知だけを行い、値は変えない。新しい版の取り込みは指標ごとの provenance.restore の手順で行う。
 */
import { createHash } from 'node:crypto';

const ERA_BASE = { 令和: 2018, 平成: 1988 };

/** 指標の定義から、出典の更新を見る URL を決める。索引ページがあればそれを優先する。 */
export function sourceWatchUrl(source) {
  const config = source.config ?? {};
  const provenance = config.provenance ?? {};
  return provenance.publicationIndexUrl ?? config.source?.url ?? source.url ?? provenance.url ?? provenance.pdfUrl ?? null;
}

/** HTML から本文の文字だけを取り出す。script などページの飾りの変化で検知しないため */
export function normalizeHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 本文に出てくる最も新しい年。「令和7年版」も 2025 と数える。元年にも対応する */
export function latestYearMentioned(text) {
  let latest = null;
  const note = (year) => {
    if (year >= 1950 && year <= 2100 && (latest === null || year > latest)) latest = year;
  };
  for (const m of text.matchAll(/(20\d{2}|19\d{2})\s*年/g)) note(Number(m[1]));
  for (const m of text.matchAll(/(令和|平成)\s*(元|\d{1,2})\s*年/g)) {
    note(ERA_BASE[m[1]] + (m[2] === '元' ? 1 : Number(m[2])));
  }
  return latest;
}

/** 官公庁のページには Shift_JIS が残っているので、応答の宣言かページの meta から文字コードを決める */
export function decodeHtml(body, contentType) {
  const declared = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1]
    ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(body.subarray(0, 2048).toString('latin1'))?.[1]
    ?? 'utf-8';
  return new TextDecoder(/^(x-)?(shift_jis|sjis)$/i.test(declared) ? 'shift_jis' : declared).decode(body);
}

export function fingerprint({ body, contentType }) {
  const isHtml = /html|text/i.test(contentType ?? '');
  const text = isHtml ? normalizeHtml(decodeHtml(body, contentType)) : null;
  return {
    hash: createHash('sha256').update(text ?? body).digest('hex').slice(0, 16),
    latestYear: text === null ? null : latestYearMentioned(text),
  };
}

/**
 * 前回の記録と今回の取得を比べる。取得に失敗した URL は前回の指紋を残す (次に開けたときに比べられるように)。
 * kind: first / same / newer-year (新しい年の表記が増えた) / content (本文だけ変わった) / unreachable
 */
export function compareSource(previous, current, checkedAt) {
  if (!current.ok) {
    return {
      kind: 'unreachable',
      entry: { ...(previous ?? {}), status: current.status, checkedAt, failedSince: previous?.failedSince ?? checkedAt },
    };
  }
  const entry = { hash: current.hash, latestYear: current.latestYear, status: current.status, checkedAt };
  if (!previous?.hash) return { kind: 'first', entry: { ...entry, changedAt: null } };
  if (previous.hash === current.hash) return { kind: 'same', entry: { ...entry, changedAt: previous.changedAt ?? null } };
  const newer = current.latestYear !== null && previous.latestYear != null && current.latestYear > previous.latestYear;
  return { kind: newer ? 'newer-year' : 'content', entry: { ...entry, changedAt: checkedAt } };
}
