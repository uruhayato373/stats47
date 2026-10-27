import type { DefinitionSetData } from "../../types";

export const revenueDefinition: DefinitionSetData = {
  description: "地方公共団体の1会計年度におけるすべての収入のことです。",
  badge: "用語解説 & データ定義",
  groups: [
    {
      name: "自主財源",
      description: "自ら集められるお金（比率が高いほど財政が安定）",
      icon: "wallet",
      color: "emerald",
      items: [
        { name: "地方税", cat01: "C1111" },
        { name: "分担金及び負担金", cat01: "C1113" },
        { name: "使用料及び手数料", cat01: "C1114" },
        { name: "財産収入", cat01: "C1115" },
        { name: "寄附金", cat01: "C1116" },
        { name: "繰入金", cat01: "C1117" },
        { name: "繰越金", cat01: "C1118" },
        { name: "諸収入", cat01: "C1119" },
      ],
    },
    {
      name: "依存財源",
      description: "国などから交付・借入するお金",
      icon: "building",
      color: "amber",
      items: [
        { name: "地方譲与税", cat01: "C1121" },
        { name: "地方交付税", cat01: "C1122" },
        { name: "交通安全対策特別交付金", cat01: "C1123" },
        { name: "国庫支出金", cat01: "C1125" },
        { name: "都道府県支出金", cat01: "C1126" },
        { name: "地方債", cat01: "C1127" },
        { name: "特別区財政調整交付金", cat01: "C1128" },
        { name: "地方特例交付金等", cat01: "C1130" },
      ],
    },
  ],
  source: "e-Stat 地方財政状況調査 市町村別決算状況調",
};
