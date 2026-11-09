本文の数値と図の元データを作った作業用スクリプト (生成の記録)。入力は R2 app/stats/<魚種>-consumption-<expenditure|quantity>/values.json (18 魚種、作業時は /tmp/k22 と /tmp/k22q に保存)。
県庁所在地の経度・緯度は、並べ替えと相関に使うための概数を common.mjs に置いたもので、国土地理院などの公式値ではない。
build.mjs が data/*.json を書き、npx tsx .claude/scripts/blog/generate-article-charts.ts --slug fresh-seafood-east-west-boundary が図を描く。
