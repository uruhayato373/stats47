/**
 * generateChoroplethSvg の highlightCode オプション（単一県ハイライト枠）のテスト。
 *
 * - "43" / "43000" いずれの表記も `ChoroplethItem.code` と同じ規則で正規化されること
 * - 指定した県のタイルにだけ枠線が 1 本描画されること
 * - 未指定時は枠線が描画されないこと
 * - キャンバスサイズ (720×720) や公開ゲートに影響しないこと
 */
import { describe, expect, it } from "vitest";

// @ts-expect-error — .claude 配下の決定的ゲート (型定義を持たない .mjs)
import { lintTileGridQuality } from "../../../../../.claude/scripts/lib/svg-lint.mjs";
import { generateChoroplethSvg, type ChoroplethItem } from "../choropleth";

const NAMES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県",
  "埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県",
  "佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

function makeItems(): ChoroplethItem[] {
  return NAMES.map((name, i) => ({
    code: String(i + 1).padStart(2, "0"),
    name,
    value: 60.4 - i * 0.8,
  }));
}

// 先頭の2スペースまで含めて一致させる (highlightOverlay の全文字列と厳密に一致させ、
// stripRing で除去した結果が「オプション未指定時」の空文字列と完全一致するようにする)。
const HIGHLIGHT_RING_RE = / {2}<rect[^>]*fill="none"[^>]*stroke="#16243a"[^>]*stroke-width="3"\/>/g;

describe("generateChoroplethSvg highlightCode", () => {
  it("省略時は枠線が描画されない", () => {
    const svg = generateChoroplethSvg(makeItems(), { title: "t", unit: "件" });
    expect(svg.match(HIGHLIGHT_RING_RE) ?? []).toHaveLength(0);
  });

  it("5桁コード (43000) でも枠線が 1 本だけ描画される", () => {
    const svg = generateChoroplethSvg(makeItems(), {
      title: "t",
      unit: "件",
      highlightCode: "43000",
    });
    expect(svg.match(HIGHLIGHT_RING_RE) ?? []).toHaveLength(1);
  });

  it("2桁コード (43) でも同じ枠線が 1 本だけ描画される", () => {
    const svg2 = generateChoroplethSvg(makeItems(), {
      title: "t",
      unit: "件",
      highlightCode: "43",
    });
    const svg5 = generateChoroplethSvg(makeItems(), {
      title: "t",
      unit: "件",
      highlightCode: "43000",
    });
    expect(svg2.match(HIGHLIGHT_RING_RE)).toEqual(svg5.match(HIGHLIGHT_RING_RE));
  });

  it("存在しないコードでは枠線を描画しない (空中の線を作らない)", () => {
    const svg = generateChoroplethSvg(makeItems(), {
      title: "t",
      unit: "件",
      highlightCode: "99",
    });
    expect(svg.match(HIGHLIGHT_RING_RE) ?? []).toHaveLength(0);
  });

  it("塗り (fill) は変えず、タイル数・公開ゲートに影響しない", () => {
    const items = makeItems();
    const plain = generateChoroplethSvg(items, { title: "t", unit: "件", showValue: true, showRankList: true });
    const highlighted = generateChoroplethSvg(items, {
      title: "t",
      unit: "件",
      showValue: true,
      showRankList: true,
      highlightCode: "43",
    });
    // ハイライト用の1行を除けば、タイルの塗り・テキストは変わらない
    const stripRing = (s: string) => s.replace(HIGHLIGHT_RING_RE, "");
    expect(stripRing(highlighted)).toBe(plain);

    const result = lintTileGridQuality("sample-tile-grid.svg", highlighted) as {
      errors: string[];
      warnings: string[];
    };
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(highlighted).toContain('viewBox="0 0 720 720"');
  });
});
