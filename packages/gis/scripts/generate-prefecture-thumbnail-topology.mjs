import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { feature } from "topojson-client";
import { topology } from "topojson-server";

const QUANTIZATION = 500_000;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(
  scriptDirectory,
  "../data/geoshape/prefecture.topojson",
);
const outputPath = resolve(
  scriptDirectory,
  "../../visualization/src/server/prefecture-topology.generated.json",
);

const sourceText = readFileSync(sourcePath, "utf8");
const sourceTopology = JSON.parse(sourceText);
const objectName = Object.keys(sourceTopology.objects)[0];
if (!objectName) {
  throw new Error("prefecture topology has no objects");
}

const prefectures = feature(
  sourceTopology,
  sourceTopology.objects[objectName],
);
const generatedTopology = topology({ pref: prefectures }, QUANTIZATION);
generatedTopology.id = sourceTopology.id;
generatedTopology.metadata = {
  ...sourceTopology.metadata,
  "stats47:sourceSha256": createHash("sha256")
    .update(sourceText)
    .digest("hex"),
  "stats47:quantization": QUANTIZATION,
};

const generatedText = `${JSON.stringify(generatedTopology)}\n`;
if (process.argv.includes("--check")) {
  if (readFileSync(outputPath, "utf8") !== generatedText) {
    throw new Error(
      "prefecture-topology.generated.json is stale; run npm run generate:thumbnail-topology --workspace packages/gis",
    );
  }
} else {
  writeFileSync(outputPath, generatedText);
}
