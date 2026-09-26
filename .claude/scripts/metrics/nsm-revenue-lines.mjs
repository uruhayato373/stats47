/**
 * 週次収益 (NSM) の ASP 別の行と商品の行を作る (純関数)。
 *
 * 収益化戦略 §1 は「週次収益 = AdSense 確定額 + アフィリエイト発生額 + 商品の実売額」と定めるが、
 * 週次 Issue は GA4 の表示・クリックしか出さず、ASP の成果を読んでいなかった (2026-09-25 NSM-ASP-REVENUE-01)。
 *
 * 入力と意味:
 * - `authLatest`  … 認証付き収集の最新結果 (`.claude/state/metrics/authenticated/latest.json`)。
 *                   ASP ごとの成否・認証切れ・観測日時の正典
 * - `a8Results`   … A8 の月別記録 (`.claude/state/metrics/affiliate/a8-results.json`)。
 *                   件数は発生 (`conversions`)・確定 (`approved`)、金額は確定額 (`revenueYen`) だけを持つ
 * - `moshimoResults` … もしもの期間記録 (`moshimo-results.json`)。発生額 `grossRevenueYen`・確定額 `revenueYen`
 * - afb の金額は非公開の証拠保管にしか無く、`authLatest` は件数だけを持つ。件数 0 の成功なら ¥0 と確定できる
 *
 * 欠測・認証切れ・古い観測は 0 円にしない。「判定不能」と理由を書く (`project_monetization_contract`)。
 */

/** 観測をこの日数より古いものは判定に使わない (週次の報告なので 1 週と数日の余裕) */
export const ASP_OBSERVATION_MAX_AGE_DAYS = 10;

const yen = (value) => `¥${Number(value ?? 0).toLocaleString("ja-JP")}`;

function ageDays(isoDate, asOf) {
  const at = new Date(isoDate);
  if (Number.isNaN(at.getTime())) return null;
  return Math.floor((asOf.getTime() - at.getTime()) / 86_400_000);
}

function findSource(authLatest, name) {
  return Array.isArray(authLatest?.sources) ? authLatest.sources.find((s) => s?.source === name) ?? null : null;
}

/** 収集の成否から「使えない理由」を返す。使えるなら null */
function unusableReason(source, asOf) {
  if (!source) return "認証付き収集の結果に記録が無い";
  if (source.status !== "pass") {
    const since = source.recovery?.blockedSince ? `（${source.recovery.blockedSince.slice(0, 10)} から）` : "";
    return source.code === "auth_required" ? `認証切れ${since}。再ログインが必要` : `収集失敗 ${source.code ?? "理由不明"}`;
  }
  const age = ageDays(source.observedAt, asOf);
  if (age == null) return "観測日時が読めない";
  if (age > ASP_OBSERVATION_MAX_AGE_DAYS) return `最終観測 ${source.observedAt.slice(0, 10)} が ${age} 日前 (上限 ${ASP_OBSERVATION_MAX_AGE_DAYS} 日)`;
  return null;
}

function a8Line(source, a8Results, asOf) {
  const reason = unusableReason(source, asOf);
  if (reason) return `- A8: **判定不能**（${reason}）`;
  const records = Array.isArray(a8Results?.records) ? a8Results.records : null;
  if (!records || records.length === 0) return "- A8: **判定不能**（a8-results.json に記録が無い）";
  const month = records.map((r) => r.month).filter(Boolean).sort().at(-1);
  const rows = records.filter((r) => r.month === month);
  const sum = (key) => rows.reduce((total, r) => total + (Number(r[key]) || 0), 0);
  return `- A8 (${month} 月累計・観測 ${source.observedAt.slice(0, 10)}): 発生 **${sum("conversions")} 件** / 確定 **${sum("approved")} 件・${yen(sum("revenueYen"))}**（A8 の記録は発生額を持たない）`;
}

function moshimoLine(source, moshimoResults, asOf) {
  const reason = unusableReason(source, asOf);
  if (reason) return `- もしも: **判定不能**（${reason}）`;
  const records = Array.isArray(moshimoResults?.records) ? moshimoResults.records : null;
  if (!records) return "- もしも: **判定不能**（moshimo-results.json に記録が無い）";
  if (moshimoResults.coverage?.complete !== true) return "- もしも: **判定不能**（取得範囲が完全でない coverage.complete=false）";
  const sum = (key) => records.reduce((total, r) => total + (Number(r[key]) || 0), 0);
  const period = moshimoResults.period ? `${moshimoResults.period.from}〜${moshimoResults.period.to}` : "期間不明";
  return `- もしも (${period}): 発生 **${sum("conversions")} 件・${yen(sum("grossRevenueYen"))}** / 確定 **${sum("approved")} 件・${yen(sum("revenueYen"))}**`;
}

function afbLine(source, asOf) {
  const reason = unusableReason(source, asOf);
  if (reason) return `- afb: **判定不能**（${reason}）`;
  const occurrence = source.quality?.occurrenceRows;
  const recognition = source.quality?.recognitionRows;
  if (!Number.isInteger(occurrence) || !Number.isInteger(recognition)) return "- afb: **判定不能**（件数が記録されていない）";
  if (occurrence === 0 && recognition === 0) {
    return `- afb (観測 ${source.observedAt.slice(0, 10)}): 発生 **0 件・¥0** / 確定 **0 件・¥0**`;
  }
  return `- afb (観測 ${source.observedAt.slice(0, 10)}): 発生 **${occurrence} 件** / 確定 **${recognition} 件**。金額は **判定不能**（非公開の証拠保管にだけあり、週次では未集計）`;
}

/**
 * @param {{ authLatest: object|null, a8Results: object|null, moshimoResults: object|null, asOf: Date }} input
 * @returns {string[]} ASP ごとの行 (A8 / もしも / afb の順)
 */
export function aspRevenueLines({ authLatest, a8Results, moshimoResults, asOf }) {
  if (!authLatest) return ["- ASP の成果: **判定不能**（認証付き収集の結果 latest.json が無い）"];
  return [
    a8Line(findSource(authLatest, "a8"), a8Results, asOf),
    moshimoLine(findSource(authLatest, "moshimo"), moshimoResults, asOf),
    afbLine(findSource(authLatest, "afb"), asOf),
  ];
}

/**
 * 商品の実売の行。実売台帳 (`.claude/state/products/sales-ledger.json`) は CLI で証拠付きの記録を足す形で、
 * KDP・ココナラの売上を自動で取り込む経路はまだ無い。よって台帳が空でも、販売中の商品があれば ¥0 ではなく未計測。
 * 以前は台帳が空なら「¥0」と書き、記録があっても存在しない `date` / `amountYen` を読んで常に ¥0 になっていた (2026-09-25)。
 *
 * @param {{ ledger: object|null, liveProductCount: number|null, weekStart: string, weekEnd: string }} input
 *   liveProductCount … 販売中と分かっている商品の数 (KDP の `kdp-weekly-publication.json` の s1Live + pilotLive)。
 *                      S1 シリーズと試行分だけなので全体の数ではなく下限。読めなければ null
 *   weekStart / weekEnd … 週の月曜・日曜 (YYYY-MM-DD)
 */
export function productRevenueLine({ ledger, liveProductCount, weekStart, weekEnd }) {
  const observations = Array.isArray(ledger?.observations) ? ledger.observations : null;
  if (observations == null) return "- 商品: **判定不能**（sales-ledger.json が無いか observations 配列が無い）";
  const inWeek = observations.filter(
    (o) => typeof o?.periodEnd === "string" && o.periodEnd >= weekStart && o.periodEnd <= weekEnd,
  );
  if (inWeek.length > 0) {
    const total = inWeek.reduce((sum, o) => sum + (Number(o.netRevenueYen) || 0), 0);
    return `- 商品: **${yen(total)}**（期間末が今週の実売記録 ${inWeek.length} 件の手取り合計）`;
  }
  if (liveProductCount == null) return "- 商品: **判定不能**（今週の実売記録 0 件で、販売中の商品数も読めない）";
  if (liveProductCount === 0) return "- 商品: **¥0**（販売中の商品なし）";
  return (
    `- 商品: **判定不能**（販売中が少なくとも ${liveProductCount} 点あるのに、今週の実売記録 0 件。` +
    "売上を台帳へ自動で入れる経路が無いので 0 円とは限らない）"
  );
}
