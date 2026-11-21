#!/usr/bin/env tsx
// 入口。本体は apps/admin/scripts/audit-chart-axes.ts (品質ゲート・workflow・skill がこのパスで起動する)
import { main } from '../../../apps/admin/scripts/audit-chart-axes';

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
