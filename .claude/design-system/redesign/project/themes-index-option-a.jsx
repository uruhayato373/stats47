/* Themes Index Option A — 整理改善 (低リスク)
   - h1: text-lg → 32px
   - 統計バナー (テーマ数・指標数・更新日)
   - カテゴリフィルタ・検索
   - 既存カードに icon + color border + 注目バッジ + 代表指標プレビュー */

function ThemesIndexOptionA() {
  const [group, setGroup] = React.useState("all");
  const filtered = group === "all" ? THEMES_INDEX_LIST : THEMES_INDEX_LIST.filter(t => t.category === group);

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "テーマ一覧", current: true }]} />
      </div>

      <header style={{ padding: "12px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="pill primary">17 テーマ</span>
        </div>
        <h1 className="h1" style={{ fontSize: 32 }}>{THEMES_INDEX_HERO.title}</h1>
        <p style={{ margin: "6px 0 12px", fontSize: 14, color: "var(--muted)", maxWidth: 760, lineHeight: 1.65 }}>
          {THEMES_INDEX_HERO.description}
        </p>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--muted)" }}>
          <span>📂 <strong style={{ color: "var(--fg)" }}>{THEMES_INDEX_HERO.total}</strong>テーマ</span>
          <span>📊 計 <strong style={{ color: "var(--fg)" }}>{THEMES_INDEX_HERO.totalIndicators}</strong>指標</span>
          <span>🔄 最終更新 {THEMES_INDEX_HERO.lastUpdated}</span>
        </div>
      </header>

      {/* Filter + search */}
      <div style={{ padding: "18px 24px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {THEMES_INDEX_GROUPS.map(g => (
            <button key={g.key} onClick={() => setGroup(g.key)} style={{
              cursor: "pointer", font: "inherit",
              padding: "6px 12px", borderRadius: 999,
              border: `1px solid ${group === g.key ? "var(--primary)" : "var(--border)"}`,
              background: group === g.key ? "var(--primary-50)" : "#fff",
              color: group === g.key ? "var(--primary)" : "var(--fg-2)",
              fontSize: 12, fontWeight: group === g.key ? 700 : 500,
            }}>
              {g.name}
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 999, marginLeft: 5,
                background: group === g.key ? "var(--primary)" : "var(--bg-muted)",
                color: group === g.key ? "#fff" : "var(--muted)",
              }}>{g.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="select" style={{ padding: "6px 10px", width: 220 }}>
          {React.cloneElement(Icons.Search, { className: "icon icon-sm" })}
          <input placeholder="テーマを検索" style={{ flex: 1, border: 0, outline: "none", font: "inherit", background: "transparent" }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "20px 24px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {filtered.map(t => (
            <a key={t.key} href="#" className="card" style={{
              padding: 16, textDecoration: "none", color: "var(--fg)",
              display: "flex", flexDirection: "column", gap: 10,
              borderTop: `3px solid ${t.color}`, position: "relative",
            }}>
              {t.featured && (
                <span style={{
                  position: "absolute", top: 10, right: 10,
                  fontSize: 10, fontWeight: 700, padding: "2px 8px",
                  background: "#fef3c7", color: "#92400e", borderRadius: 999,
                }}>⭐️ 注目</span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${t.color}1a`, color: t.color,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{t.count}指標 · {t.category}</div>
                </div>
              </div>
              <div style={{
                marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div className="muted" style={{ fontSize: 10 }}>{t.topLabel} · 1位</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{t.top}</div>
                </div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: t.color }}>{t.topVal}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 24px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={120} label="" />
      </div>
    </div>
  );
}

window.ThemesIndexOptionA = ThemesIndexOptionA;
