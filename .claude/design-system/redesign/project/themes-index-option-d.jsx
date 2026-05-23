/* Themes Index Option D — Discovery + ネイティブ収益 */

function ThemesIndexOptionD() {
  const featured = THEMES_INDEX_LIST.filter(t => t.featured).slice(0, 4);
  const rest = THEMES_INDEX_LIST.filter(t => !t.featured);

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "テーマ一覧", current: true }]} />
      </div>

      {/* HERO */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
          color: "#fff", padding: 28, position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at 80% 30%, #fff, transparent 50%)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, fontWeight: 700 }}>stats47 ─ Themes</div>
              <h1 style={{ fontSize: 44, fontWeight: 800, margin: "8px 0 12px", letterSpacing: "-0.01em" }}>
                {THEMES_INDEX_HERO.title}
              </h1>
              <p style={{ fontSize: 14.5, opacity: 0.85, lineHeight: 1.7, margin: "0 0 18px", maxWidth: 520 }}>
                {THEMES_INDEX_HERO.description}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700 }}>
                  {React.cloneElement(Icons.Download, { className: "icon" })} 全テーマCSV
                </button>
                <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                  {React.cloneElement(Icons.Mail, { className: "icon" })} 通知を受け取る
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["テーマ数", 17, ""],
                ["総指標数", 280, ""],
                ["注目テーマ", featured.length, ""],
                ["都道府県", 47, ""],
              ].map(([k, v, u], i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.08)", padding: 14, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ fontSize: 10.5, opacity: 0.65, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{k}</div>
                  <div className="mono" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{v}{u}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 12 }}>
          <div className="eyebrow">⭐️ 注目のテーマ</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {featured.map(t => (
            <a key={t.key} href="#" className="card" style={{
              padding: 0, textDecoration: "none", color: "var(--fg)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              <div style={{
                height: 90, background: `linear-gradient(135deg, ${t.color}, ${t.color}77)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 44 }}>{t.icon}</span>
              </div>
              <div style={{ padding: 14, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{t.count}指標</div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
                  <strong style={{ color: "var(--fg)" }}>{t.top}</strong> {t.topVal}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Native book row */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="eyebrow">テーマを深掘りする書籍</div>
            <span className="pill">PR</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { title: "人口減少社会のデザイン", author: "広井良典", price: "¥1,980", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
            { title: "地方消滅", author: "増田寛也", price: "¥902", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)" },
            { title: "未来の年表", author: "河合雅司", price: "¥880", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
            { title: "縮減ニッポンの再構築", author: "山下祐介", price: "¥1,540", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)" },
          ].map((b, i) => <BookCard key={i} book={b} />)}
        </div>
      </section>

      {/* All themes grid */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 12 }}>
          <div className="eyebrow">すべてのテーマ</div>
          <div style={{ display: "flex", gap: 6 }}>
            {THEMES_INDEX_GROUPS.slice(1).map(g => (
              <span key={g.key} style={{
                padding: "3px 10px", borderRadius: 999, fontSize: 11,
                background: "var(--bg-subtle)", border: "1px solid var(--border)",
              }}>{g.name} ({g.count})</span>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {rest.map(t => (
            <a key={t.key} href="#" className="card" style={{
              padding: 12, textDecoration: "none", color: "var(--fg)",
              display: "flex", alignItems: "center", gap: 10,
              borderLeft: `3px solid ${t.color}`,
            }}>
              <div style={{ fontSize: 22 }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                <div className="muted" style={{ fontSize: 10.5 }}>{t.count}指標</div>
              </div>
              <span style={{ color: t.color }}>→</span>
            </a>
          ))}
        </div>
      </section>

      {/* AdSense */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={120} label="" />
      </section>

      {/* Data pack + Newsletter */}
      <section style={{ padding: "24px 24px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center", background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg" })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3" style={{ color: "var(--primary)" }}>全テーマ・データパック</div>
              <div className="muted" style={{ fontSize: 12 }}>17テーマ × 280指標を一括ダウンロード</div>
            </div>
            <button className="btn btn-primary">取得</button>
          </div>
          <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Mail, { className: "icon icon-lg" })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3">新テーマ追加通知</div>
              <div className="muted" style={{ fontSize: 12 }}>新テーマ・データ更新をメールで</div>
            </div>
            <input placeholder="you@example.com" style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12, width: 160 }} />
            <button className="btn btn-primary">登録</button>
          </div>
        </div>
      </section>
    </div>
  );
}

window.ThemesIndexOptionD = ThemesIndexOptionD;
