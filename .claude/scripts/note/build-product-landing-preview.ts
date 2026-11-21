#!/usr/bin/env tsx
// 入口。本体は apps/web/scripts/build-product-landing-preview.ts (package.json の products:landing:* がこのパスで起動する)
import { run } from '../../../apps/web/scripts/build-product-landing-preview';

if (require.main === module) run();
