/**
 * 保存済み計測結果 (AuditRun JSON) の schema 検証の入口。
 * 本体は packages/ops/src/page-quality/validate-schema.ts。
 *
 * Usage: tsx .claude/scripts/page-quality/validate-schema.ts [path]
 */
import { main } from "../../../packages/ops/src/page-quality/validate-schema";

main();
