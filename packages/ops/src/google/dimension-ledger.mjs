/**
 * dimension-ledger — GA4 カスタムディメンション台帳
 * (.claude/rules/analytics-event-standards.md §2) の決定的パーサと突合。
 *
 * 台帳は「どのパラメータが登録を要し、今どの状態か」の SSOT だが、状態欄には
 * ❓要確認 が残っており「登録済みか未確認」= 効果判定の前提が未確定という穴があった。
 * このモジュールは台帳を機械的に読み、GA4 画面の実データと突合して ❓ を確定させる。
 *
 * pure module (I/O なし)。テスト: __tests__/dimension-ledger.test.mjs
 */

/** 台帳の状態欄 → 機械的な種別。 */
export const LEDGER_STATUS_KINDS = Object.freeze({
  REGISTERED: "registered",
  NEEDS_REGISTRATION: "needs-registration",
  NEEDS_VERIFICATION: "needs-verification",
  NOT_REQUIRED: "not-required",
  OPTIONAL: "optional",
  UNKNOWN: "unknown",
});

/** 状態欄の文字列を種別へ落とす (pure)。 */
export function classifyLedgerStatus(statusCell) {
  const s = String(statusCell ?? "");
  // 判定順が重要: 「要否×」と「任意」は登録不要側なので、登録済み判定より先に見ない
  // (「✅登録済」を含む行に「任意」が出ることはないが、順序に依存させない書き方にする)
  if (/要否×/.test(s)) return LEDGER_STATUS_KINDS.NOT_REQUIRED;
  if (/❓\s*要確認|要確認/.test(s)) return LEDGER_STATUS_KINDS.NEEDS_VERIFICATION;
  if (/⏳\s*要登録|要登録/.test(s)) return LEDGER_STATUS_KINDS.NEEDS_REGISTRATION;
  if (/✅\s*登録済|登録済/.test(s)) return LEDGER_STATUS_KINDS.REGISTERED;
  if (/^\s*\**\s*任意\s*\**\s*$/.test(s)) return LEDGER_STATUS_KINDS.OPTIONAL;
  return LEDGER_STATUS_KINDS.UNKNOWN;
}

/**
 * パラメータ欄からパラメータ名を抽出する (pure)。
 *
 * 全角/半角の括弧内に書かれたものは「任意」「GA4 標準」等の除外注記なので optional とする。
 * 例: "`nav_label` / `nav_surface`（`nav_href` は任意）" → required=[nav_label, nav_surface],
 *     optional=[nav_href]
 */
export function parseParamCell(cell) {
  const text = String(cell ?? "");
  const idents = (s) => Array.from(s.matchAll(/`([a-z][a-z0-9_]*)`/g)).map((m) => m[1]);
  // 括弧 (全角・半角) の中身を optional として切り出す
  const parenChunks = Array.from(text.matchAll(/[（(]([^）)]*)[）)]/g)).map((m) => m[1]);
  const optional = new Set(parenChunks.flatMap(idents));
  const all = idents(text);
  const required = all.filter((p) => !optional.has(p));
  return { required, optional: [...optional] };
}

/**
 * 台帳 markdown から §2 の表を読む (pure)。
 *
 * 「イベント | 関数 | 登録が要るパラメータ | 状態 | ドメイン所有」の 5 列表だけを対象にする。
 */
export function parseDimensionLedger(md) {
  const lines = String(md ?? "").split("\n");
  const entries = [];
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length !== 5) continue;
    const [eventCell, fnCell, paramCell, statusCell, ownerCell] = cells;
    // ヘッダ行・区切り行を除く
    if (/^イベント$/.test(eventCell) || /^-+$/.test(eventCell)) continue;
    // イベント欄はバッククォート付きのイベント名を含む行だけ
    const events = Array.from(eventCell.matchAll(/`([a-z][a-z0-9_]*)`/g)).map((m) => m[1]);
    if (events.length === 0) continue;
    const { required, optional } = parseParamCell(paramCell);
    entries.push({
      events,
      label: eventCell,
      fn: fnCell,
      required,
      optional,
      status: statusCell,
      statusKind: classifyLedgerStatus(statusCell),
      owner: ownerCell,
    });
  }
  return entries;
}

/**
 * 「GA4 に登録されている必要があるパラメータ」の集合を返す (pure)。
 * 登録不要 (要否×) と 任意 の行は除く。
 */
export function requiredDimensionParams(entries) {
  const out = new Set();
  for (const e of entries ?? []) {
    if (e.statusKind === LEDGER_STATUS_KINDS.NOT_REQUIRED) continue;
    if (e.statusKind === LEDGER_STATUS_KINDS.OPTIONAL) continue;
    for (const p of e.required) out.add(p);
  }
  return [...out];
}

/**
 * 台帳の状態と GA4 実データを突合する (pure)。
 *
 * @param {ReturnType<typeof parseDimensionLedger>} entries
 * @param {string[]} ga4Params GA4 のカスタム定義画面で観測できたパラメータ名
 * @returns {{rows: Array<object>, summary: object}}
 */
export function reconcileDimensions(entries, ga4Params) {
  const observed = new Set(ga4Params ?? []);
  const rows = [];
  for (const e of entries ?? []) {
    if (e.statusKind === LEDGER_STATUS_KINDS.NOT_REQUIRED || e.statusKind === LEDGER_STATUS_KINDS.OPTIONAL) {
      continue;
    }
    for (const param of e.required) {
      const present = observed.has(param);
      let verdict;
      if (e.statusKind === LEDGER_STATUS_KINDS.REGISTERED) {
        // 台帳が登録済みと言っているのに GA4 に無い = 台帳が誤っている (要是正)
        verdict = present ? "confirmed-registered" : "ledger-claims-registered-but-absent";
      } else if (e.statusKind === LEDGER_STATUS_KINDS.NEEDS_VERIFICATION) {
        // ❓要確認 を実データで確定させる
        verdict = present ? "verified-registered" : "verified-absent";
      } else if (e.statusKind === LEDGER_STATUS_KINDS.NEEDS_REGISTRATION) {
        verdict = present ? "already-registered" : "confirmed-absent";
      } else {
        verdict = present ? "present-unknown-status" : "absent-unknown-status";
      }
      rows.push({ events: e.events, param, ledgerStatus: e.status, statusKind: e.statusKind, present, verdict });
    }
  }
  const summary = {};
  for (const r of rows) summary[r.verdict] = (summary[r.verdict] ?? 0) + 1;
  return { rows, summary };
}

/**
 * GA4 画面のテキストから既知パラメータの出現を抽出する (pure)。
 *
 * 画面の表構造に依存させない (innerText 正規表現方式)。単語境界で照合するので
 * `ad_id` が `ad_idx` に誤マッチしない。
 */
export function extractObservedParams(pageText, knownParams) {
  const text = String(pageText ?? "");
  return (knownParams ?? []).filter((p) => new RegExp(`(?<![a-z0-9_])${p}(?![a-z0-9_])`).test(text));
}
