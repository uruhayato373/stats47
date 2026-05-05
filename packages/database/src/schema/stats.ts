// stats テーブルは 2026-05-05 に 4 テーブルへ分割済み。
// このファイルは後方互換の型エイリアスのみ残す。

export type {
  StatsPrefecture as Observation,
  InsertStatsPrefecture as InsertObservation,
} from "./stats-prefecture";

export {
  selectStatsPrefectureSchema as selectObservationSchema,
  insertStatsPrefectureSchema as insertObservationSchema,
} from "./stats-prefecture";
