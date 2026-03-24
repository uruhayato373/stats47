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
        { name: "地方税", cat01: "C1111", rankingKey: "local-tax" },
        { name: "分担金及び負担金", cat01: "C1113", rankingKey: "shares-and-charges" },
        { name: "使用料及び手数料", cat01: "C1114", rankingKey: "fees-and-charges" },
        { name: "財産収入", cat01: "C1115", rankingKey: "property-income" },
        { name: "寄附金", cat01: "C1116", rankingKey: "donations" },
        { name: "繰入金", cat01: "C1117", rankingKey: "transfers-in" },
        { name: "繰越金", cat01: "C1118", rankingKey: "carried-forward" },
        { name: "諸収入", cat01: "C1119", rankingKey: "miscellaneous-revenue" },
      ],
    },
    {
      name: "依存財源",
      description: "国などから交付・借入するお金",
      icon: "building",
      color: "amber",
      items: [
        { name: "地方譲与税", cat01: "C1121", rankingKey: "local-transfer-tax" },
        { name: "地方交付税", cat01: "C1122", rankingKey: "local-allocation-tax" },
        { name: "交通安全対策特別交付金", cat01: "C1123" },
        { name: "国庫支出金", cat01: "C1125", rankingKey: "national-treasury-disbursements" },
        { name: "都道府県支出金", cat01: "C1126", rankingKey: "prefectural-disbursements" },
        { name: "地方債", cat01: "C1127", rankingKey: "local-bonds" },
        { name: "特別区財政調整交付金", cat01: "C1128" },
        { name: "地方特例交付金等", cat01: "C1130", rankingKey: "special-local-grants" },
      ],
    },
  ],
  source: "e-Stat 地方財政状況調査 市町村別決算状況調",
};
