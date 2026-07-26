const EMPTY_MESSAGE = "<em>プロパティなし</em>";

const TABLE_STYLE =
  "width:100%;border-collapse:collapse;font-size:13px;line-height:20px";
const LABEL_CELL_STYLE =
  "height:36px;padding:6px 8px;border-bottom:1px solid hsl(var(--border));color:hsl(var(--muted-foreground));white-space:nowrap;vertical-align:middle";
const VALUE_CELL_STYLE =
  "height:36px;padding:6px 8px;border-bottom:1px solid hsl(var(--border));color:hsl(var(--foreground));vertical-align:middle";

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Leaflet bindPopup は React component を受け取れないため、popup 用の表だけを
 * HTML 文字列として生成する。密度は共通 Table primitive と同じ値に固定する。
 */
export function buildKsjPropertyPopupHtml(
  properties: Record<string, unknown> | null,
): string {
  if (!properties) return EMPTY_MESSAGE;

  const rows = Object.entries(properties)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `<tr><td style="${LABEL_CELL_STYLE}">${escapeHtml(key)}</td><td style="${VALUE_CELL_STYLE}">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  if (!rows) return EMPTY_MESSAGE;

  return `<div style="max-height:260px;overflow-y:auto"><table style="${TABLE_STYLE}">${rows}</table></div>`;
}
