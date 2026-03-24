export interface ScatterPoint {
  areaName: string;
  x: number;
  y: number;
}

export interface CorrelationPreviewData {
  titleX: string;
  titleY: string;
  unitX: string;
  unitY: string;
  points: ScatterPoint[];
  pearsonR: number;
}

export const previewDataCorrelation: CorrelationPreviewData = {
  titleX: "平均年収",
  titleY: "大学進学率",
  unitX: "万円",
  unitY: "%",
  pearsonR: 0.823,
  points: [
    { areaName: "北海道", x: 430, y: 45.2 },
    { areaName: "青森県", x: 370, y: 40.1 },
    { areaName: "岩手県", x: 380, y: 41.5 },
    { areaName: "宮城県", x: 460, y: 48.3 },
    { areaName: "秋田県", x: 360, y: 39.8 },
    { areaName: "山形県", x: 390, y: 42.0 },
    { areaName: "福島県", x: 400, y: 43.1 },
    { areaName: "茨城県", x: 450, y: 47.5 },
    { areaName: "栃木県", x: 440, y: 46.8 },
    { areaName: "群馬県", x: 430, y: 46.0 },
    { areaName: "埼玉県", x: 490, y: 52.3 },
    { areaName: "千葉県", x: 480, y: 51.0 },
    { areaName: "東京都", x: 622, y: 67.1 },
    { areaName: "神奈川県", x: 540, y: 58.5 },
    { areaName: "新潟県", x: 400, y: 43.8 },
    { areaName: "富山県", x: 430, y: 46.5 },
    { areaName: "石川県", x: 440, y: 48.0 },
    { areaName: "福井県", x: 420, y: 45.5 },
    { areaName: "山梨県", x: 410, y: 44.2 },
    { areaName: "長野県", x: 420, y: 45.0 },
    { areaName: "岐阜県", x: 430, y: 46.2 },
    { areaName: "静岡県", x: 450, y: 48.0 },
    { areaName: "愛知県", x: 510, y: 55.0 },
    { areaName: "三重県", x: 440, y: 47.0 },
    { areaName: "滋賀県", x: 460, y: 50.0 },
    { areaName: "京都府", x: 480, y: 56.5 },
    { areaName: "大阪府", x: 532, y: 54.8 },
    { areaName: "兵庫県", x: 480, y: 52.5 },
    { areaName: "奈良県", x: 450, y: 50.2 },
    { areaName: "和歌山県", x: 390, y: 42.5 },
    { areaName: "鳥取県", x: 370, y: 40.5 },
    { areaName: "島根県", x: 380, y: 41.0 },
    { areaName: "岡山県", x: 430, y: 47.0 },
    { areaName: "広島県", x: 460, y: 49.5 },
    { areaName: "山口県", x: 410, y: 44.8 },
    { areaName: "徳島県", x: 390, y: 43.0 },
    { areaName: "香川県", x: 410, y: 44.5 },
    { areaName: "愛媛県", x: 390, y: 42.8 },
    { areaName: "高知県", x: 370, y: 40.8 },
    { areaName: "福岡県", x: 460, y: 49.0 },
    { areaName: "佐賀県", x: 380, y: 41.8 },
    { areaName: "長崎県", x: 380, y: 41.2 },
    { areaName: "熊本県", x: 390, y: 42.5 },
    { areaName: "大分県", x: 390, y: 43.0 },
    { areaName: "宮崎県", x: 370, y: 40.0 },
    { areaName: "鹿児島県", x: 380, y: 41.5 },
    { areaName: "沖縄県", x: 370, y: 39.5 },
  ],
};
