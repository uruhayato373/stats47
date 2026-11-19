// 橋渡し: main の workflow (post-threads-scheduled.yml) が、投稿の前にこのパスのテストを走らせる。
// テストの本体は packages/ops/src/sns/__tests__/ へ移した。次の main へのリリースで workflow の定義が新しいパスに
// なったら、このファイルを消す (SCRIPTS-TO-PACKAGES-BRIDGE-01)。
require("../../../../packages/ops/src/sns/__tests__/threads-core.test.cjs");
