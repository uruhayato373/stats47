import {
  BarChart3,
  Landmark,
  PieChart,
  TrendingDown,
} from "lucide-react";

import type { SlideData } from "../../types";

export const fiscalIndicatorsSlides: SlideData[] = [
  {
    id: 1,
    category: "INTRODUCTION",
    title: "財政健全化法の全体像",
    subtitle: "地方公共団体の財政の健全化に関する法律",
    content: (
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-blue-800 leading-relaxed text-lg font-medium">
            「隠れた借金」を可視化し、早期に財政悪化を食い止めるための法律です。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-white rounded-xl border shadow-sm">
            <div className="text-blue-600 font-bold text-xl mb-1">可視化</div>
            <p className="text-xs text-muted-foreground">連結ベースの指標導入</p>
          </div>
          <div className="p-4 bg-white rounded-xl border shadow-sm">
            <div className="text-blue-600 font-bold text-xl mb-1">早期発見</div>
            <p className="text-xs text-muted-foreground">健全化基準の設定</p>
          </div>
          <div className="p-4 bg-white rounded-xl border shadow-sm">
            <div className="text-blue-600 font-bold text-xl mb-1">徹底公開</div>
            <p className="text-xs text-muted-foreground">住民への情報開示義務</p>
          </div>
        </div>
      </div>
    ),
    accent: "bg-blue-600",
  },
  {
    id: 2,
    category: "INDICATORS",
    title: "4つの健全化判断比率",
    subtitle: "財政の「健康診断」のための4つのモノサシ",
    content: (
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "実質赤字比率", icon: <TrendingDown className="h-5 w-5" />, desc: "一般会計の赤字", color: "text-red-500" },
          { label: "連結実質赤字比率", icon: <PieChart className="h-5 w-5" />, desc: "全会計合算の赤字", color: "text-orange-500" },
          { label: "実質公債費比率", icon: <Landmark className="h-5 w-5" />, desc: "借金の返済負担", color: "text-blue-500" },
          { label: "将来負担比率", icon: <BarChart3 className="h-5 w-5" />, desc: "将来払う負債", color: "text-purple-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border">
            <div className={`${item.color} p-2 bg-white rounded-lg shadow-sm`}>{item.icon}</div>
            <div>
              <div className="font-bold text-sm">{item.label}</div>
              <div className="text-[10px] text-muted-foreground">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
    accent: "bg-indigo-600",
  },
  {
    id: 3,
    category: "THRESHOLDS",
    title: "2つの警戒レベル",
    subtitle: "基準値を超えた場合の自治体の状態",
    content: (
      <div className="space-y-4">
        <div className="relative p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl flex gap-4">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-amber-400 text-white rounded-full font-black italic shadow-sm">
            !
          </div>
          <div>
            <div className="font-black text-amber-800 text-lg">
              早期健全化基準（イエローカード）
            </div>
            <p className="text-xs text-amber-700 leading-relaxed mt-1">
              自主的な改善努力が必要な状態。「財政健全化計画」を策定し、自ら立て直しを図ります。
            </p>
          </div>
        </div>
        <div className="relative p-5 bg-red-50 border-2 border-red-200 rounded-2xl flex gap-4">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full font-black italic shadow-sm">
            !!
          </div>
          <div>
            <div className="font-black text-red-800 text-lg">
              財政再生基準（レッドカード）
            </div>
            <p className="text-xs text-red-700 leading-relaxed mt-1">
              著しく困難な状態。「財政再生計画」を策定し、国の同意を得ながら再建を目指します。
            </p>
          </div>
        </div>
      </div>
    ),
    accent: "bg-red-600",
  },
  {
    id: 4,
    category: "PUBLIC ENTERPRISES",
    title: "公営企業の経営健全化",
    subtitle: "水道・病院などの「事業」を守る指標",
    content: (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-full bg-cyan-600 text-white p-6 rounded-2xl shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <BarChart3 size={80} />
          </div>
          <div className="text-sm font-bold uppercase tracking-widest opacity-80">
            指標名称
          </div>
          <div className="text-3xl font-black mt-2">資金不足比率</div>
          <div className="mt-4 pt-4 border-t border-cyan-500/50 flex justify-between items-center px-4">
            <span className="text-xs">経営健全化基準</span>
            <span className="text-2xl font-bold">20.0%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center px-4">
          公営企業の資金不足額を、事業の規模（営業収益）と比較した割合です。
        </p>
      </div>
    ),
    accent: "bg-cyan-600",
  },
  {
    id: 5,
    category: "PROCESS",
    title: "健全化へのステップ",
    subtitle: "基準を超えてから再生までの流れ",
    content: (
      <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {[
          { step: "診断", desc: "毎年度、決算に基づき各比率を算定し、監査委員が審査。" },
          { step: "公表", desc: "算定結果を議会に報告し、速やかに住民へ公表。" },
          { step: "計画", desc: "基準超過時、議会の議決を経て「健全化/再生計画」を策定。" },
          { step: "実行", desc: "毎年の実施状況を公表し、改善されるまで継続。" },
        ].map((item, i) => (
          <div key={item.step} className="relative">
            <div className="absolute -left-[30px] w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
              {i + 1}
            </div>
            <div className="font-bold text-foreground">{item.step}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>
    ),
    accent: "bg-slate-800",
  },
];
