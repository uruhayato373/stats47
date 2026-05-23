/* Survey Option B — 調査プロファイル・ヒーロー
   - 上部に「調査名 + 公的データバッジ + 主要メタ4枚」のヒーロー
   - カテゴリ分布バー (この調査が何の分野で使われているか可視化)
   - 注目ランキングを大カード3枚 + 全件カード */

function SurveyOptionB() {
  const totalCat = SURVEY.categoryDistribution.reduce((a, c) => a + c.count, 0);
  return (
    <div className="page" style={{ background: "#fff" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "調査一覧" }, { label: SURVEY.name, current: true },
        ]} />
      </div>

      {/* HERO */}
      <section style={{
        padding: "20px 24px 24px",
        background: "linear-gradient(135deg, #eff6ff 0%, #fff 70%)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: 30, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 10px",
                background: "var(--primary)", color: "#fff", borderRadius: 999,
                letterSpacing: "0.05em", textTransform: "uppercase",
              }}>政府統計</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{SURVEY.organization}</span>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, margin: "4px 0 12px", letterSpacing: "-0.02em" }}>
              {SURVEY.name}
            </h1>
            <p style={{ fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.75, margin: "0 0 18px", maxWidth: 560 }}>
              {SURVEY.description}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary">
                {React.cloneElement(Icons.Download, { className: "icon" })} 調査全件CSV
              </button>
              <a href={SURVEY.url} target="_blank" rel="noopener noreferrer" className="btn">
                {React.cloneElement(Icons.External, { className: "icon" })} 公式サイト
              </a>
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>調査の概要</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                ["ランキング数", SURVEY.rankingCount, "件"],
                ["注目指標",   SURVEY.featuredCount, "件"],
                ["実施周期",   SURVEY.cycle, ""],
                ["最新年",     SURVEY.latestYear, "年"],
              ].map(([k, v, u], i) => (
                <div key={i}>
                  <div className="muted" style={{ fontSize: 10.5, fontWeight: 600 }}>{k}</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
                    {v}<span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, marginLeft: 2 }}>{u}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>次回実施予定</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%" }} />
                <span className="mono" style={{ fontSize: 16, fontWeight: 800 }}>{SURVEY.nextYear}年</span>
                <span className="muted" style={{ fontSize: 11 }}>(あと {SURVEY.nextYear - 2025}年)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category distribution bar */}
      <section style={{ padding: "20px 24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 10 }}>
            <div className="h3">この調査が使われているカテゴリ</div>
            <span className="muted" style={{ fontSize: 12 }}>合計 {totalCat} 指標</span>
          </div>
          <div style={{ display: "flex", height: 24, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 8 }}>
            {SURVEY.categoryDistribution.map(c => (
              <div key={c.name} style={{
                flex: c.count, background: c.color, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
              }}>{c.count >= 8 ? c.name : c.count}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {SURVEY.categoryDistribution.map(c => (
              <div key={c.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5 }}>
                <span style={{ width: 10, height: 10, background: c.color, borderRadius: 2 }} />
                <span style={{ color: "var(--fg-2)" }}>{c.name}</span>
                <span className="muted">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured large cards */}
      <section style={{ padding: "24px 24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>⭐️ 注目のランキング</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {SURVEY_FEATURED.slice(0, 3).map(r => (
              <FeaturedRankingCardLarge key={r.key} r={r} />
            ))}
          </div>
        </div>
      </section>

      {/* All rankings as cards */}
      <section style={{ padding: "24px 24px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 10 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>{SURVEY.name}に基づく全{SURVEY.rankingCount}件</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                <option>カテゴリ: すべて</option>
                {SURVEY.categoryDistribution.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
              <button className="btn btn-sm">
                {React.cloneElement(Icons.Download, { className: "icon icon-sm" })} CSV
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {SURVEY_RANKINGS.slice(0, 12).map(r => (
              <a key={r.key} href="#" className="card" style={{
                display: "flex", flexDirection: "column", gap: 6,
                padding: 12, textDecoration: "none", color: "var(--fg)",
                borderLeft: `3px solid var(--primary)`,
              }}>
                <div className="muted" style={{ fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{r.category} · {r.year}</div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                  {r.title}
                  {r.featured && <span style={{ marginLeft: 6, fontSize: 10 }}>⭐️</span>}
                </div>
                <div style={{ marginTop: "auto", paddingTop: 6, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>1位 {r.top}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 800 }}>{r.topVal}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

window.SurveyOptionB = SurveyOptionB;
