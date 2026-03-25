"use client";

import { Lightbulb, MapPin, Users } from "lucide-react";

/**
 * 地域が未選択、または1つの場合に表示する案内コンポーネント
 */
export function ComparisonEmpty() {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-16 px-4 text-center">
            <div className="relative mb-6">
                <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <MapPin size={48} />
                </div>
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm">
                    <span className="text-xl font-bold">?</span>
                </div>
            </div>

            <h3 className="mb-2 text-xl font-bold text-foreground">
                比較したい2つの地域を選んでください
            </h3>
            <p className="mb-8 max-w-sm text-muted-foreground">
                都道府県を2つ選ぶと、人口、経済、教育などの統計データをカテゴリ別に比較できます。
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left max-w-lg">
                <div className="flex gap-3 rounded-lg border bg-muted/50 p-4">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Users size={18} />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-foreground">格差を視覚化</div>
                        <div className="text-xs text-muted-foreground">地域間の数値をグラフで直感的に比較できます。</div>
                    </div>
                </div>
                <div className="flex gap-3 rounded-lg border bg-muted/50 p-4">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Lightbulb size={18} />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-foreground">特徴を発見</div>
                        <div className="text-xs text-muted-foreground">全国順位や差分率から、その地域の強みを見つけ出せます。</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
