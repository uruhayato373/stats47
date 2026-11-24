#!/usr/bin/env tsx
// 入口。本体は apps/admin/scripts/build-ranking-type-images.ts (render-ranking-images.mjs・update-note-body-figures がこのパスで起動する)
import { main } from '../../../apps/admin/scripts/build-ranking-type-images';

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
