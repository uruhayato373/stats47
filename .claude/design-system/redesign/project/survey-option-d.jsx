/* Survey Option D — データジャーナリスト向け + ネイティブ収益
   - 暗色ヒーロー + 4 KPI
   - 注目大カード3枚
   - "Use this data" データジャーナリスト向け CTA
   - ★ 統計関連書籍4冊(PR)
   - 全件テーブル
   - 他の調査 + メルマガ */

function SurveyOptionD() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "調査一覧" }, { label: SURVEY.name, current: true },
        ]} />
      </div>

      {/* HERO */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
          color: "#fff", padding: 28, position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "radial-gradient(circle at 80% 30%, #fff, transparent 50%)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", background: "rgba(255,255,255,0.18)", borderRadius: 999, letterSpacing: "0.06em", textTransform: "uppercase" }}>🏛 政府統計</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>{SURVEY.organization}</span>
              </div>
              <h1 style={{ fontSize: 44, fontWeight: 800, margin: "4px 0 14px", letterSpacing: "-0.02em" }}>{SURVEY.name}</h1>
              <p style={{ fontSize: 14.5, opacity: 0.85, lineHeight: 1.7, margin: "0 0 18px", maxWidth: 560 }}>{SURVEY.description}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700 }}>
                  {React.cloneElement(Icons.Download, { className: "icon" })} 調査全件CSV
                </button>
                <a href={SURVEY.url} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                  {React.cloneElement(Icons.External, { className: "icon" })} 公式サイト
                </a>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["ランキング", SURVEY.rankingCount, "件"],
                ["注目指標",   SURVEY.featuredCount, "件"],
                ["最新年",     SURVEY.latestYear, ""],
                ["次回",       SURVEY.nextYear, ""],
              ].map(([k, v, u], i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.08)", padding: 14, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ fontSize: 10.5, opacity: 0.65, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{k}</div>
                  <div className="mono" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
                    {v}<span style={{ fontSize: 11, opacity: 0.65, fontWeight: 500, marginLeft: 3 }}>{u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>1. 注目のランキング</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {SURVEY_FEATURED.slice(0, 3).map(r => <FeaturedRankingCardLarge key={r.key} r={r} />)}
        </div>
      </section>

      {/* Use this data CTA */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="card" style={{
          padding: 22, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 18, alignItems: "center",
          background: "linear-gradient(135deg, var(--primary-50), #fff)",
          borderColor: "var(--primary-100)",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { width: 28, height: 28 } })}
          </div>
          <div>
            <div className="h3" style={{ color: "var(--primary)", fontSize: 16 }}>{SURVEY.name} データパック</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {SURVEY.rankingCount}件のランキング × 47都道府県 × 過去5回分の調査を一括ダウンロード
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-primary">CSV (zip)</button>
            <button className="btn">JSON</button>
            <button className="btn">Excel</button>
          </div>
        </div>
      </section>

      {/* Native books */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="eyebrow">2. 統計を読み解く書籍</div>
            <span className="pill">PR</span>
          </div>
          <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>もっと見る ›</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { title: "統計でウソをつく法", author: "ダレル・ハフ", price: "¥770", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
            { title: "人口減少社会のデザイン", author: "広井良典", price: "¥1,980", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)" },
            { title: "FACTFULNESS", author: "ハンス・ロスリング", price: "¥1,980", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
            { title: "やさしい統計学入門", author: "向後千春", price: "¥2,200", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)" },
          ].map((b, i) => <BookCard key={i} book={b} />)}
        </div>
      </section>

      {/* All rankings table */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="eyebrow">3. {SURVEY.name}に基づく全{SURVEY.rankingCount}件</div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
              <option>カテゴリ: すべて</option>
              {SURVEY.categoryDistribution.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
            <button className="btn btn-primary btn-sm">
              {React.cloneElement(Icons.Download, { className: "icon icon-sm" })} CSV
            </button>
          </div>
        </div>
        <div className="card">
          <table className="rk">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>指標</th>
                <th>カテゴリ</th>
                <th>1位</th>
                <th style={{ textAlign: "right" }}>値</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {SURVEY_RANKINGS.slice(0, 10).map((r, i) => {
                const color = SURVEY.categoryDistribution.find(c => c.name === r.category)?.color || "var(--muted)";
                return (
                  <tr key={r.key}>
                    <td className="mono" style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td>
                      <a href="#" style={{ color: "var(--fg)", textDecoration: "none", fontWeight: 600 }}>{r.title}</a>
                      {r.featured && <span style={{ marginLeft: 6, fontSize: 10 }}>⭐️</span>}
                    </td>
                    <td><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${color}22`, color, fontWeight: 600 }}>{r.category}</span></td>
                    <td style={{ fontSize: 12.5 }}>{r.top}</td>
                    <td className="mono value" style={{ textAlign: "right" }}>{r.topVal} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>{r.unit}</span></td>
                    <td style={{ textAlign: "right" }}><a href="#" className="btn btn-sm btn-ghost">→</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button className="btn">残り {SURVEY.rankingCount - 10}件を表示</button>
        </div>
      </section>

      {/* AdSense */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={100} label="" />
      </section>

      {/* Other surveys + newsletter */}
      <section style={{ padding: "24px 24px 30px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>4. 他の調査</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card">
            <div className="card-header" style={{ padding: "10px 14px" }}>
              <div className="h3">関連する政府統計</div>
            </div>
            <div className="card-body" style={{ padding: 6 }}>
              <div className="side-list">
                {RELATED_SURVEYS.map(s => (
                  <a key={s.name} href="#" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{s.name}<span className="muted" style={{ fontSize: 10.5, marginLeft: 4 }}>· {s.organization}</span></span>
                    <span className="meta">{s.rankingCount}件</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center", background: "linear-gradient(135deg, #f0fdfa, #fff)", borderColor: "#a7f3d0" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Mail, { className: "icon icon-lg" })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3">📧 {SURVEY.nextYear}年の調査結果を最速で</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>次回 {SURVEY.name} の結果公表時にメールで通知</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <input placeholder="you@example.com" style={{ flex: 1, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12 }} />
                <button className="btn btn-primary btn-sm">登録</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

window.SurveyOptionD = SurveyOptionD;
