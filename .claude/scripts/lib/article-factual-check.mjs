// 記事の factual check の CLI の入口。本体は packages/ops/src/blog/lint/article-factual-check.mjs。
// pre-commit hook・issue-answer-publish・prepare-year-refresh-prompts がこのパスを名指しして起動する。
import { main } from "../../../packages/ops/src/blog/lint/article-factual-check.mjs";

main();
