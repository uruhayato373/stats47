/**
 * タイル内ラベルの規約テスト (2026-07-31 のオーナー指摘 4 点の回帰固定)。
 *
 *   1. 北海道が「北海」になっていた   → 表示名は呼び元データではなくコードから作る
 *   2. フォントが大きすぎた            → 字の大きさは 1 マスタイルで決め全タイル共通
 *   3. 値が入っていなかった            → `showValue` の既定を true にした
 *   4. 上位3の県名と値が離れすぎ       → 値カラムは県名の実幅で決める
 */

import { describe, expect, it } from "vitest";

import { generateChoroplethSvg } from "../choropleth";

const NAMES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県",
  "埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県",
  "佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

/** 実データと同じく**末尾を一律に落とした**短縮名で渡す (北海道 → 「北海」)。 */
const shortened = (full: string) => full.replace(/[都道府県]$/, "");

const items = NAMES.map((full, i) => ({
  code: String(i + 1).padStart(2, "0"),
  name: shortened(full),
  value: 9320 - i * 100,
}));

const render = (opts: Record<string, unknown> = {}) =>
  generateChoroplethSvg(items, { title: "チーズ消費支出額", subtitle: "2024年", unit: "円", ...opts });

/** 表示テキスト (タグの中身) だけを拾う。 */
const texts = (svg: string) => [...svg.matchAll(/>([^<>]+)</g)].map((m) => m[1]);

describe("① 表示名は呼び元データに依存しない", () => {
  it("★呼び元が「北海」を渡しても「北海道」と描く", () => {
    const svg = render();
    expect(texts(svg)).toContain("北海道");
    expect(texts(svg)).not.toContain("北海");
  });

  it("都・府・県は落とす (東京・大阪・京都)", () => {
    const t = texts(render());
    expect(t).toContain("東京");
    expect(t).toContain("大阪");
    expect(t).toContain("京都");
  });

  it("★アクセシビリティ名と title は正式名称で出す", () => {
    const svg = render();
    expect(svg).toContain("<title>北海道：");
    expect(svg).toContain('aria-label="神奈川県 ');
  });
});

describe("② 字の大きさは全タイル共通", () => {
  const fontsOf = (svg: string, re: RegExp) =>
    new Set([...svg.matchAll(re)].map((m) => m[1]));

  it("★2 マス幅・2 マス高のタイルだけ大きくならない", () => {
    const svg = render();
    // 県名 (font-weight=700 の tspan) のサイズが 1 種類に収まる
    const nameFonts = fontsOf(svg, /<tspan[^>]*font-size="([\d.]+)"[^>]*font-weight="700">/g);
    expect(nameFonts.size).toBe(1);
  });

  it("値のサイズも 1 種類 (単位が入らないタイルだけ縮む余地は残す)", () => {
    const svg = render();
    const valueFonts = fontsOf(svg, /<tspan[^>]*font-size="([\d.]+)"[^>]*font-weight="600">/g);
    expect(valueFonts.size).toBe(1);
  });
});

describe("③ 値は既定で表示する", () => {
  it("★showValue を渡さなくても 47 タイルすべてに値が入る", () => {
    const svg = render();
    const values = [...svg.matchAll(/<tspan[^>]*font-weight="600">([^<]+)<\/tspan>/g)];
    expect(values).toHaveLength(47);
    expect(values[0][1]).toMatch(/[\d,]/);
  });

  it("showValue:false なら県名だけ (明示的に切れる)", () => {
    const svg = render({ showValue: false });
    expect([...svg.matchAll(/<tspan[^>]*font-weight="600">/g)]).toHaveLength(0);
  });
});

describe("④ 上位3は県名と値を近づける", () => {
  it("★値カラムは左カラムの右端ではなく県名の実幅で決まる", () => {
    const svg = render();
    const rows = [...svg.matchAll(
      /<text x="([\d.]+)"[^>]*font-size="17"[^>]*font-weight="600"[^>]*>(\d\. [^<]+)<\/text>/g,
    )];
    const vals = [...svg.matchAll(
      /<text x="([\d.]+)"[^>]*font-size="17"[^>]*font-weight="700"[^>]*text-anchor="end"[^>]*>/g,
    )];
    expect(rows).toHaveLength(3);
    expect(vals).toHaveLength(3);
    const nameX = Number(rows[0][1]);
    const valEndX = Number(vals[0][1]);
    // 最長県名 (神奈川県 = 5.65em @17px ≈ 96px) + 値幅 に見合う位置。
    // 左カラム右端 (約 320px) まで飛ばさない
    expect(valEndX - nameX).toBeLessThan(180);
  });

  it("3 行の値は同じ x で右揃え (桁が揃う)", () => {
    const svg = render();
    const xs = new Set(
      [...svg.matchAll(/<text x="([\d.]+)"[^>]*font-weight="700"[^>]*text-anchor="end"[^>]*>/g)].map(
        (m) => m[1],
      ),
    );
    expect(xs.size).toBe(1);
  });
});
