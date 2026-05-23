/* Home Option C — Editorial / Magazine
   - エディトリアル「今日の1ランキング」大型カード
   - 二段組み: 左にメインフィーチャー記事, 右にサブ
   - 数値が活躍するマガジン風レイアウト */

function HomeOptionC() {
  return (
    <div className="page" style={{ background: "#fff" }}>
      {/* Magazine header */}
      <section style={{ padding: "24px 24px 10px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>2026年5月18日 火曜</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: "2px 0 0", letterSpacing: "-0.01em" }}>
              統計で見る都道府県 <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>— stats47</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)" }}>
            <span>📊 1,800+指標</span>
            <span>📅 30年データ</span>
            <span>🔄 毎日更新</span>
          </div>
        </div>
      </section>

      {/* Today's editorial — big feature */}
      <section style={{ padding: "30px 24px", background: "#fafbfc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "stretch" }}>
          {/* Main feature */}
          <a href="#" className="card" style={{
            display: "flex", flexDirection: "column", overflow: "hidden",
            textDecoration: "none", color: "var(--fg)",
            transition: "all .15s",
          }}>
            <div style={{
              height: 320, position: "relative",
              background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
              color: "#fff", padding: 28, display: "flex", flexDirection: "column", justifyContent: "flex-end",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "radial-gradient(circle at 80% 30%, #fff, transparent 60%)" }} />
              {/* Mini chart */}
              <svg viewBox="0 0 600 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.3 }}>
                {[1395, 1397, 1399, 1400, 1400, 1401].map((v, i) => (
                  <rect key={i} x={100 + i * 75} y={200 - v / 7} width={50} height={v / 7} fill="rgba(255,255,255,0.6)" rx="2" />
                ))}
              </svg>
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.18)", borderRadius: 999, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>今日のランキング</span>
                <div style={{ fontSize: 32, fontWeight: 800, marginTop: 12, lineHeight: 1.2 }}>東京都の人口、1,401万人 ─ 全国の11.3%が集中</div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  <span>📊 ランキング: 総人口</span>
                  <span>📅 2024年データ</span>
                  <span>🔄 4/12更新</span>
                </div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--fg-2)" }}>
                2024年10月時点の人口推計で、東京都は<strong>1,401万人</strong>に達し、全国合計の<strong>11.3%</strong>を1都が占めることが明らかに。一方、最も人口の少ない鳥取県は約53万人で、その差は約26倍…
              </p>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>ランキングを見る →</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>· 関連記事3本</span>
              </div>
            </div>
          </a>

          {/* Side panel: 3 sub features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { topic: "高齢化", title: "高齢化率1位の秋田、39.0% に到達", value: "39.0%", color: "#b45309" },
              { topic: "出生率", title: "沖縄の合計特殊出生率、1.70 で首位", value: "1.70", color: "#dc2626" },
              { topic: "経済", title: "東京の平均年収、622万円で全国トップ", value: "¥622万", color: "#15803d" },
            ].map((f, i) => (
              <a key={i} href="#" className="card" style={{
                flex: 1,
                padding: 14, textDecoration: "none", color: "var(--fg)",
                display: "flex", gap: 12, alignItems: "center",
              }}>
                <div style={{ width: 4, alignSelf: "stretch", background: f.color, borderRadius: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="muted" style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{f.topic}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginTop: 2 }}>{f.title}</div>
                </div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: f.color, flexShrink: 0 }}>{f.value}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section style={{ padding: "0 24px" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          background: "#fff", border: "1px solid var(--border)", borderRadius: 14,
          padding: "20px 24px", marginTop: -20, position: "relative", zIndex: 2,
          boxShadow: "0 12px 32px -16px rgba(0,0,0,0.1)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14,
        }}>
          {HOME_STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", borderRight: i < 3 ? "1px solid var(--border)" : "none", padding: i === 0 ? "0" : "0 0 0 14px" }}>
              <div className="mono" style={{ fontSize: 30, fontWeight: 800, color: "var(--primary)" }}>
                {s.value}<span style={{ fontSize: 16 }}>{s.suffix}</span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Themes grid */}
      <section style={{ padding: "50px 24px 30px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 20 }}>
            <h2 className="h2" style={{ fontSize: 24 }}>テーマで深掘り</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>テーマ一覧 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_THEMES.slice(0, 8).map(t => (
              <a key={t.key} href="#" className="card" style={{
                padding: 16, textDecoration: "none", color: "var(--fg)",
                display: "flex", alignItems: "center", gap: 12,
                borderLeft: `4px solid ${t.color}`,
              }}>
                <div style={{ fontSize: 28 }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{t.count}指標 · ダッシュボード</div>
                </div>
                <span style={{ color: t.color, fontWeight: 700 }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured rankings */}
      <section style={{ padding: "30px 24px", background: "#fafbfc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 20 }}>
            <h2 className="h2" style={{ fontSize: 24 }}>注目のランキング</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべて見る →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_FEATURED.map(r => <FeaturedHomeCard key={r.key} r={r} />)}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section style={{ padding: "30px 24px 40px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 20 }}>
            <h2 className="h2" style={{ fontSize: 24 }}>編集部の記事</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべての記事 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {HOME_ARTICLES.map(a => (
              <a key={a.slug} href="#" style={{ textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ aspectRatio: "1200/630", background: a.thumb, borderRadius: 10 }} />
                <div>
                  <span className="pill primary">{a.category}</span>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{a.date} · 読了 約7分</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

window.HomeOptionC = HomeOptionC;
