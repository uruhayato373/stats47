export {
  type ExportSurveysSnapshotResult,
  exportSurveysSnapshot,
} from "./surveys-snapshot";
// ranking-items-snapshot (monolith snapshots/ranking-items/all.json) は Phase F (2026-05-30) で削除。
// runtime 未使用 (per-url の app/ranking/<key>/item.json 等が正)。再生成は per-url exporter。
// NOTE: ranking-download-snapshots / ranking-values-snapshot / ranking-normalized-values-snapshot
// are removed in Phase 6 (2026-05-27) — stats_* テーブル DROP に伴い不要。
// 観測値は packages/stats-r2 経由で R2 から直接配信。
