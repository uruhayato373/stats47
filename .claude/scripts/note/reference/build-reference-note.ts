#!/usr/bin/env tsx
// 入口。本体は packages/ops/src/note/reference/build-reference-note.ts (skill・workflow・品質ゲートがこのパスで起動する)
import { main } from '../../../../packages/ops/src/note/reference/build-reference-note';

// 再現コマンドが指す CLI のパスはこの入口のものなので、ここで渡す (packages は .claude のパスを持たない)
if (require.main === module) main({ scriptPath: '.claude/scripts/note/reference/build-reference-note.ts' });
