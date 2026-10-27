import { fetchPrefectures } from "@stats47/area";

// 完全DBレス (docs/01_技術設計/02_データアーキテクチャ.md): prefecture master の SSOT は
// git TS の packages/area/src/data/prefectures.json (47 県, 静的 Reference)。`@stats47/area` 経由で読む。
// 旧版は D1 prefectures を読んでいたが Phase C で git TS に repoint した
// (D1 と code/name/順序が完全一致することを移行時に検証済)。

export interface Pref {
  code: string;
  name: string;
  region: string | null;
  displayOrder: number | null;
}

let cache: Pref[] | null = null;

/**
 * 47 都道府県 master を git TS (packages/area) から読み込む。
 * code は 5-digit ("01000"〜"47000")、配列順は JIS 順 (北海道→沖縄)。
 */
export function loadPrefectures(): Pref[] {
  if (cache) return cache;
  cache = fetchPrefectures().map((p, i) => ({
    code: p.prefCode,
    name: p.prefName,
    region: null,
    displayOrder: i,
  }));
  return cache;
}

// 2⇄5 桁変換は `@stats47/area` の to2DigitPrefCode / to5DigitPrefCode を使う (局所実装を持たない)
