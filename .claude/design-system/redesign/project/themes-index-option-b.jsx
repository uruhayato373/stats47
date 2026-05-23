/* Themes Index Option B — 注目テーマ + ダブルレイアウト
   - 上部: 注目テーマ4枚 (大カード with mini visualization)
   - 中部: カテゴリ別グルーピング (経済/人口/生活/労働/産業 セクション)
   - 各セクション内に該当テーマカード */

function ThemesIndexOptionB() {
  const byCategory = THEMES_INDEX_LIST.reduce((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});
  const featured = THEMES_INDEX_LIST.filter(t => t.featured);

  return (
    <div className="page" style={{ background: "#fff" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "テーマ一覧", current: true }]} />
      </div>

      <header style={{
        padding: "20px 24px 24px",
        background: "linear-gradient(135deg, #eff6ff 0%, #fff 70%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="eyebrow" style={{ color: "var(--primary)" }}>stats47 ─ Themes</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, margin: "6px 0 8px", letterSpacing: "-0.01em" }}>
            {THEMES_INDEX_HERO.title}
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 720, lineHeight: 1.7, margin: "0 0 16px" }}>
            {THEMES_INDEX_HERO.description}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, max-content)", gap: 28 }}>
            {[
              ["テーマ数", THEMES_INDEX_HERO.total, ""],
              ["総指標数", THEMES_INDEX_HERO.totalIndicators, ""],
              ["注目テーマ", featured.length, ""],
              ["更新頻度", "週次", ""],
            ].map(([k, v, u], i) => (
              <div key={i}>
                <div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{k}</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>{v}{u}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Featured themes */}
      <section style={{ padding: "30px 24px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div className="between" style={{ marginBottom: 14 }}>
          <h2 className="h2" style={{ fontSize: 22 }}>⭐️ 注目のテーマ</h2>
          <span className="muted" style={{ fontSize: 12 }}>編集部が選んだ今月のテーマ</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {featured.map(t => (
            <a key={t.key} href="#" className="card" style={{
              padding: 0, textDecoration: "none", color: "var(--fg)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              transition: "all .15s",
            }}>
              <div style={{
                height: 100, background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
              }}>
                <span style={{ fontSize: 56 }}>{t.icon}</span>
                <span style={{
                  position: "absolute", top: 8, right: 8,
                  fontSize: 9, fontWeight: 700, padding: "2px 8px",
                  background: "rgba(255,255,255,0.9)", color: t.color,
                  borderRadius: 999,
                }}>⭐️ 注目</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{t.count}指標 · {t.category}</div>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="muted" style={{ fontSize: 10 }}>{t.topLabel} · 1位</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>{t.top}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{t.topVal}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Grouped by category */}
      <section style={{ padding: "30px 24px 30px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        {Object.keys(byCategory).map(cat => (
          <div key={cat}>
            <div className="between" style={{ marginBottom: 10 }}>
              <h2 className="h2" style={{ fontSize: 18 }}>📂 {cat}に関するテーマ</h2>
              <span className="muted" style={{ fontSize: 12 }}>{byCategory[cat].length}件</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {byCategory[cat].map(t => (
                <a key={t.key} href="#" className="card" style={{
                  padding: 12, textDecoration: "none", color: "var(--fg)",
                  display: "flex", alignItems: "center", gap: 10,
                  borderLeft: `3px solid ${t.color}`,
                }}>
                  <div style={{ fontSize: 24 }}>{t.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                    <div className="muted" style={{ fontSize: 10.5 }}>{t.count}指標</div>
                  </div>
                  <span style={{ color: t.color, fontWeight: 700 }}>→</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

window.ThemesIndexOptionB = ThemesIndexOptionB;
