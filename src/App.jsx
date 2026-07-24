import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Trash2, Pencil, TrendingUp, TrendingDown,
  Wallet, Target, Percent, ArrowUpRight, ArrowDownRight, ChevronRight, Image as ImageIcon,
  Bot, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert
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

// Couleurs Style TradingView Dark Theme
const COLORS = {
  bg: "#131722",          // Fond principal TradingView
  surface: "#1E222D",     // Cartes & Panneaux
  surfaceAlt: "#2A2E39",  // Éléments secondaires / Hovers
  border: "#2A2E39",      // Bordures
  borderSoft: "#222631",
  text: "#D1D4DC",        // Texte principal
  textMuted: "#787B86",   // Texte secondaire
  textFaint: "#50535E",
  accent: "#2962FF",      // Bleu TradingView
  accentSoft: "rgba(41, 98, 255, 0.15)",
  gain: "#089981",        // Vert TradingView
  gainSoft: "rgba(8, 153, 129, 0.15)",
  loss: "#F23645",        // Rouge TradingView
  lossSoft: "rgba(242, 54, 69, 0.15)",
};

const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

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
      closed,
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

  // Analyse IA basique des performances
  const aiFeedback = useMemo(() => {
    if (stats.closedCount === 0) {
      return {
        type: "info",
        title: "Assistant IA TradingView",
        msg: "Enregistre tes premiers trades clôturés pour recevoir une analyse automatique de ton exécution et de tes statistiques.",
      };
    }

    if (stats.winRate !== null && stats.winRate < 40 && (stats.profitFactor === null || stats.profitFactor < 1)) {
      return {
        type: "warning",
        title: "Attention au Risk Management",
        msg: `Ton Win Rate est à ${stats.winRate.toFixed(1)}% et ton Profit Factor est faible (${stats.profitFactor ? stats.profitFactor.toFixed(2) : '—'}). Attention au sur-trading ou aux sorties prématurées sur tes gagnants.`,
      };
    }

    if (stats.avgWin && stats.avgLoss && Math.abs(stats.avgLoss) > stats.avgWin * 1.5) {
      return {
        type: "danger",
        title: "Ratios R:R asymétriques",
        msg: `Tes pertes moyennes (${fmtMoney(stats.avgLoss)}) dépassent largement tes gains moyens (${fmtMoney(stats.avgWin)}). Assure-toi de respecter scrupuleusement tes Stop Loss !`,
      };
    }

    if (stats.winRate && stats.winRate >= 50 && stats.totalPnl > 0) {
      return {
        type: "success",
        title: "Excellente discipline",
        msg: `Belle régularité avec ${stats.winRate.toFixed(1)}% de réussite et un P&L positif de ${fmtMoney(stats.totalPnl)}. Maintiens tes setups de haute qualité !`,
      };
    }

    return {
      type: "info",
      title: "Analyse des statistiques",
      msg: `Tu as ${stats.closedCount} trade(s) clôturé(s). Taux de réussite actuel : ${stats.winRate ? stats.winRate.toFixed(1) : '0'}%. Poursuis le journal de bord rigoureux.`,
    };
  }, [stats]);

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
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_BODY, minHeight: "100vh", padding: "20px 24px 60px" }}>
      <style>{`
        * { box-sizing: border-box; }
        input, textarea, select { font-family: ${FONT_BODY}; }
        input::placeholder, textarea::placeholder { color: ${COLORS.textFaint}; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${COLORS.accent} !important; }
        .row-hover:hover { background: ${COLORS.surfaceAlt}; }
        .tv-card { background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 8px; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Navigation Bar TradingView Style */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: COLORS.accent, color: "#fff", width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>TV</div>
            <div>
              <h1 style={{ fontWeight: 600, fontSize: 18, margin: 0, color: "#F0F3FA" }}>Trading Journal AI</h1>
              <span style={{ color: COLORS.textMuted, fontSize: 12 }}>TradingView Terminal Style</span>
            </div>
          </div>
          <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accent, color: "#FFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={16} /> Nouveau Trade
          </button>
        </div>

        {/* Coach IA Feedback Banner */}
        <div className="tv-card" style={{ padding: "14px 18px", marginBottom: 20, borderLeft: `4px solid ${aiFeedback.type === 'danger' ? COLORS.loss : aiFeedback.type === 'warning' ? '#F59E0B' : aiFeedback.type === 'success' ? COLORS.gain : COLORS.accent}`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ color: aiFeedback.type === 'danger' ? COLORS.loss : aiFeedback.type === 'warning' ? '#F59E0B' : aiFeedback.type === 'success' ? COLORS.gain : COLORS.accent }}>
            <Bot size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#F0F3FA", display: "flex", alignItems: "center", gap: 6 }}>
              {aiFeedback.title}
              <Sparkles size={13} style={{ color: COLORS.accent }} />
            </div>
            <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 2 }}>{aiFeedback.msg}</div>
          </div>
        </div>

        {/* Top Section / Equity Curve */}
        <div className="tv-card" style={{ padding: "20px 24px", marginBottom: 20, display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              SOLDE DU COMPTE
              {!editingBalance && (
                <button onClick={() => { setBalanceDraft(String(startingBalance)); setEditingBalance(true); }} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer" }}>
                  <Pencil size={11} />
                </button>
              )}
            </div>
            {editingBalance ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input autoFocus type="number" value={balanceDraft} onChange={(e) => setBalanceDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveBalance()} style={{ width: 120, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "4px 8px", color: COLORS.text, fontFamily: FONT_MONO, fontSize: 15 }} />
                <button onClick={saveBalance} style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>OK</button>
              </div>
            ) : (
              <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: "#F0F3FA" }}>
                {stats.currentBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: lineColor, fontSize: 13, fontFamily: FONT_MONO }}>
              {positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              {fmtMoney(stats.totalPnl)} ({fmtPct(stats.pctChange)})
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280, height: 110 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, letterSpacing: "0.05em" }}>PERFORMANCE D'ÉQUITÉ</div>
            {stats.curve.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.curve} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["auto", "auto"]} hide />
                  <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, fontFamily: FONT_MONO, color: COLORS.text }} formatter={(v) => [`${v.toLocaleString("fr-FR")} €`, "Solde"]} />
                  <Area type="monotone" dataKey="balance" stroke={lineColor} strokeWidth={2} fill={lineColor} fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "80%", display: "flex", alignItems: "center", color: COLORS.textFaint, fontSize: 12, border: `1px dashed ${COLORS.borderSoft}`, borderRadius: 6, padding: 12 }}>
                La courbe se mettra à jour à chaque trade clôturé.
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid TradingView Style */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          <StatCard icon={<Target size={14} />} label="Taux de réussite" value={stats.winRate === null ? "—" : `${stats.winRate.toFixed(1)} %`} />
          <StatCard icon={<Percent size={14} />} label="Profit Factor" value={stats.profitFactor === null ? "—" : stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} />
          <StatCard icon={<TrendingUp size={14} />} label="Gain Moyen" value={fmtMoney(stats.avgWin)} tone="gain" />
          <StatCard icon={<TrendingDown size={14} />} label="Perte Moyenne" value={fmtMoney(stats.avgLoss)} tone="loss" />
          <StatCard icon={<Wallet size={14} />} label="Clôturés" value={stats.closedCount} />
          <StatCard icon={<ChevronRight size={14} />} label="En Cours" value={stats.openCount} />
        </div>

        {/* Table TradingView */}
        <div className="tv-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, color: "#F0F3FA", display: "flex", justifyContent: "space-between" }}>
            <span>Positions & Historique</span>
            <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 400 }}>{sortedTrades.length} ordre(s)</span>
          </div>

          {sortedTrades.length === 0 ? (
            <div style={{ padding: "50px 20px", textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>Aucun trade enregistré. Cliquez sur "+ Nouveau Trade".</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: COLORS.textMuted, fontSize: 11, borderBottom: `1px solid ${COLORS.border}` }}>
                    {["Date", "Paire", "Sens", "Prix Entrée", "Prix Sortie", "Qté", "P&L", "Stratégie", "Graphique", "Analyse IA", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTrades.map((t) => {
                    const pnl = computePnl(t);
                    const isOpen = pnl === null;
                    const isGoodTrade = pnl !== null && pnl > 0;
                    return (
                      <tr key={t.id} className="row-hover" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                        <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontFamily: FONT_MONO }}>{fmtDate(t.entryDate)}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#F0F3FA" }}>{t.symbol}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "2px 6px", borderRadius: 4, color: t.direction === "long" ? COLORS.gain : COLORS.loss, background: t.direction === "long" ? COLORS.gainSoft : COLORS.lossSoft, fontWeight: 600, fontSize: 11 }}>
                            {t.direction === "long" ? "BUY" : "SELL"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO }}>{Number(t.entryPrice).toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO }}>{isOpen ? <span style={{ color: COLORS.accent, fontSize: 11.5 }}>EN COURS</span> : Number(t.exitPrice).toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO }}>{t.quantity}</td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO, fontWeight: 600, color: isOpen ? COLORS.textMuted : pnl >= 0 ? COLORS.gain : COLORS.loss }}>
                          {isOpen ? "—" : fmtMoney(pnl)}
                        </td>
                        <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>{t.strategy || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          {t.screenshot ? (
                            <button onClick={() => setSelectedImg(t.screenshot)} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, color: COLORS.accent, borderRadius: 4, padding: "3px 7px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                              <ImageIcon size={12} /> Voir
                            </button>
                          ) : (
                            <span style={{ color: COLORS.textFaint }}>—</span>
                          )}
                        </td>
                        {/* Remarque IA par trade */}
                        <td style={{ padding: "10px 14px" }}>
                          {isOpen ? (
                            <span style={{ color: COLORS.textFaint, fontSize: 11 }}>Position active</span>
                          ) : isGoodTrade ? (
                            <span style={{ color: COLORS.gain, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                              <CheckCircle2 size={12} /> Bon Trade
                            </span>
                          ) : (
                            <span style={{ color: COLORS.loss, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                              <AlertTriangle size={12} /> À réviser
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={() => openEditModal(t)} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><Pencil size={13} /></button>
                            <button onClick={() => deleteTrade(t.id)} style={{ background: "none", border: "none", color: confirmDeleteId === t.id ? COLORS.loss : COLORS.textMuted, cursor: "pointer" }}>
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

      {/* Modal Form TradingView */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div className="tv-card" style={{ width: "100%", maxWidth: 460, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#F0F3FA" }}>{editingId ? "Modifier la Position" : "Nouvelle Position"}</div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Symbole (ex: GOLD, EURUSD, BTCUSD)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setForm({ ...form, direction: "long" })} style={{ flex: 1, padding: 8, background: form.direction === "long" ? COLORS.gainSoft : "transparent", color: form.direction === "long" ? COLORS.gain : COLORS.textMuted, border: `1px solid ${form.direction === "long" ? COLORS.gain : COLORS.border}`, borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>ACHAT (BUY)</button>
                <button onClick={() => setForm({ ...form, direction: "short" })} style={{ flex: 1, padding: 8, background: form.direction === "short" ? COLORS.lossSoft : "transparent", color: form.direction === "short" ? COLORS.loss : COLORS.textMuted, border: `1px solid ${form.direction === "short" ? COLORS.loss : COLORS.border}`, borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>VENTE (SELL)</button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
                <input type="number" placeholder="Taille / Lots" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" placeholder="Prix d'entrée" value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
                <input type="number" placeholder="Prix de sortie (si fermé)" value={form.exitPrice} onChange={(e) => setForm({ ...form, exitPrice: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
              </div>
              <input placeholder="Setup / Stratégie (ex: FVG, ICT, Breaker)" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />

              {/* Import image TradingView */}
              <div style={{ background: COLORS.surfaceAlt, border: `1px dashed ${COLORS.border}`, borderRadius: 4, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginBottom: 4 }}>Capture d'écran du graphique (TradingView / MT5)</div>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: 11, color: COLORS.textMuted }} />
                {form.screenshot && (
                  <div style={{ marginTop: 6, fontSize: 11, color: COLORS.gain }}>✓ Screenshot attaché</div>
                )}
              </div>

              <button onClick={submitForm} style={{ marginTop: 6, background: COLORS.accent, color: "#FFF", border: "none", borderRadius: 4, padding: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Enregistrer l'ordre</button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Viewer */}
      {selectedImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setSelectedImg(null)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={selectedImg} alt="Graphique Trade" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
            <button onClick={() => setSelectedImg(null)} style={{ position: "absolute", top: -10, right: -10, background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text, borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  const color = tone === "gain" ? COLORS.gain : tone === "loss" ? COLORS.loss : "#F0F3FA";
  return (
    <div className="tv-card" style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
