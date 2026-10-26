import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseLog, parsePlist, slotLabel, stripXmlComments } from "@/lib/server/mac-schedule";
import { cadenceOf, scheduleSortKey } from "@/lib/server/workflows";

/**
 * /ops/mac-schedule と /ops/workflows の読み方。
 * ★登録の一致判定は plist の時刻で比べる。2026-10-26 に土曜へ移した 3 本が、リポジトリだけ直して Mac では旧時刻のまま
 *   動いていた (この画面はそのずれを出すためにある)。plist の読み違いはそのまま「一致」の誤表示になる。
 */

const SCHEDULED = path.resolve(__dirname, "../../../../scripts/scheduled");

describe("parsePlist", () => {
  it("土曜ランナーの定義から Label・台本・土曜 07:00 を読む", () => {
    const def = parsePlist(fs.readFileSync(path.join(SCHEDULED, "com.stats47.weekly-saturday.plist"), "utf8"));
    expect(def.label).toBe("com.stats47.weekly-saturday");
    expect(def.script).toMatch(/scripts\/scheduled\/weekly-saturday\.sh$/);
    expect(def.slots).toEqual([{ weekday: 6, hour: 7, minute: 0 }]);
    expect(slotLabel(def.slots[0])).toBe("毎週土 07:00");
  });

  it("時刻が複数の定義 (配列) を全部読み、コメント内の <key> を拾わない", () => {
    const xml = `<plist><dict>
      <!-- <key>Label</key><string>wrong</string> <key>Hour</key><integer>99</integer> -->
      <key>Label</key><string>com.stats47.x</string>
      <key>ProgramArguments</key><array><string>/bin/bash</string><string>/a/x.sh</string></array>
      <key>StartCalendarInterval</key><array>
        <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>30</integer></dict>
        <dict><key>Hour</key><integer>21</integer><key>Minute</key><integer>30</integer></dict>
      </array>
      <key>RunAtLoad</key><true/>
    </dict></plist>`;
    const def = parsePlist(xml);
    expect(def.label).toBe("com.stats47.x");
    expect(def.slots.map(slotLabel)).toEqual(["毎日 09:30", "毎日 21:30"]);
    expect(def.runAtLoad).toBe(true);
  });
});

describe("stripXmlComments", () => {
  it("コメントを前から順に落とし、落とした跡に <!-- を組み上げない・閉じていないコメントは残りごと落とす", () => {
    expect(stripXmlComments("a<!-- x -->b<!-- y -->c")).toBe("abc");
    expect(stripXmlComments("<!<!-- x -->-- y -->z")).toBe("z");
    expect(stripXmlComments("<<!-- -->!-- k -->")).toBe("");
    expect(stripXmlComments("a<!-- never closed <key>Label</key>")).toBe("a");
  });
});

describe("parseLog", () => {
  it("最後の start に続く ok / FAILED を結果にし、終わりが無ければ実行中か途中停止とする", () => {
    const log = [
      "=== 2026-10-24T07:00:00+09:00 [measurement] start ===",
      "=== 2026-10-24T07:20:00+09:00 [measurement] FAILED rc=2 ===",
      "=== 2026-10-31T07:00:00+09:00 [measurement] start ===",
      "=== 2026-10-31T07:10:00+09:00 [measurement] ok ===",
    ].join("\n");
    expect(parseLog(log, "measurement")).toMatchObject({ result: "ok", startedAt: "2026-10-31T07:00:00+09:00", rc: null });
    expect(parseLog(log.split("\n").slice(0, 2).join("\n"), "measurement")).toMatchObject({ result: "failed", rc: 2 });
    expect(parseLog(`${log}\n=== 2026-11-07T07:00:00+09:00 [measurement] start ===`, "measurement").result).toBe("running");
    // 別の名前の行は拾わない (同じフォルダに段ごとのログが並ぶ)
    expect(parseLog(log, "note-metrics").result).toBe("none");
  });

  it("土曜ランナーの全体の失敗は落ちた段の名前を残す", () => {
    const log = "=== 2026-10-31T07:00:00+09:00 [weekly-saturday] start ===\n=== 2026-10-31T09:00:00+09:00 [weekly-saturday] FAILED: scout-asp weekly-audits ===";
    expect(parseLog(log, "weekly-saturday")).toMatchObject({ result: "failed", detail: "scout-asp weekly-audits" });
  });
});

describe("cadenceOf / scheduleSortKey", () => {
  const w = (cron: string) => ({ schedules: [{ cron, jst: "" }] });
  it("cron の日・曜日から毎月・毎週・毎日を決める", () => {
    expect(cadenceOf(w("0 3 5 * *"))).toBe("monthly");
    expect(cadenceOf(w("0 16 * * 5"))).toBe("weekly");
    expect(cadenceOf(w("30 17 * * *"))).toBe("daily");
    expect(cadenceOf({ schedules: [] })).toBe("none");
  });
  it("日本時間で動く順に並ぶ (金曜 16:00 UTC は土曜 01:00 JST なので、金曜 20:30 UTC より前・日曜より前)", () => {
    const keys = ["30 20 * * 4", "0 16 * * 5", "30 11 * * 0"].map((c) => scheduleSortKey(w(c)));
    // 木 20:30 UTC = 金 05:30 JST < 土 01:00 JST < 日 20:30 JST
    expect([...keys].sort((a, b) => a - b)).toEqual(keys);
  });
});
