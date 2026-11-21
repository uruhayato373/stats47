#!/usr/bin/env tsx
// 入口。本体は apps/web/scripts/release-analysis-pack.ts (package.json の products:analysis:release がこのパスで起動する)
import { main } from '../../../apps/web/scripts/release-analysis-pack';

if (require.main === module) void main();
