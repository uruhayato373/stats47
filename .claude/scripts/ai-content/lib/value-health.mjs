/**
 * value-health.mjs — 観測値が「順位として成立するか」を判定する純関数。
 *
 * ## なぜ要るか (2026-08-04 実測)
 *
 * ai-content の日次生成が `bowling-alley-public` (公共ボウリング場数) に
 * FAQ 5 問 + 県別解説 47 件を書いて公開した。だがこの指標は **2021 年の全 47 県が 0** で、
 * 順位が存在しない。生成されたテキスト自体は「全47都道府県において0施設となっており、
 * 突出して多い都道府県はありません」と正直に書いており捏造ではない。**嘘は無いが読者価値も無い**
 * ページを 1 枠使って作ったことが問題で、これは thin content のリスクでもある。
 *
 * 素通りしたのは、ai-content 側のゲート (`audit-ai-content.mjs` の `auditRow`) が
 * **生成物しか見ていない**ためだった。数値照合・括弧内数値・NG ワード・文字数は見るが、
 * 「そもそも論じるに足るデータか」は誰も見ていない。
 *
 * ブログ側には同等の検査が既にある (`packages/ai-content/src/services/blog-topic-gate.ts` の
 * `checkGroundedRows`)。記事を書き始める前に接地データを見て「全県が同じ値 — 差を論じる記事に
 * ならない」で弾く。**同じ母集団 (R2 の ranking 観測値) を扱う 2 つの生成系で、
 * 片方だけがこの検査を持っていなかった**。
 *
 * ## ブログ側との意図的な差 (drift ではない)
 *
 * | 検査 | blog (`checkGroundedRows`) | ai-content (ここ) | 理由 |
 * |---|---|---|---|
 * | 全件同値 / 県重複 / 47 超 / 0 行 | reject | **blocker** | どちらも不成立。判断は同じ |
 * | 40 行未満 | reject | **warn のみ** | 下記 |
 *
 * 40 行未満をブログは弾くが ai-content は弾かない。問うていることが違うため:
 *   - blog: 「この 1 本の記事を書けるか」→ 全国の傾向を論じる散文には県の網羅が要る
 *   - ai-content: 「この ranking ページに解説を付けられるか」→ ページは対象 N 県のために
 *     存在しており、11 県しかない指標でもその 11 県の解説は成立する
 *
 * 実測でも母集団が違う。active 2,176 件のうち 40 行未満は **34 件**あり、その多くは
 * `fishery-*` / `port-*` 系で内陸県が対象外なだけの正当なデータ。ここで弾くと 34 件が
 * 恒久的にキューから消える。**誤検知を出すゲートは運用で無効化される**ので、
 * 確実に「順位が成立しない」と言えるものだけを blocker にする。
 *
 * ## 正典側 (app/stats) にも同じ検査がある
 *
 * `packages/data-configs/src/shape-gate.ts` の `constant-value` / `zero-heavy` /
 * `negative-count` (2026-08-04 追加) が取り込み・週次監査・全件走査の 3 層で同じことを見る。
 * **判定を変えるときは両方を合わせる** (mjs から TS を import できないための重複実装。
 * `build-ai-content-queue.mjs` の `fetchActiveRankingKeys` と同じ既存パターン)。
 * 本ファイルは配信 (`app/ranking`) 側を見ており、正典側が直る前でも生成を止められる。
 *
 * ## 呼び出し元
 *
 * `build-ai-content-queue.mjs` — キュー再構築時に values.json を見て、blocker のある key を
 * `not-eligible` にする。**生成時ではなくキュー選定時に落とす**のが要点で、生成時に弾くと
 * その key は needs-regen のまま翌日また上位に並び、毎日 1 枠を食い潰す (livelock)。
 */

/** 都道府県の総数。これを超える行数は必ず異常 */
export const PREFECTURE_COUNT = 47;

/**
 * これ未満の行数は warn。
 *
 * 「47 でなければ違反」にはしない — 港湾・漁港系は内陸 8 県が対象外で 39 件前後が正常。
 * 正典: `packages/data-configs/src/shape-gate.ts` の area-coverage も同じ理由で既定 warn。
 */
export const THIN_COVERAGE_THRESHOLD = 40;

/**
 * 観測値の行から「順位として成立するか」を判定する。
 *
 * @param {ReadonlyArray<{areaCode?: string, areaName?: string, value?: unknown}>} rows
 *   ある 1 年の全県分の行 (values.json の partition.values)
 * @returns {{ok: boolean, blockers: {code: string, message: string}[], warns: {code: string, message: string}[]}}
 */
export function checkValueHealth(rows) {
  const blockers = [];
  const warns = [];
  const list = Array.isArray(rows) ? rows : [];

  if (list.length === 0) {
    blockers.push({ code: "no-rows", message: "観測値が 0 行" });
    return { ok: false, blockers, warns };
  }

  // 同じ県が複数行 = 分類軸の絞り忘れ。どの行が正なのか決められない。
  // 正典: .claude/rules/metric-config-standards.md 「分類軸は必ず 1 系列に絞る」
  const seen = new Map();
  for (const r of list) {
    const id = r?.areaCode ?? r?.areaName;
    if (id == null) continue;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  const duplicated = [...seen].filter(([, c]) => c > 1);
  if (duplicated.length > 0) {
    blockers.push({
      code: "duplicate-area",
      message: `同一県が複数行: ${duplicated.length} 県 (例 ${duplicated
        .slice(0, 3)
        .map(([id, c]) => `${id}×${c}`)
        .join(", ")}) — 分類軸の絞り忘れ`,
    });
  }

  if (list.length > PREFECTURE_COUNT) {
    blockers.push({
      code: "over-coverage",
      message: `${list.length} 行 (都道府県は ${PREFECTURE_COUNT} しかない)`,
    });
  } else if (list.length < THIN_COVERAGE_THRESHOLD) {
    // 対象外県がある指標 (港湾・漁港系) で正常にありうるので warn に留める
    warns.push({
      code: "thin-coverage",
      message: `${list.length} 行 (${THIN_COVERAGE_THRESHOLD} 未満・対象外県がある指標なら正常)`,
    });
  }

  const nums = list
    .map((r) => r?.value)
    .filter((v) => typeof v === "number" && Number.isFinite(v));

  if (nums.length === 0) {
    blockers.push({ code: "no-finite-value", message: "有限な数値が 1 件も無い" });
    return { ok: blockers.length === 0, blockers, warns };
  }

  // 全県が同じ値 = 順位が存在しない。「1 位はどこか」に答えられないので解説を書く意味がない。
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) {
    blockers.push({
      code: "no-variance",
      message: `全 ${nums.length} 県が同じ値 (${min}) — 順位が成立しない`,
    });
  }

  const missing = list.length - nums.length;
  if (missing > 0) {
    warns.push({ code: "null-value", message: `値が無い行が ${missing} 件` });
  }

  return { ok: blockers.length === 0, blockers, warns };
}

/**
 * values.json の payload から「最新年の行」を取り出す。
 *
 * partition の並び順に依存しない (yearCode の最大を採る)。R2 の payload は降順で入っている
 * ことが多いが、それを前提にすると並びが変わった日に静かに古い年を見る。
 *
 * @param {unknown} payload values.json をパースしたもの
 * @returns {{yearCode: string|null, rows: unknown[]}}
 */
export function latestPartition(payload) {
  const parts = payload?.partitions;
  if (!Array.isArray(parts) || parts.length === 0) return { yearCode: null, rows: [] };
  const latest = parts.reduce((a, b) =>
    Number(b?.yearCode ?? -Infinity) > Number(a?.yearCode ?? -Infinity) ? b : a,
  );
  return { yearCode: latest?.yearCode ?? null, rows: latest?.values ?? [] };
}
