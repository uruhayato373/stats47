/**
 * ライセンス定義 (SSOT)。
 * レビュー §利用許諾の推奨 / 節 K (更新・ライセンス違いの商品) に基づく。
 * どのライセンスでも「テンプレート・shape・SVG・元データ単体の再販売 / 再配布」は禁止 (resale: false)。
 */
import type { LicenseDefinition } from "./types";

const ESTAT_ATTRIBUTION =
  "出典：政府統計の総合窓口 (e-Stat) を基に stats47 作成。数値の集計・指標化・可視化を独自に実施。";

export const LICENSE_REGISTRY = {
  personal: {
    id: "personal",
    name: "個人ライセンス",
    scope: "購入者本人のみ利用可",
    clientWork: false,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
  "single-corporate": {
    id: "single-corporate",
    name: "1 法人ライセンス",
    scope: "購入した 1 法人内での業務利用可",
    clientWork: false,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
  "client-work": {
    id: "client-work",
    name: "クライアントワーク可ライセンス",
    scope: "クライアント納品物 (記事・資料・動画) への組み込み可",
    clientWork: true,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
  education: {
    id: "education",
    name: "教育機関ライセンス",
    scope: "授業・配布範囲を教育機関内に限定",
    clientWork: false,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
  "service-deliverable": {
    id: "service-deliverable",
    name: "役務成果物ライセンス",
    scope: "依頼者が案件ごとに合意した利用範囲",
    clientWork: true,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
  "free-sample": {
    id: "free-sample",
    name: "無料サンプルライセンス",
    scope: "品質・操作性の確認用途 (無料入口)",
    clientWork: false,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
  "support-included": {
    id: "support-included",
    name: "サポート付きライセンス",
    scope: "1 法人内利用 + 導入説明・一定期間の質問対応",
    clientWork: false,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
  customization: {
    id: "customization",
    name: "カスタマイズ付きライセンス",
    scope: "色・ロゴ・項目を反映した個別成果物の利用",
    clientWork: true,
    resale: false,
    attribution: ESTAT_ATTRIBUTION,
  },
} satisfies Record<string, LicenseDefinition>;

/** 有効なライセンス ID の union。 */
export type LicenseId = keyof typeof LICENSE_REGISTRY;

/** 有効なライセンス ID 一覧。 */
export const LICENSE_IDS: readonly string[] = Object.keys(LICENSE_REGISTRY);
