/**
 * buzz-map spec（1カード/1動画 = 1 spec JSON）
 *
 * spec ファイルは `apps/remotion/src/features/buzz-map/specs/*.json` に置き、
 * `npx remotion still/render <compId> --props=<specパス>` でそのまま inputProps になる。
 * 規約・テーマカタログは `.claude/rules/buzz-map-standards.md`。
 */

/** 凡例1行（型A）。key は data.values の値と対応する */
export interface BuzzMapLegendRow {
  key: string;
  label: string;
  /** "accent" | "accent2" | "land" | 生hex。accent は spec.accent で解決 */
  fill: string;
  /** 件数（色だけに頼らないための必須ラベル。省略時は data から自動集計） */
  count?: number;
  /**
   * 凡例マーカーの形状（型E 合成カードで塗り/点/線が混在するとき行単位で指定）。
   * 省略時は spec.type から従来どおり導出（A/E=四角, C=円, D=バー）。
   */
  marker?: "fill" | "point" | "line";
}

export interface BuzzMapSpeedSegment {
  /** この年まで */
  until: number;
  /** 再生速度（年/秒）。転換点以降は小さくして減速させる */
  yearsPerSec: number;
}

export interface BuzzMapSpec {
  /** 出力ファイル名等に使う識別子（kebab-case） */
  id: string;
  /**
   * A=静止画二値/少区分, B=時系列アニメ（塗り）, C=点プロット（白地図＋accent 点）,
   * D=線ネットワーク（白地図＋accent 線。years+lineYearProp 併用で時系列リール可）,
   * E=レイヤー合成（塗り data.values ＋ 点 data.points ＋ 線 data.linesAsset の任意組・静止画）
   */
  type: "A" | "B" | "C" | "D" | "E";
  /** "pref" | "muni" | "muni:NN"（NN=都道府県コード2桁で県トリム） */
  level: string;
  title: string;
  /** タイトルの手動改行（最大2行・助詞の前で切る）。指定時は title より優先 */
  titleLines?: string[];
  subtitle: string;
  /** 出典行（複数行）。最終行はサイトドメイン */
  source: string[];
  /** 強調色テーマ: social=#d55181（人口・社会系） / infra=#2a78d6（インフラ・経済系） */
  accent?: "social" | "infra";
  legend: {
    title: string;
    /** 型A: 区分行。型B: 省略（ランプ凡例を自動描画） */
    rows?: BuzzMapLegendRow[];
  };
  /**
   * データ。型A: code → 凡例 row の key。型B: code → { year: value }。
   * 型C: 凡例 row の key → [lon, lat][]（プロットする点の経緯度列）。
   * code は 都道府県=2桁 / 市区町村=N03_007 5桁
   */
  data: {
    values?: Record<string, string>;
    series?: Record<string, Record<string, number>>;
    /** 型C: 凡例 rowKey → 点の [経度, 緯度] 配列 */
    points?: Record<string, [number, number][]>;
    /** 型D: 線データの staticFile パス（topojson or GeoJSON。例 buzz-map/assets/highway-network.topojson） */
    linesAsset?: string;
    /** code → 表示名（型Bサマリーの最大・最小ラベル用。省略時はコードを表示） */
    names?: Record<string, string>;
  };
  /** 型C/E のみ。点の半径（@1080 基準 px。省略時 4） */
  pointRadius?: number;
  /** 型D のみ。線フィーチャの「年」属性名（例 N06_002）。指定時は years と併せ時系列リール可 */
  lineYearProp?: string;
  /** 型D/E のみ。線の太さ（@1080 基準 px。省略時 2） */
  lineWidth?: number;
  /** 型E のみ。点レイヤーの色トークン（"accent"|"accent2"|生hex。省略時 accent）。塗りと色を分ける */
  pointFill?: string;
  /** 型E のみ。線レイヤーの色トークン（同上）。塗り=accent と分けるため既定は overlay 側で accent2 推奨 */
  lineStroke?: string;
  /** 型Bのみ */
  years?: { from: number; to: number };
  /** 型Bのみ。省略時は全区間 2年/秒 */
  speed?: BuzzMapSpeedSegment[];
  /** 型Bのみ。ランプの値域と凡例 */
  ramp?: { domain: [number, number]; legendTitle: string; ticks: number[]; unit?: string };
  /** 型Bのみ。ラスト静止サマリー（最大・最小の直接ラベル） */
  summary?: { max?: boolean; min?: boolean };
  /** 型Bのみ。ラスト静止秒数（既定 2） */
  holdSeconds?: number;
}
