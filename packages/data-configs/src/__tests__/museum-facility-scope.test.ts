import { describe, expect, it } from "vitest";

import { aquariumCount } from "../metrics/aquarium-count";
import { botanicalGardenCount } from "../metrics/botanical-garden-count";
import { zooCount } from "../metrics/zoo-count";

describe("博物館系指標の対象範囲", () => {
  it.each([botanicalGardenCount, zooCount, aquariumCount])(
    "$key は登録・相当施設だけを数えることを表示名で明示する",
    (config) => {
      expect(config.source).toMatchObject({
        kind: "estat",
        statsDataId: "0003348770",
        cdCat02: "182",
      });
      expect(config.title).toContain("登録・相当");
      expect(config.subtitle).toContain("博物館類似施設を除く");
      expect(config.seoDescription).toContain("博物館類似施設は含みません");
    },
  );
});
