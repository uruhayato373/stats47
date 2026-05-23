/* Area+Category Option C — Compare-First (パワーユーザー向け分析)
   - 全カラムに「あなたの県 vs 全国平均/隣接県」のヘッドツーヘッド比較を埋め込む
   - 上部: A vs B 切替コンパレーター
   - KPIs に全国平均との差を表示
   - チャートグリッドで全国分布の中の位置を強調 */

function AreaOptionC() {
  const [norm, setNorm] = React.useState("total");
  const [compareWith, setCompareWith] = React.useState("national");

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "都道府県一覧" },
          { label: AREA.name }, { label: "人口・世帯", current: true },
        ]} />
      </div>

      <header style={{ padding: "10px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.04em", fontWeight: 600 }}>{AREA.region}地方 · コード {AREA.code}</div>
          <h1 className="h1" style={{ fontSize: 30 }}>
            {AREA.name} <span style={{ color: "var(--muted)", fontWeight: 500 }}>の</span>人口・世帯
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>28指標 · 全国比較ダッシュボード · 2024年</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">{React.cloneElement(Icons.Share, { className: "icon" })} 共有</button>
          <button className="btn btn-primary">
            {React.cloneElement(Icons.Download, { className: "icon" })}
            データ取得
          </button>
        </div>
      </header>

      {/* ★ Head-to-head selector */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="card" style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", background: "linear-gradient(90deg, var(--primary-50), #fff, #fef3c7)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10.5, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>A · このページ</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>{AREA.name}</div>
            <div className="muted" style={{ fontSize: 11 }}>人口 1,401万 · 全国1位</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--muted)" }}>VS</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10.5, color: "var(--warn)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>B · 比較対象</div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 4 }}>
              {[
                ["national", "全国平均"],
                ["regional", "関東平均"],
                ["kanagawa", "神奈川県"],
                ["chiba", "千葉県"],
                ["saitama", "埼玉県"],
              ].map(([k, lbl]) => (
                <button key={k} onClick={() => setCompareWith(k)} style={{
                  cursor: "pointer", font: "inherit",
                  padding: "5px 10px", borderRadius: 999,
                  fontSize: 11.5, fontWeight: 600,
                  background: compareWith === k ? "#b45309" : "#fff",
                  color: compareWith === k ? "#fff" : "var(--fg-2)",
                  border: `1px solid ${compareWith === k ? "#b45309" : "var(--border)"}`,
                }}>{lbl}</button>
              ))}
              <button className="btn btn-sm">+ 追加</button>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{compareWith === "national" ? "全国47都道府県の平均値" : "選択した都道府県の値"}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }}>
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Comparison KPI cards */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">主要指標の比較</div>
              <div className="seg">
                {[["total", "総数"], ["per_pop", "人口あたり"], ["per_area", "面積あたり"]].map(([k, lbl]) => (
                  <button key={k} className={"item" + (norm === k ? " active" : "")} onClick={() => setNorm(k)}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {AREA_KPIS.slice(0, 6).map((k, i) => {
                // synthetic comparison value
                const baseA = parseFloat(String(k.value).replace(/,/g, ""));
                const baseB = baseA * (0.4 + Math.random() * 0.4);
                const diff = ((baseA - baseB) / baseB * 100).toFixed(1);
                const isLeading = !k.isLow ? baseA > baseB : baseA < baseB;
                return (
                  <div key={i} className="card" style={{ padding: 14, display: "grid", gridTemplateColumns: "120px 1fr 1fr 80px", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{k.label}</div>
                    {/* A side */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 22, background: "var(--primary)", borderRadius: 3 }} />
                      <div>
                        <div className="mono" style={{ fontSize: 18, fontWeight: 800 }}>
                          {k.value}<span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 3 }}>{k.unit}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 10.5 }}>{AREA.name} · {k.rank}位/{k.total}</div>
                      </div>
                    </div>
                    {/* B side */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 22, background: "#b45309", borderRadius: 3 }} />
                      <div>
                        <div className="mono" style={{ fontSize: 18, fontWeight: 800 }}>
                          {(baseB).toFixed(baseB < 100 ? 2 : 0)}<span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 3 }}>{k.unit}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 10.5 }}>{compareWith === "national" ? "全国平均" : "比較対象"}</div>
                      </div>
                    </div>
                    {/* Diff */}
                    <div style={{
                      padding: "5px 10px", borderRadius: 8,
                      background: isLeading ? "#dcfce7" : "#fee2e2",
                      color: isLeading ? "#166534" : "#991b1b",
                      fontWeight: 700, fontSize: 13, textAlign: "center",
                    }} className="mono">
                      {isLeading ? "▲" : "▼"}{Math.abs(parseFloat(diff))}%
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Charts with comparison overlays */}
          <section>
            <div className="h2" style={{ marginBottom: 10 }}>チャート比較</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {["年齢階層別人口", "人口推移", "世帯構成", "出生・死亡推移"].map((t, i) => (
                <div key={i} className="card">
                  <div className="card-header" style={{ padding: "10px 14px" }}>
                    <div className="h3">{t}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "var(--primary)", color: "#fff", borderRadius: 3 }}>{AREA.name}</span>
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#b45309", color: "#fff", borderRadius: 3 }}>{compareWith === "national" ? "全国" : "比較"}</span>
                    </div>
                  </div>
                  <div style={{ height: 200, background: "var(--bg-subtle)", margin: 12, borderRadius: 8, position: "relative" }}>
                    {/* Comparison overlay placeholder */}
                    <svg viewBox="0 0 300 180" style={{ width: "100%", height: "100%" }}>
                      <path d="M 20 140 Q 80 60 150 90 T 280 50" stroke="#1d4ed8" strokeWidth="2.5" fill="none" />
                      <path d="M 20 130 Q 80 110 150 120 T 280 100" stroke="#b45309" strokeWidth="2.5" fill="none" strokeDasharray="4 3" />
                      <circle cx="280" cy="50" r="4" fill="#1d4ed8" />
                      <circle cx="280" cy="100" r="4" fill="#b45309" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rank table */}
          <section>
            <div className="h2" style={{ marginBottom: 10 }}>{AREA.name}が高い / 低い指標</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card">
                <div className="card-header" style={{ padding: "10px 14px" }}>
                  <div className="h3">🥇 上位ランクイン</div>
                  <span className="pill warn">7指標</span>
                </div>
                <div style={{ padding: 8 }}>
                  {AREA_RANKINGS_IN_CATEGORY.filter(r => r.rank <= 5).map((r, i) => (
                    <div key={i} style={{ padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{r.title}</span>
                      <span className="mono" style={{ fontWeight: 700, color: "#92400e" }}>{r.rank}位 · {r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-header" style={{ padding: "10px 14px" }}>
                  <div className="h3" style={{ color: "var(--danger)" }}>下位ランクイン</div>
                  <span className="pill" style={{ background: "#fee2e2", color: "#991b1b" }}>3指標</span>
                </div>
                <div style={{ padding: 8 }}>
                  {AREA_RANKINGS_IN_CATEGORY.filter(r => r.rank >= 43).map((r, i) => (
                    <div key={i} style={{ padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{r.title}</span>
                      <span className="mono" style={{ fontWeight: 700, color: "#991b1b" }}>{r.rank}位 · {r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Other categories */}
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">{AREA.name}の他のカテゴリ</div>
            </div>
            <div style={{ padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              {AREA_CATEGORIES.filter(c => !c.active).map(c => (
                <a key={c.key} href="#" style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 6,
                  color: "var(--fg)", textDecoration: "none", fontSize: 12.5,
                }}>
                  <span style={{ width: 20, textAlign: "center" }}>{c.icon}</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{c.count}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">市区町村</div>
              <span className="pill">{AREA.cities.length}</span>
            </div>
            <div style={{ padding: 6, maxHeight: 200, overflow: "auto" }}>
              {AREA.cities.slice(0, 14).map(c => (
                <a key={c} href="#" style={{ padding: "4px 10px", fontSize: 11.5, color: "var(--fg-2)", textDecoration: "none", display: "block" }}>{c}</a>
              ))}
            </div>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

window.AreaOptionC = AreaOptionC;
