#!/usr/bin/env node
/**
 * check-adsense-unit-mapping — コード側 AdSense slot と AdSense 側 ad unit の突き合わせ検査。
 *
 * 「どの広告ユニットに何をしたら何が動いたか」を測るには、コード側 slot 定数
 * (apps/web/src/lib/google-adsense/constants.ts) と AdSense 側 unit が 1:1 で解決できていな
 * ければならない。本スクリプトはその解決が崩れている箇所を決定的に列挙する。
 *
 * 実データとの突き合わせなので apps/web の vitest には置かない (workspace 境界を壊さないため)。
 * 形状の不変条件 (adUnitName 非空・slotId の形) は
 * apps/web/src/lib/google-adsense/__tests__/constants.test.ts が担当する。
 *
 * 使い方:
 *   node .claude/scripts/metrics/check-adsense-unit-mapping.mjs [YYYY-Www] [--strict] [--json] [--weeks N]
 *
 *   --strict  … error があれば exit 1 (CI / pre-commit 用)。既定は警告のみで exit 0
 *   --json    … 機械可読出力
 *   --weeks N … 「一度も配信されていない」を判定する遡り週数 (既定 4)
 *
 * 検査できないものは "判定不能" として明示する (欠測を「問題なし」に倒さない)。
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT } from "./lib/auth.mjs";
import { readCsv } from "./update-history-csv.mjs";
import { loadCodeAdSlots } from "./lib/code-ad-slots.mjs";
import { AD_UNITS_FILE, ADSENSE_UNIT_HISTORY_FILE } from "./lib/adsense-report-contract.mjs";

const SNAPSHOT_DIR = ".claude/skills/analytics/adsense-improvement/reference/snapshots";
const STATE_DIR = ".claude/state/metrics/adsense";

function parseArgs(argv) {
  const week = argv.find((a) => /^\d{4}-W\d{2}$/.test(a)) ?? null;
  const weeksArg = argv.find((a) => a.startsWith("--weeks="));
  const weeksIdx = argv.indexOf("--weeks");
  const weeks = weeksArg
    ? Number(weeksArg.split("=")[1])
    : weeksIdx >= 0
      ? Number(argv[weeksIdx + 1])
      : 4;
  return {
    week,
    strict: argv.includes("--strict"),
    json: argv.includes("--json"),
    weeks: Number.isFinite(weeks) && weeks > 0 ? weeks : 4,
  };
}

/** snapshot ディレクトリの中で最も新しい週を返す。 */
function latestSnapshotWeek(root) {
  const dir = join(root, SNAPSHOT_DIR);
  if (!existsSync(dir)) return null;
  const weeks = readdirSync(dir).filter((d) => /^\d{4}-W\d{2}$/.test(d)).sort();
  return weeks.length > 0 ? weeks[weeks.length - 1] : null;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const findings = [];
  const add = (level, code, message, detail = {}) =>
    findings.push({ level, code, message, ...detail });

  // ── コード側 slot ────────────────────────────────────────────────────────────
  let codeIndex;
  try {
    codeIndex = loadCodeAdSlots();
  } catch (e) {
    add("error", "code-slots-unreadable", `constants.ts を読めない: ${e.message || e}`);
    return report(findings, opts);
  }
  if (codeIndex.slots.length === 0) {
    add("error", "code-slots-empty", "コード側 slot 定数を 1 件も抽出できない (パーサ空振り or 構造変化)");
    return report(findings, opts);
  }

  // ── inventory (ad-units.csv) ─────────────────────────────────────────────────
  const week = opts.week ?? latestSnapshotWeek(PROJECT_ROOT);
  const invPath = week ? join(PROJECT_ROOT, SNAPSHOT_DIR, week, AD_UNITS_FILE) : null;
  const inv = invPath && existsSync(invPath) ? readCsv(invPath) : null;
  const invRows = inv?.rows ?? [];

  if (!inv) {
    add(
      "warn",
      "inventory-missing",
      `${week ?? "(週不明)"} に ${AD_UNITS_FILE} が無いため slot↔unit の突き合わせを判定できない。` +
        `fetch-adsense-snapshot を実行すると生成される`,
    );
  } else {
    const invBySlotId = new Map();
    const invByName = new Map();
    for (const r of invRows) {
      if (r.slot_id) invBySlotId.set(r.slot_id, r);
      if (r.display_name) {
        if (!invByName.has(r.display_name)) invByName.set(r.display_name, []);
        invByName.get(r.display_name).push(r);
      }
    }

    for (const s of codeIndex.slots) {
      if (!s.slotId) {
        if (!s.pending) {
          add("error", "empty-slot-without-pending", `${s.exportName} が空 slotId なのに pending 宣言が無い`, {
            exportName: s.exportName,
          });
        }
        continue; // pending は未発行が正常
      }
      const hit = invBySlotId.get(s.slotId);
      if (!hit) {
        add("error", "code-slot-not-in-inventory", `${s.exportName} の slotId ${s.slotId} が AdSense inventory に無い`, {
          exportName: s.exportName,
          slotId: s.slotId,
        });
        continue;
      }
      // adUnitName の突き合わせ (A2 で adUnitName を入れてから有効になる)
      if (s.adUnitName && hit.display_name && s.adUnitName !== hit.display_name) {
        add(
          "error",
          "ad-unit-name-mismatch",
          `${s.exportName}: コードの adUnitName "${s.adUnitName}" と AdSense の表示名 "${hit.display_name}" が不一致 (AdSense 側のリネームが必要)`,
          { exportName: s.exportName, codeName: s.adUnitName, adsenseName: hit.display_name, slotId: s.slotId },
        );
      }
      if (!s.adUnitName) {
        add("warn", "ad-unit-name-missing", `${s.exportName} に adUnitName が無い (AdSense 表示名は "${hit.display_name}")`, {
          exportName: s.exportName,
          adsenseName: hit.display_name,
        });
      }
    }

    // コードが参照しない unit (Auto ads・アンカー等)。情報として出す。
    const codeSlotIds = new Set(codeIndex.slots.map((s) => s.slotId).filter(Boolean));
    for (const r of invRows) {
      if (r.slot_id && !codeSlotIds.has(r.slot_id)) {
        add("info", "unmanaged-unit", `AdSense の "${r.display_name}" (slot ${r.slot_id}) はコードが参照していない`, {
          adsenseName: r.display_name,
          slotId: r.slot_id,
        });
      }
    }
  }

  // ── adUnitName の重複 (slotId が違うのに同名) ────────────────────────────────
  for (const [name, list] of codeIndex.byAdUnitName) {
    const slotIds = new Set(list.map((s) => s.slotId));
    if (slotIds.size > 1) {
      add("error", "duplicate-ad-unit-name", `adUnitName "${name}" が異なる slotId に付いている: ${[...slotIds].join(", ")}`, {
        adUnitName: name,
        slotIds: [...slotIds],
      });
    }
  }
  // 逆: 同一 slotId なのに adUnitName が違う (意図的 alias なら同名でなければならない)
  for (const [slotId, list] of codeIndex.bySlotId) {
    const names = new Set(list.map((s) => s.adUnitName).filter(Boolean));
    if (names.size > 1) {
      add("error", "shared-slot-name-conflict", `slotId ${slotId} を共用する定数の adUnitName が不一致: ${[...names].join(", ")}`, {
        slotId,
        adUnitNames: [...names],
      });
    }
  }

  // ── 配信実績 (history-units.csv) ─────────────────────────────────────────────
  const histPath = join(PROJECT_ROOT, STATE_DIR, ADSENSE_UNIT_HISTORY_FILE);
  if (!existsSync(histPath)) {
    add("warn", "unit-history-missing", `${ADSENSE_UNIT_HISTORY_FILE} が無いため配信実績を判定できない (metrics:digest で生成)`);
  } else {
    const hist = readCsv(histPath);
    const rows = hist?.rows ?? [];
    const weeks = [...new Set(rows.map((r) => r.week))].sort();
    const recent = new Set(weeks.slice(-opts.weeks));
    const recentRows = rows.filter((r) => recent.has(r.week));

    // 突き合わせ率 (unmanaged/orphan が多いと unit 単位の効果測定が成立しない)
    const byStatus = {};
    for (const r of recentRows) byStatus[r.match_status] = (byStatus[r.match_status] ?? 0) + 1;
    const matched = (byStatus.matched ?? 0) + (byStatus["legacy-name-matched"] ?? 0);
    if (recentRows.length > 0 && matched === 0) {
      add(
        "error",
        "no-matched-history-rows",
        `直近 ${recent.size} 週の unit history が 1 行も突き合わせできていない (内訳: ${JSON.stringify(byStatus)})`,
        { byStatus },
      );
    } else if (recentRows.length > 0) {
      const rate = matched / recentRows.length;
      if (rate < 0.8) {
        add("warn", "low-match-rate", `直近 ${recent.size} 週の突き合わせ率が ${(rate * 100).toFixed(0)}% (内訳: ${JSON.stringify(byStatus)})`, {
          rate,
          byStatus,
        });
      }
    }

    // 未配信 slot: コードに slotId があるのに直近 N 週の history に一度も出ていない
    const servedSlotIds = new Set(recentRows.map((r) => r.slot_id).filter(Boolean));
    const servedNames = new Set(recentRows.map((r) => r.unit_name).filter(Boolean));
    for (const s of codeIndex.slots) {
      if (!s.slotId) continue;
      const seenBySlot = servedSlotIds.has(s.slotId);
      const seenByName = s.adUnitName ? servedNames.has(s.adUnitName) : false;
      if (!seenBySlot && !seenByName) {
        add(
          "warn",
          "code-slot-never-served",
          `${s.exportName} (slot ${s.slotId}) が直近 ${recent.size} 週の配信実績に無い (未配信 or 突き合わせ不能)`,
          { exportName: s.exportName, slotId: s.slotId },
        );
      }
    }
  }

  return report(findings, opts, { week, codeSlots: codeIndex.slots.length, inventoryRows: invRows.length });
}

function report(findings, opts, meta = {}) {
  const errors = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");
  const infos = findings.filter((f) => f.level === "info");

  if (opts.json) {
    console.log(JSON.stringify({ ...meta, errors, warns, infos }, null, 2));
  } else {
    if (meta.week) {
      console.log(
        `[adsense-unit-mapping] week=${meta.week} コード側 slot=${meta.codeSlots} inventory=${meta.inventoryRows} 行`,
      );
    }
    for (const f of [...errors, ...warns, ...infos]) {
      const tag = f.level === "error" ? "❌" : f.level === "warn" ? "⚠️ " : "ℹ️ ";
      console.log(`${tag} [${f.code}] ${f.message}`);
    }
    console.log(`\nerror=${errors.length} warn=${warns.length} info=${infos.length}`);
    if (errors.length > 0 && !opts.strict) {
      console.log("(--strict を付けると error で exit 1 する)");
    }
  }

  if (opts.strict && errors.length > 0) process.exit(1);
}

main();
