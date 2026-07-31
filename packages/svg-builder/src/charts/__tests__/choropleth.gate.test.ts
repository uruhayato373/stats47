/**
 * generateChoroplethSvg の**実出力**が公開ゲート (`lintTileGridQuality`) を通ることを固定する。
 *
 * ゲート側の感度 (不変量ごとに壊すと落ちるか) は
 * `.claude/scripts/lib/__tests__/svg-lint.tile-grid.test.mjs` が担保する。こちらは
 * **生成器とゲートが同じデザインを指しているか** (配線) を見る。
 *
 * 2026-07-31 にタイルマップを 720×720 へ改訂した際、生成器とゲートを別々に更新して
 * 突き合わせていなかった。片方だけ更新すると「生成した瞬間に公開できない SVG」ができる。
 */

import { describe, expect, it } from "vitest";

// @ts-expect-error — .claude 配下の決定的ゲート (型定義を持たない .mjs)
import { lintTileGridQuality } from "../../../../../.claude/scripts/lib/svg-lint.mjs";
import { generateChoroplethSvg } from "../choropleth";

const NAMES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県",
  "埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県",
  "佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const items = (value: (i: number) => number) =>
  NAMES.map((name, i) => ({ code: String(i + 1).padStart(2, "0"), name, value: value(i) }));

describe("generateChoroplethSvg が公開ゲートを通る", () => {
  it("★47 県の実出力で error 0 / warning 0", () => {
    const svg = generateChoroplethSvg(items((i) => Math.round((60.4 - i * 0.8) * 10) / 10), {
      title: "テスト指標",
      unit: "件",
      showValue: true,
      showRankList: true,
    });
    const result = lintTileGridQuality("sample-tile-grid.svg", svg) as {
      errors: string[];
      warnings: string[];
    };
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("★整数だけの指標でも通る (桁揃えの分岐で構造が変わらない)", () => {
    const svg = generateChoroplethSvg(items((i) => 110700 - i * 1000), {
      title: "テスト指標",
      unit: "人",
      showValue: true,
      showRankList: true,
    });
    const result = lintTileGridQuality("sample-tile-grid.svg", svg) as {
      errors: string[];
      warnings: string[];
    };
    expect(result.errors).toEqual([]);
  });

  it("キャンバスは 720×720 (ゲートの不変量 #1 と一致する)", () => {
    const svg = generateChoroplethSvg(items(() => 1), { title: "t", unit: "件" });
    expect(svg).toContain('viewBox="0 0 720 720"');
  });
});
