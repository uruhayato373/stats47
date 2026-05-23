/* Survey Option C — 「調査を読み解く」エディトリアル
   - 大型暗色ヒーロー: 調査の歴史・タイムライン
   - "What is this survey?" 解説セクション (誰が・いつ・何のために)
   - カテゴリ別にランキングをグルーピング
   - 信頼性・出典を強調 (政府統計, 全数調査) */

function SurveyOptionC() {
  const byCategory = SURVEY_RANKINGS.reduce((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});
  const orderedCats = SURVEY.categoryDistribution.map(c => c.name).filter(n => byCategory[n]);

  return (
    <div className="page" style={{ background: "#fff" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "調査一覧" }, { label: SURVEY.name, current: true },
        ]} />
      </div>

      {/* HERO */}
      <section style={{
        padding: "24px 24px 28px",
        background: "linear-gradient(135deg, #0b1220, #1e293b)",
        color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at 80% 30%, #fff, transparent 50%)" }} />
        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", background: "rgba(255,255,255,0.12)", borderRadius: 999, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            🏛 政府統計 · {SURVEY.organization}
          </div>
          <h1 style={{ fontSize: 50, fontWeight: 800, margin: "14px 0 8px", letterSpacing: "-0.02em" }}>
            {SURVEY.name}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.7, margin: "0 auto 22px", maxWidth: 700 }}>
            {SURVEY.description}
          </p>
          {/* Timeline */}
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ position: "relative", height: 70 }}>
              {/* axis */}
              <div style={{ position: "absolute", left: 0, right: 0, top: 30, height: 2, background: "rgba(255,255,255,0.2)" }} />
              {[
                [SURVEY.firstYear, "0%", "初回実施"],
                [1947, "20%", "戦後再開"],
                [2000, "62%", "近年"],
                [SURVEY.latestYear, "85%", "最新", true],
                [SURVEY.nextYear, "100%", "次回", false, true],
              ].map(([y, x, lbl, isLatest, isNext], i) => (
                <div key={i} style={{ position: "absolute", left: x, top: 0, transform: "translateX(-50%)", textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{lbl}</div>
                  <div style={{
                    width: isLatest ? 14 : isNext ? 12 : 10,
                    height: isLatest ? 14 : isNext ? 12 : 10,
                    margin: "8px auto 6px",
                    background: isLatest ? "#fbbf24" : isNext ? "transparent" : "#fff",
                    border: isNext ? "2px dashed #60a5fa" : "0",
                    borderRadius: "50%",
                  }} />
                  <div className="mono" style={{ fontSize: 12, fontWeight: 700, opacity: 0.95 }}>{y}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What is this survey */}
      <section style={{ padding: "30px 24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>この調査について</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { icon: "🏛", title: "実施機関", body: SURVEY.organization, sub: "日本の政府統計の所管" },
              { icon: "📅", title: "実施周期", body: SURVEY.cycle, sub: `${SURVEY.firstYear}年から継続` },
              { icon: "📋", title: "調査方式", body: SURVEY.method, sub: "全世帯を対象" },
              { icon: "🔬", title: "派生指標", body: `${SURVEY.rankingCount}件`, sub: "ランキングを公開" },
            ].map((c, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
                <div className="muted" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{c.title}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{c.body}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rankings grouped by category */}
      <section style={{ padding: "30px 24px 30px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="between">
            <div className="eyebrow">{SURVEY.name}に基づくランキング {SURVEY.rankingCount}件</div>
            <button className="btn btn-sm">
              {React.cloneElement(Icons.Download, { className: "icon icon-sm" })} 調査全件CSV
            </button>
          </div>
          {orderedCats.map(cat => {
            const color = SURVEY.categoryDistribution.find(c => c.name === cat)?.color || "var(--muted)";
            return (
              <div key={cat}>
                <div className="between" style={{
                  paddingBottom: 8, marginBottom: 12,
                  borderBottom: `2px solid ${color}`,
                }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color }}>
                    {cat}
                  </h2>
                  <span className="muted" style={{ fontSize: 12 }}>{byCategory[cat].length}件</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {byCategory[cat].map(r => (
                    <a key={r.key} href="#" className="card" style={{
                      padding: 12, textDecoration: "none", color: "var(--fg)",
                      borderLeft: `3px solid ${color}`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>
                        {r.title}
                        {r.featured && <span style={{ marginLeft: 4, fontSize: 10 }}>⭐️</span>}
                      </div>
                      <div className="between" style={{ fontSize: 11 }}>
                        <span style={{ color: "var(--muted)" }}>1位 {r.top}</span>
                        <span className="mono" style={{ fontWeight: 800, color }}>{r.topVal}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

window.SurveyOptionC = SurveyOptionC;
