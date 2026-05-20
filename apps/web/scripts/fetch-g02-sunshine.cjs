// G02 平年値（気候）メッシュ 2022 を全国分ダウンロードし、1km メッシュ別の
// 年間日照時間 (G02_071) を抽出して 1 つの JSON にまとめる。
// climate normals は decadal 更新なので実質一度きりの取得。

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const https = require("node:https");

const MESH_CODES = "3622 3623 3624 3631 3641 3653 3724 3725 3741 3823 3824 3831 3841 3926 3927 3928 3942 4027 4028 4040 4042 4128 4129 4142 4229 4230 4328 4329 4429 4529 4530 4531 4540 4629 4630 4631 4728 4729 4730 4731 4740 4828 4829 4830 4831 4839 4928 4929 4930 4931 4932 4933 4934 4939 5029 5030 5031 5032 5033 5034 5035 5036 5039 5129 5130 5131 5132 5133 5134 5135 5136 5137 5138 5139 5229 5231 5232 5233 5234 5235 5236 5237 5238 5239 5240 5332 5333 5334 5335 5336 5337 5338 5339 5340 5432 5433 5435 5436 5437 5438 5439 5440 5531 5536 5537 5538 5539 5540 5541 5636 5637 5638 5639 5640 5641 5738 5739 5740 5741 5839 5840 5841 5939 5940 5941 5942 6039 6040 6041 6139 6140 6141 6239 6240 6241 6243 6339 6340 6341 6342 6343 6439 6440 6441 6442 6443 6444 6445 6540 6541 6542 6543 6544 6545 6546 6641 6642 6643 6644 6645 6646 6647 6741 6742 6747 6748 6840 6841 6842 6847 6848".split(/\s+/);

const TMP = "/tmp/g02-work";
const OUT = "/tmp/g02-sunshine-all.json";

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 stats47-gis" } }, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return resolve(false); // 404 等は skip
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(true)));
      })
      .on("error", (e) => {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        reject(e);
      });
  });
}

async function main() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });

  // meshCode(8桁) -> 年日照時間(G02_071)
  const records = [];
  let ok = 0, miss = 0, totalMesh = 0;

  for (let i = 0; i < MESH_CODES.length; i++) {
    const mc = MESH_CODES[i];
    const url = `https://nlftp.mlit.go.jp/ksj/gml/data/G02/G02-22/G02-22_${mc}-jgd_GML.zip`;
    const zip = path.join(TMP, `${mc}.zip`);
    let got;
    try {
      got = await download(url, zip);
    } catch (e) {
      console.warn(`  ! ${mc}: ${e.message}`);
      miss++;
      continue;
    }
    if (!got) { miss++; continue; }

    const dir = path.join(TMP, mc);
    fs.mkdirSync(dir, { recursive: true });
    try {
      execSync(`unzip -o -q "${zip}" -d "${dir}"`);
    } catch {
      miss++;
      continue;
    }
    // geojson を探す
    let gj = null;
    const walk = (d) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (f.endsWith(".geojson")) gj = p;
      }
    };
    walk(dir);
    if (!gj) { miss++; continue; }

    const data = JSON.parse(fs.readFileSync(gj, "utf8"));
    for (const feat of data.features) {
      const p = feat.properties;
      const code = p.G02_001;
      const sun = p.G02_071; // 年合計日照時間
      if (code == null || sun == null) continue;
      records.push([String(code), Number(sun)]);
      totalMesh++;
    }
    ok++;
    // tmp を都度掃除 (ディスク圧迫回避)
    fs.rmSync(zip, { force: true });
    fs.rmSync(dir, { recursive: true, force: true });
    if ((i + 1) % 30 === 0) {
      console.log(`  進捗 ${i + 1}/${MESH_CODES.length} — タイル ${ok} 取得, メッシュ ${totalMesh.toLocaleString()}`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), unit: "G02_071 (年合計日照時間, 0.1h単位の生値)", meshes: records }));
  fs.rmSync(TMP, { recursive: true, force: true });

  console.log(`\n✅ 完了`);
  console.log(`   タイル: 取得 ${ok} / 欠落 ${miss} (計 ${MESH_CODES.length})`);
  console.log(`   メッシュ総数: ${totalMesh.toLocaleString()}`);
  console.log(`   出力: ${OUT} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)}MB)`);
  // 値の範囲を確認
  const vals = records.map((r) => r[1]).filter((v) => v > 0).sort((a, b) => a - b);
  if (vals.length) {
    console.log(`   日照値 範囲: min ${vals[0]} / 中央 ${vals[Math.floor(vals.length/2)]} / max ${vals[vals.length-1]}`);
  }
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
