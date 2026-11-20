// 橋渡し: main の workflow (regenerate-blog-svgs.yml) が、インラインの node からこのパスを import する。
// 本体は packages/ops/src/blog/lint/chart-provenance.mjs。ほかのコードはこのファイルを読まないこと。
// 次の main へのリリースで workflow の定義が新しいパスになったら、このファイルを消す (SCRIPTS-TO-PACKAGES-BRIDGE-01)。
export * from "../../../packages/ops/src/blog/lint/chart-provenance.mjs";
