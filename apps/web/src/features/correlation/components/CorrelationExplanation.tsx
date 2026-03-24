import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@stats47/components/atoms/ui/accordion";

export function CorrelationExplanation() {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">相関分析について</h2>
            <Accordion type="multiple" defaultValue={["what-is"]}>
                <AccordionItem value="what-is">
                    <AccordionTrigger className="text-sm font-semibold">
                        相関係数とは
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            ピアソン相関係数（r）は、2つの変数間の線形な関連の強さを
                            -1.0 から +1.0 の範囲で示す指標です。
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <strong>|r| &ge; 0.7</strong>
                                : 強い相関
                            </li>
                            <li>
                                <strong>0.4 &le; |r| &lt; 0.7</strong>
                                : 中程度の相関
                            </li>
                            <li>
                                <strong>|r| &lt; 0.4</strong>
                                : 弱い相関
                            </li>
                        </ul>
                        <p>
                            r が正の値なら「一方が増えるともう一方も増える」傾向、
                            負の値なら「一方が増えるともう一方は減る」傾向を意味します。
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="not-causal">
                    <AccordionTrigger className="text-sm font-semibold">
                        相関と因果は異なる
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            相関関係があっても因果関係があるとは限りません。
                            有名な例として「アイスクリームの売上と水難事故件数」は強い正の相関を示しますが、
                            アイスクリームが水難事故を引き起こすわけではなく、
                            背後にある「気温」という共通の要因が両方を動かしています。
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="spurious">
                    <AccordionTrigger className="text-sm font-semibold">
                        疑似相関（見せかけの相関）
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            都道府県統計では、以下のような交絡変数が多くの指標に影響を与え、
                            見せかけの相関を生みやすくなっています。
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <strong>人口規模</strong>: 出生数・事業所数・犯罪件数など絶対数同士は人口が駆動
                            </li>
                            <li>
                                <strong>面積</strong>: 林野面積・農地面積・道路延長など
                            </li>
                            <li>
                                <strong>高齢化率</strong>: 死亡率・医療費・介護関連指標
                            </li>
                            <li>
                                <strong>人口密度（都市化度）</strong>: コンビニ数・共同住宅比率・地価
                            </li>
                        </ul>
                        <p>
                            相関係数ランキングでは、これら4つの交絡変数を制御した偏相関係数を基準に順位付けし、
                            交絡を除外しても強い相関が残るペアを上位に表示しています。
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="trivial">
                    <AccordionTrigger className="text-sm font-semibold">
                        自明な相関の除外
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            同一現象の「件数」と「率」のペア（例: 自殺死亡者数 × 自殺率）は、
                            一方が他方を人口で割っただけの関係であり、相関係数が1に近くなるのは数学的に自明です。
                        </p>
                        <p>
                            このようなペア（|r| &ge; 0.99）は分析上の発見がないため、
                            相関係数ランキングから除外しています。
                            指標セレクターで直接選択すれば散布図の確認は可能です。
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="measures">
                    <AccordionTrigger className="text-sm font-semibold">
                        このサイトでの対策
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                        <p>疑似相関を軽減するため、以下の対策を行っています。</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <strong>補数関係の除外</strong>
                                : 合計が100%になる構成比同士（例: 第1次・第2次・第3次産業就業者比率）は数学的に相関が決まるため除外
                            </li>
                            <li>
                                <strong>同指標バリエーションの除外</strong>
                                : 同タイトルの属性違いを除外
                            </li>
                            <li>
                                <strong>偏相関係数による検証</strong>
                                : 総人口・総面積・高齢化率・人口密度の4つを制御変数として偏相関係数を算出。
                                制御後に相関が大幅に低下するペアには「*」マークで疑似相関の可能性を注記しています
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
