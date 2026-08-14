/**
 * 単位パッケージの公開エントリ。
 *
 * 単位の解釈 (次元・スケール・分母) の正典 = `unit-semantics.ts`、
 * その上に載る「2 系列を同じ軸に載せて良いか / 換算して良いか」の判定 = `unit-comparability.ts`。
 * 両方をここから公開する (`@stats47/data-configs/unit`)。
 */
export * from "./unit-semantics";
export * from "./unit-comparability";
