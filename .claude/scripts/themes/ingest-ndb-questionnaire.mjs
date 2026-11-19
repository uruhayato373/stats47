// 本体は packages/ops/src/themes/ingest-ndb-questionnaire。workflow・定期実行・品質ゲートの台帳がこのパスを名指しする
import { main } from "../../../packages/ops/src/themes/ingest-ndb-questionnaire.mjs";

await main();
