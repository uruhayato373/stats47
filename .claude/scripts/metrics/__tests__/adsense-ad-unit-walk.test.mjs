/**
 * collectAdUnitEntries のテスト — ad client 走査の唯一の実装であることを固定する。
 *
 * 背景 (2026-08-21): この走査は snapshot と google-admin audit に**二重実装**されていた。
 * 2026-08-04 に snapshot 側だけ「1 client の失敗で全体を落とさない」修正が入り、audit は
 * 素通しのままだったため、同じ資格情報で snapshot は成功しているのに audit は毎回
 * 「AdSense ad units: 0 件 (error)」という食い違いが続いた。片方だけ直せる形が原因なので、
 * 走査を 1 箇所に集めたうえで **他所に生えないこと自体をテストで縛る**。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { collectAdUnitEntries } from "../lib/adsense-ad-unit-walk.mjs";

const SCRIPTS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** @param clients { [name]: units[] | Error } — Error なら adunits.list が throw する */
function stubAdsense(clients, { adCode = null, failAdCode = false } = {}) {
  return {
    accounts: {
      adclients: {
        list: async () => ({ data: { adClients: Object.keys(clients).map((name) => ({ name })) } }),
        adunits: {
          list: async ({ parent }) => {
            const v = clients[parent];
            if (v instanceof Error) throw v;
            return { data: { adUnits: v } };
          },
          getAdcode: async () => {
            if (failAdCode) throw new Error("adcode is not supported for native ad units.");
            return { data: { adCode } };
          },
        },
      },
    },
  };
}

test("1 client が失敗しても、読めた client のユニットは返す", async () => {
  const adsense = stubAdsense({
    "accounts/pub-1/adclients/ca-pub-1": [{ name: "u1", reportingDimensionId: "1" }],
    "accounts/pub-1/adclients/partner-pub-1": new Error("Couldn't find the ad client"),
  });

  const { entries, skippedClients } = await collectAdUnitEntries(adsense, "accounts/pub-1");

  assert.equal(entries.length, 1);
  assert.equal(entries[0].unit.reportingDimensionId, "1");
  assert.equal(skippedClients.length, 1, "落ちた client を黙って捨てている");
  assert.match(skippedClients[0], /partner-pub-1/);
});

test("全 client が失敗したときだけ throw する (0 件を「ユニット無し」と誤読させない)", async () => {
  const adsense = stubAdsense({
    "accounts/pub-1/adclients/ca-pub-1": new Error("boom"),
    "accounts/pub-1/adclients/partner-pub-1": new Error("NOT_FOUND"),
  });

  await assert.rejects(() => collectAdUnitEntries(adsense, "accounts/pub-1"), /全 2 件の ad client/);
});

test("ad client が 0 件なら throw せず空を返す", async () => {
  const { entries, skippedClients } = await collectAdUnitEntries(stubAdsense({}), "accounts/pub-1");
  assert.deepEqual(entries, []);
  assert.deepEqual(skippedClients, []);
});

test("getAdcode の失敗はユニットを落とす理由にしない (native ad unit は正常系で通る)", async () => {
  const adsense = stubAdsense({ c1: [{ name: "u1", reportingDimensionId: "1" }] }, { failAdCode: true });
  const calls = [];

  const { entries } = await collectAdUnitEntries(adsense, "accounts/pub-1", {
    onAdCodeError: (unit) => calls.push(unit.name),
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].adCode, null);
  assert.deepEqual(calls, ["u1"], "失敗を呼び出し側へ知らせていない");
});

test("ページングを辿る", async () => {
  let call = 0;
  const adsense = {
    accounts: {
      adclients: {
        list: async () => ({ data: { adClients: [{ name: "c1" }] } }),
        adunits: {
          list: async () => {
            call += 1;
            return call === 1
              ? { data: { adUnits: [{ name: "u1", reportingDimensionId: "1" }], nextPageToken: "t" } }
              : { data: { adUnits: [{ name: "u2", reportingDimensionId: "2" }] } };
          },
          getAdcode: async () => ({ data: { adCode: null } }),
        },
      },
    },
  };

  const { entries } = await collectAdUnitEntries(adsense, "accounts/pub-1");
  assert.deepEqual(entries.map((e) => e.unit.reportingDimensionId), ["1", "2"]);
});

// ── SSOT: 走査を他所で再実装させない ────────────────────────────────────────

test("adunits.list を呼ぶのは共有 walk だけ (再実装の検知)", () => {
  // ★この 1 件が今回の不具合の再発防止そのもの。走査が 2 箇所に増えた瞬間、
  //   片方だけ直る余地が生まれる。fixture の `adunits: { list: ... }` は
  //   呼び出しの形 (`adclients.adunits.list(`) に一致しないので誤検知しない。
  const offenders = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.(mjs|cjs|js|ts)$/.test(e.name)) continue;
      // テストは fixture と、この検査自身が持つ文字列リテラルで必ず一致する (自己一致)。
      if (p.includes("__tests__")) continue;
      if (statSync(p).size > 400_000) continue;
      if (readFileSync(p, "utf-8").includes("adclients.adunits.list(")) offenders.push(p);
    }
  };
  // google-admin も .claude/scripts 配下なので、ここ 1 回で両方の消費者を覆う。
  walk(SCRIPTS_ROOT);

  const relative = [...new Set(offenders)].map((p) => p.split("\\").join("/").split("/.claude/")[1] ?? p);
  assert.deepEqual(
    relative,
    ["scripts/metrics/lib/adsense-ad-unit-walk.mjs"],
    "ad client の走査が共有 walk の外に生えている (二重実装は片方だけ直る事故を招く)",
  );
});
