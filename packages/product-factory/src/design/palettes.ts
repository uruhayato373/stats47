/**
 * 配色パレット。**色覚多様性 (CVD) に配慮した 3 パレット以上**を持つ (仕様 §共通仕様)。
 * 3D・切断軸・過剰な色数・円グラフ乱用は禁止 (別モジュールの選定文法で担保)。
 */
export type PaletteKind = "sequential" | "diverging" | "categorical";

export interface Palette {
  readonly id: string;
  readonly name: string;
  readonly kind: PaletteKind;
  /** CVD (P/D/T 型) で識別しやすいことを確認済みのパレットのみ true。 */
  readonly cvdSafe: boolean;
  readonly colors: readonly string[];
}

export const PALETTES: readonly Palette[] = [
  {
    id: "blues-sequential",
    name: "連続 (青・単色ランプ)",
    kind: "sequential",
    cvdSafe: true,
    colors: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  },
  {
    id: "viridis-sequential",
    name: "連続 (Viridis)",
    kind: "sequential",
    cvdSafe: true,
    colors: ["#440154", "#443983", "#31688e", "#21918c", "#35b779", "#90d743", "#fde725"],
  },
  {
    id: "rdbu-diverging",
    name: "発散 (赤 ↔ 青)",
    kind: "diverging",
    cvdSafe: true,
    colors: ["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"],
  },
  {
    id: "okabe-ito",
    name: "カテゴリ (Okabe–Ito 8 色)",
    kind: "categorical",
    cvdSafe: true,
    colors: ["#000000", "#e69f00", "#56b4e9", "#009e73", "#f0e442", "#0072b2", "#d55e00", "#cc79a7"],
  },
];

export const DEFAULT_PALETTE_BY_KIND: Readonly<Record<PaletteKind, string>> = {
  sequential: "blues-sequential",
  diverging: "rdbu-diverging",
  categorical: "okabe-ito",
} as const;

export function paletteById(id: string): Palette {
  const found = PALETTES.find((p) => p.id === id);
  if (!found) throw new Error(`未知のパレット: ${id}`);
  return found;
}
