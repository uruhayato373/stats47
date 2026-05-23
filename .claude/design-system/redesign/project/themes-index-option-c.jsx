/* Themes Index Option C — マトリックス・アトラス
   - 巨大なテーマ・マトリックス (17テーマを1画面で俯瞰)
   - 各セルに mini chart + KPI
   - エディトリアルな知の地図感 */

function ThemesIndexOptionC() {
  return (
    <div className="page" style={{ background: "#fff" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "テーマ一覧", current: true }]} />
      </div>

      <header style={{ padding: "16px 24px 8px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--primary)" }}>テーマ・アトラス</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: "4px 0 4px", letterSpacing: "-0.01em" }}>
              {THEMES_INDEX_HERO.title}
            </h1>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              17テーマ · 280指標 を1画面で俯瞰
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm">
              {React.cloneElement(Icons.Search, { className: "icon icon-sm" })} 検索
            </button>
            <button className="btn btn-primary btn-sm">
              {React.cloneElement(Icons.Download, { className: "icon icon-sm" })} データを取得
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding: "20px 24px 30px", maxWidth: 1300, margin: "0 auto" }}>
        {/* Matrix grid — 5x4 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {THEMES_INDEX_LIST.map(t => (
            <a key={t.key} href="#" className="card" style={{
              padding: 14, textDecoration: "none", color: "var(--fg)",
              display: "flex", flexDirection: "column", gap: 8,
              minHeight: 180, transition: "all .15s",
              position: "relative", overflow: "hidden",
            }}>
              {t.featured && (
                <span style={{
                  position: "absolute", top: 8, right: 8,
                  fontSize: 9, fontWeight: 700, padding: "1px 6px",
                  background: "#fef3c7", color: "#92400e", borderRadius: 999,
                }}>⭐️</span>
              )}
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${t.color}22`, color: t.color,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>{t.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 10 }}>{t.count}指標</div>
                </div>
              </div>
              {/* Mini visualization */}
              <div style={{
                height: 38, background: "var(--bg-subtle)", borderRadius: 6,
                display: "flex", alignItems: "flex-end", padding: "4px 6px", gap: 3,
              }}>
                {[0.3, 0.5, 0.7, 0.9, 1, 0.85, 0.7, 0.55, 0.4, 0.3].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h * 100}%`, background: t.color,
                    opacity: 0.3 + h * 0.7, borderRadius: 1,
                  }} />
                ))}
              </div>
              {/* Bottom KPI */}
              <div style={{ marginTop: "auto", paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                <div className="muted" style={{ fontSize: 9.5, fontWeight: 600 }}>{t.topLabel}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{t.top}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: t.color }}>{t.topVal}</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom CTAs */}
        <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card" style={{ padding: 16, background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg" })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3" style={{ color: "var(--primary)" }}>全テーマのデータパック</div>
              <div className="muted" style={{ fontSize: 12 }}>17テーマ × 280指標 × 47都道府県 × 6年</div>
            </div>
            <button className="btn btn-primary">CSV (zip)</button>
          </div>
          <div className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Mail, { className: "icon icon-lg" })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3">新テーマ追加の通知</div>
              <div className="muted" style={{ fontSize: 12 }}>新しいテーマやデータ更新をメールでお知らせ</div>
            </div>
            <button className="btn">登録</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ThemesIndexOptionC = ThemesIndexOptionC;
