"use client";

interface VisualizationFormProps {
  item?: any;
}

export function VisualizationForm({ item }: VisualizationFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">可視化設定</h3>
      <p className="text-sm text-muted-foreground">
        可視化設定フォームは後ほど実装します。
      </p>
      <p className="text-sm text-muted-foreground">- map_color_scheme</p>
      <p className="text-sm text-muted-foreground">
        - map_diverging_midpoint
      </p>
      <p className="text-sm text-muted-foreground">- ranking_direction</p>
      <p className="text-sm text-muted-foreground">- conversion_factor</p>
      <p className="text-sm text-muted-foreground">- decimal_places</p>
    </div>
  );
}

