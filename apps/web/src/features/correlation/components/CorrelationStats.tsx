import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";

interface CorrelationStatsProps {
    totalPairs: number;
    strongCorrelationCount: number;
}

export function CorrelationStats({
    totalPairs,
    strongCorrelationCount,
}: CorrelationStatsProps) {
    const strongRatio =
        totalPairs > 0
            ? ((strongCorrelationCount / totalPairs) * 100).toFixed(1)
            : "0";

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">統計情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">総ペア数</span>
                    <span className="font-mono">
                        {totalPairs.toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        |r| &ge; 0.7
                    </span>
                    <span className="font-mono">
                        {strongCorrelationCount.toLocaleString()} (
                        {strongRatio}%)
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
