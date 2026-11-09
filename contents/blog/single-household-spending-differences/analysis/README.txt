本文の数値と図の元データを作った作業用スクリプト (生成の記録)。入力は e-Stat API の統計表 0004023614 / 0004023605 / 0004023612 / 0002190004 / 0002070009 の取得結果 (f1.mjs, f5.mjs, g2.mjs, g4.mjs が取得して作業用の JSON に保存し、build.mjs が読む)。
build.mjs が data/*.json と *.source.json を書き、npx tsx .claude/scripts/blog/generate-article-charts.ts --slug single-household-spending-differences が図を描く。import の相対パスは作業時の配置のままで、再実行するときはスクリプトを同じディレクトリに並べ直す。
