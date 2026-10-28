import "server-only";

import fs from "node:fs";
import path from "node:path";

import { datasetPath } from "../../../../config/datasets.mjs";
import { projectRoot } from "./project-root";

/** 参考サイトの台帳 (data/design-references/references.json)。形は config/schema/design.references.schema.json */
export type DesignAdoption = {
  part: string;
  what: string;
  state: "done" | "todo" | "proposed" | "rejected";
  reflectedIn?: string;
};

export type DesignReference = {
  id: string;
  name: string;
  url: string;
  source?: string;
  status: "adopted" | "trial" | "rejected";
  decidedAt: string;
  decision: string;
  scope?: string;
  conditions?: string[];
  screens?: string;
  measurements?: string;
  spec?: string;
  adoptions: DesignAdoption[];
  /** screens の中の画像 (リポジトリ直下からの相対パス) */
  screenFiles: string[];
};

/** 撮影の画像を配る範囲。ルートはこの下だけを読む */
export const SCREENS_ROOT = "assets/design-reference";

const IMAGE_EXT = new Set([".webp", ".png", ".jpg", ".jpeg"]);

export function designReferences(): DesignReference[] {
  const root = projectRoot();
  const doc = JSON.parse(fs.readFileSync(path.join(root, datasetPath("design.references")), "utf8")) as {
    references: Omit<DesignReference, "screenFiles">[];
  };
  return doc.references.map((ref) => {
    let screenFiles: string[] = [];
    if (ref.screens) {
      const dir = path.join(root, ref.screens);
      if (fs.existsSync(dir)) {
        screenFiles = fs
          .readdirSync(dir)
          .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
          .sort()
          .map((name) => `${ref.screens}/${name}`);
      }
    }
    return { ...ref, screenFiles };
  });
}
