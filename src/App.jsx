import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Trash2, Pencil, TrendingUp, TrendingDown,
  Wallet, Target, Percent, ArrowUpRight, ArrowDownRight, ChevronRight, Image as ImageIcon, ExternalLink
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => ({ value: localStorage.getItem(key) }),
    set: async (key, val) => {
      try {
        localStorage.setItem(key, val);
        return true;
      } catch (e) {
        return false;
      }
    }
  };
}

const COLORS = {
  bg: "#0B0E14",
  surface: "#121721",
  surfaceAlt: "#1A202C",
  border: "#232B3B",
  borderSoft: "#1B2230",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  gold: "#F59E0B",
  goldSoft: "rgba(245, 158, 11, 0.12)",
  gain: "#10B981",
  gainSoft: "rgba(16, 185, 129, 0.12)",
  loss: "#EF4444",
  lossSoft: "rgba(239, 68, 68, 0.12)",
};

const FONT_DISPLAY = "'Inter', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

function fmtMoney(n, opts = {}) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  return `${sign}${abs.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  })} €`;
}
function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(1)} %`;
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}

function computePnl(t) {
  if (t.exitPrice === "" || t.exitPrice === null || t.exitPrice === undefined) return null;
  const dir = t.direction === "short" ? -1 : 1;
  const raw = (Number(t.exitPrice) - Number(t.entryPrice)) * Number(t.quantity) * dir;
  return raw - Number(t.fees || 0);
}

const emptyForm = {
  symbol: "",
  direction: "long",
  entryDate: todayISO(),
  entryPrice: "",
  exitDate: "",
  exitPrice: "",
  quantity: "",
  fees: "",
  strategy: "",
  notes: "",
  screenshot: "",
};

export default function TradingJournal() {
  const [loaded, setLoaded] = useState(false);
  const [trades, setTrades] = useState([]);
  const [startingBalance, setStartingBalance] = useState(10000);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState("10000");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("journal-data");
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setTrades(parsed.trades || []);
          setStartingBalance(
            typeof parsed.startingBalance === "number" ? parsed.startingBalance : 10000
          );
          setBalanceDraft(String(parsed.startingBalance ?? 10000));
        }
      } catch (e) {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(
          "journal-data",
          JSON.stringify({ startingBalance, trades })
        );
      } catch (e) {}
    })();
  }, [trades, startingBalance, loaded]);

  const stats = useMemo(() => {
    const closed = trades
      .map((t) => ({ ...t, pnl: computePnl(t) }))
      .filter((t) => t.pnl !== null);
    const open = trades.filter((t) => computePnl(t) === null);

    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const wins = closed.filter((t) => t.pnl > 0);
    const losses = closed.filter((t) => t.pnl < 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : null;
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : null;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : null;
    const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : null;

    const sortedClosed = [...closed].sort(
      (a, b) => new Date(a.exitDate || a.entryDate) - new Date(b.exitDate || b.entryDate)
    );
    let running = startingBalance;
    const curve = [{ date: "Départ", balance: running }];
    sortedClosed.forEach((t) => {
      running += t.pnl;
      curve.push({ date: fmtDate(t.exitDate || t.entryDate), balance: Math.round(running * 100) / 100 });
    });

    const currentBalance = startingBalance + totalPnl;
    const pctChange = startingBalance ? (totalPnl / startingBalance) * 100 : 0;

    return {
      closedCount: closed.length,
      openCount: open.length,
      totalPnl,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      curve,
      currentBalance,
      pctChange,
    };
  }, [trades, startingBalance]);

  const sortedTrades = useMemo(
    () =>
      [...trades].sort(
        (a, b) => new Date(b.entryDate) - new Date(a.entryDate)
      ),
    [trades]
  );

  function openAddModal() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }
  function openEditModal(t) {
    setForm({
      symbol: t.symbol,
      direction: t.direction,
      entryDate: t.entryDate,
      entryPrice: t.entryPrice,
      exitDate: t.exitDate || "",
      exitPrice: t.exitPrice === undefined || t.exitPrice === null ? "" : t.exitPrice,
      quantity: t.quantity,
      fees: t.fees || "",
      strategy: t.strategy || "",
      notes: t.notes || "",
      screenshot: t.screenshot || "",
    });
    setEditingId(t.id);
    setModalOpen(true);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, screenshot: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }

  function submitForm() {
    if (!form.symbol.trim() || !form.entryDate || form.entryPrice === "" || form.quantity === "") return;
    const payload = {
      ...form,
      symbol: form.symbol.trim().toUpperCase(),
      entryPrice: Number(form.entryPrice),
      exitPrice: form.exitPrice === "" ? "" : Number(form.exitPrice),
      quantity: Number(form.quantity),
      fees: form.fees === "" ? 0 : Number(form.fees),
    };
    if (editingId) {
      setTrades((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...payload } : t)));
    } else {
      setTrades((prev) => [...prev, { id: uid(), ...payload }]);
    }
    setModalOpen(false);
  }

  function deleteTrade(id) {
    if (confirmDeleteId === id) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 3000);
    }
  }

  function saveBalance() {
    const v = Number(balanceDraft);
    if (!Number.isNaN(v) && v >= 0) setStartingBalance(v);
    setEditingBalance(false);
  }

  const positive = stats.totalPnl >= 0;
  const lineColor = positive ? COLORS.gain : COLORS.loss;

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_BODY, minHeight: "100vh", padding: "28px 20px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input, textarea, select { font-family: ${FONT_BODY}; }
        input::placeholder, textarea::placeholder { color: ${COLORS.textFaint}; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${COLORS.gold} !important; }
        .row-hover:hover { background: ${COLORS.surfaceAlt}; }
        .card-glow { transition: border-color 0.2s, box-shadow 0.2s; }
        .card-glow:hover { border-color: #2D3748; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
      `}</style>

      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#000" }}>JT</div>
            <div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, margin: 0, letterSpacing: "-0.02em" }}>Journal de Trading</h1>
              <span style={{ color: COLORS.textFaint, fontSize: 12 }}>Suivi de performance & analyses</span>
            </div>
          </div>
          <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(245, 158, 11, 0.2)" }}>
            <Plus size={16} strokeWidth={2.5} /> Nouveau trade
          </button>
        </div>

        {/* Top Section / Equity Curve */}
        <div className="card-glow" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 20, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ color: COLORS.textMuted, fontSize: 12.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              Solde du compte
              {!editingBalance && (
                <button onClick={() => { setBalanceDraft(String(startingBalance)); setEditingBalance(true); }} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer" }}>
                  <Pencil size={11} />
                </button>
              )}
            </div>
            {editingBalance ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input autoFocus type="number" value={balanceDraft} onChange={(e) => setBalanceDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveBalance()} style={{ width: 120, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "6px 10px", color: COLORS.text, fontFamily: FONT_MONO, fontSize: 16 }} />
                <button onClick={saveBalance} style={{ background: COLORS.gold, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>OK</button>
              </div>
            ) : (
              <div style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}>
                {stats.currentBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: lineColor, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 500 }}>
              {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {fmtMoney(stats.totalPnl)} ({fmtPct(stats.pctChange)})
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280, height: 120 }}>
            <div style={{ fontSize: 11.5, color: COLORS.textFaint, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Courbe d'équité</div>
            {stats.curve.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.curve} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["auto", "auto"]} hide />
                  <Tooltip contentStyle={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontFamily: FONT_MONO, color: COLORS.text }} formatter={(v) => [`${v.toLocaleString("fr-FR")} €`, "Solde"]} />
                  <Area type="monotone" dataKey="balance" stroke={lineColor} strokeWidth={2} fill={lineColor} fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "80%", display: "flex", alignItems: "center", justifyCenter: "center", color: COLORS.textFaint, fontSize: 12.5, border: `1px dashed ${COLORS.borderSoft}`, borderRadius: 8, padding: 12 }}>
                La courbe se dessinera automatiquement à chaque trade ajouté.
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard icon={<Target size={15} />} label="Taux de réussite" value={stats.winRate === null ? "—" : `${stats.winRate.toFixed(1)} %`} />
          <StatCard icon={<Percent size={15} />} label="Facteur de profit" value={stats.profitFactor === null ? "—" : stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} />
          <StatCard icon={<TrendingUp size={15} />} label="Gain moyen" value={fmtMoney(stats.avgWin)} tone="gain" />
          <StatCard icon={<TrendingDown size={15} />} label="Perte moyenne" value={fmtMoney(stats.avgLoss)} tone="loss" />
          <StatCard icon={<Wallet size={15} />} label="Trades clôturés" value={stats.closedCount} />
          <StatCard icon={<ChevronRight size={15} />} label="Positions ouvertes" value={stats.openCount} />
        </div>

        {/* Trades Table */}
        <div className="card-glow" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Historique des positions</span>
            <span style={{ fontSize: 12, color: COLORS.textFaint, fontWeight: 400 }}>{sortedTrades.length} position(s)</span>
          </div>

          {sortedTrades.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: COLORS.textMuted, fontSize: 13.5 }}>Aucun trade enregistré pour le moment.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: COLORS.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {["Date", "Symbole", "Sens", "Entrée", "Sortie", "Qté", "P&L", "Stratégie", "Graphique", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", fontWeight: 500, borderBottom: `1px solid ${COLORS.borderSoft}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTrades.map((t) => {
                    const pnl = computePnl(t);
                    const isOpen = pnl === null;
                    return (
                      <tr key={t.id} className="row-hover" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                        <td style={{ padding: "12px 16px", color: COLORS.textMuted, fontFamily: FONT_MONO }}>{fmtDate(t.entryDate)}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, letterSpacing: "0.02em" }}>{t.symbol}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: 6, color: t.direction === "long" ? COLORS.gain : COLORS.loss, background: t.direction === "long" ? COLORS.gainSoft : COLORS.lossSoft, fontWeight: 600, fontSize: 11.5 }}>
                            {t.direction === "long" ? "LONG" : "SHORT"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: FONT_MONO }}>{Number(t.entryPrice).toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "12px 16px", fontFamily: FONT_MONO }}>{isOpen ? <span style={{ color: COLORS.gold, fontSize: 12 }}>en cours</span> : Number(t.exitPrice).toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "12px 16px", fontFamily: FONT_MONO }}>{t.quantity}</td>
                        <td style={{ padding: "12px 16px", fontFamily: FONT_MONO, fontWeight: 600, color: isOpen ? COLORS.textFaint : pnl >= 0 ? COLORS.gain : COLORS.loss }}>
                          {isOpen ? "—" : fmtMoney(pnl)}
                        </td>
                        <td style={{ padding: "12px 16px", color: COLORS.textMuted }}>{t.strategy || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {t.screenshot ? (
                            <button onClick={() => setSelectedImg(t.screenshot)} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, color: COLORS.gold, borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                              <ImageIcon size={12} /> Voir
                            </button>
                          ) : (
                            <span style={{ color: COLORS.textFaint, fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={() => openEditModal(t)} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer" }}><Pencil size={13} /></button>
                            <button onClick={() => deleteTrade(t.id)} style={{ background: "none", border: "none", color: confirmDeleteId === t.id ? COLORS.loss : COLORS.textFaint, cursor: "pointer" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3, 7, 18, 0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{editingId ? "Modifier la position" : "Nouvelle position"}</div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Symbole (ex: GOLD, EURUSD)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, color: COLORS.text }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setForm({ ...form, direction: "long" })} style={{ flex: 1, padding: 9, background: form.direction === "long" ? COLORS.gainSoft : "transparent", color: form.direction === "long" ? COLORS.gain : COLORS.textMuted, border: `1px solid ${form.direction === "long" ? COLORS.gain : COLORS.border}`, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>LONG</button>
                <button onClick={() => setForm({ ...form, direction: "short" })} style={{ flex: 1, padding: 9, background: form.direction === "short" ? COLORS.lossSoft : "transparent", color: form.direction === "short" ? COLORS.loss : COLORS.textMuted, border: `1px solid ${form.direction === "short" ? COLORS.loss : COLORS.border}`, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>SHORT</button>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, color: COLORS.text }} />
                <input type="number" placeholder="Quantité / Lots" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, color: COLORS.text }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="number" placeholder="Prix d'entrée" value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, color: COLORS.text }} />
                <input type="number" placeholder="Prix de sortie (optionnel)" value={form.exitPrice} onChange={(e) => setForm({ ...form, exitPrice: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, color: COLORS.text }} />
              </div>
              <input placeholder="Stratégie (ex: FVG, Breaker Block, MSS)" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, color: COLORS.text }} />

              {/* Image Input */}
              <div style={{ background: COLORS.surfaceAlt, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Capture d'écran de l'analyse (TradingView / MT5)</div>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: 12, color: COLORS.textFaint }} />
                {form.screenshot && (
                  <div style={{ marginTop: 8, fontSize: 11, color: COLORS.gain }}>✓ Image chargée avec succès</div>
                )}
              </div>

              <button onClick={submitForm} style={{ marginTop: 8, background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", border: "none", borderRadius: 8, padding: 12, fontWeight: 700, cursor: "pointer" }}>Enregistrer le trade</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal Viewer */}
      {selectedImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setSelectedImg(null)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={selectedImg} alt="Capture trade" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12, border: `1px solid ${COLORS.border}` }} />
            <button onClick={() => setSelectedImg(null)} style={{ position: "absolute", top: -12, right: -12, background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  const color = tone === "gain" ? COLORS.gain : tone === "loss" ? COLORS.loss : COLORS.text;
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.textFaint, fontSize: 11.5, marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
