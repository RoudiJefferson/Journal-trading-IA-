import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Trash2, Pencil, TrendingUp, TrendingDown,
  Wallet, Target, Percent, ArrowUpRight, ArrowDownRight, ChevronRight
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
  bg: "#0E1015",
  surface: "#161923",
  surfaceAlt: "#1D2130",
  border: "#282D3D",
  borderSoft: "#20242F",
  text: "#E9EBF1",
  textMuted: "#868EA3",
  textFaint: "#565D70",
  gold: "#E8B23E",
  goldSoft: "rgba(232,178,62,0.12)",
  gain: "#2FC59B",
  gainSoft: "rgba(47,197,155,0.12)",
  loss: "#EF5D5D",
  lossSoft: "rgba(239,93,93,0.12)",
};

const FONT_DISPLAY = "'Space Grotesk', sans-serif";
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
  const [saveError, setSaveError] = useState(false);

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
        const result = await window.storage.set(
          "journal-data",
          JSON.stringify({ startingBalance, trades })
        );
        setSaveError(!result);
      } catch (e) {
        setSaveError(true);
      }
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
    });
    setEditingId(t.id);
    setModalOpen(true);
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input, textarea, select { font-family: ${FONT_BODY}; }
        input::placeholder, textarea::placeholder { color: ${COLORS.textFaint}; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${COLORS.gold} !important; }
        .row-hover:hover { background: ${COLORS.surfaceAlt}; }
        .btn-ghost:hover { background: ${COLORS.surfaceAlt}; }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, margin: 0 }}>Grand Livre</h1>
            <span style={{ color: COLORS.textFaint, fontSize: 13 }}>journal de trading</span>
          </div>
          <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.gold, color: "#161923", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={16} strokeWidth={2.5} /> Nouveau trade
          </button>
        </div>

        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "22px 24px", marginBottom: 18, display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ color: COLORS.textMuted, fontSize: 12.5, marginBottom: 6 }}>
              Solde du compte
              {!editingBalance && (
                <button onClick={() => { setBalanceDraft(String(startingBalance)); setEditingBalance(true); }} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", marginLeft: 6 }}>
                  <Pencil size={11} />
                </button>
              )}
            </div>
            {editingBalance ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input autoFocus type="number" value={balanceDraft} onChange={(e) => setBalanceDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveBalance()} style={{ width: 110, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", color: COLORS.text, fontFamily: FONT_MONO, fontSize: 15 }} />
                <button onClick={saveBalance} style={{ background: COLORS.gold, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>OK</button>
              </div>
            ) : (
              <div style={{ fontFamily: FONT_MONO, fontSize: 30, fontWeight: 600 }}>
                {stats.currentBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: lineColor, fontSize: 13, fontFamily: FONT_MONO }}>
              {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {fmtMoney(stats.totalPnl)} ({fmtPct(stats.pctChange)})
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260, height: 100 }}>
            {stats.curve.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.curve} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["auto", "auto"]} hide />
                  <Tooltip contentStyle={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontFamily: FONT_MONO }} formatter={(v) => [`${v.toLocaleString("fr-FR")} €`, "Solde"]} />
                  <Area type="monotone" dataKey="balance" stroke={lineColor} strokeWidth={2} fill={lineColor} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", color: COLORS.textFaint, fontSize: 13 }}>
                La courbe d'équité apparaîtra après votre premier trade clôturé.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
          <StatCard icon={<Target size={15} />} label="Taux de réussite" value={stats.winRate === null ? "—" : `${stats.winRate.toFixed(1)} %`} />
          <StatCard icon={<Percent size={15} />} label="Facteur de profit" value={stats.profitFactor === null ? "—" : stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} />
          <StatCard icon={<TrendingUp size={15} />} label="Gain moyen" value={fmtMoney(stats.avgWin)} tone="gain" />
          <StatCard icon={<TrendingDown size={15} />} label="Perte moyenne" value={fmtMoney(stats.avgLoss)} tone="loss" />
          <StatCard icon={<Wallet size={15} />} label="Trades clôturés" value={stats.closedCount} />
          <StatCard icon={<ChevronRight size={15} />} label="Positions ouvertes" value={stats.openCount} />
        </div>

        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13.5, fontWeight: 600, fontFamily: FONT_DISPLAY }}>
            Historique des trades
          </div>

          {sortedTrades.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: COLORS.textMuted }}>Aucun trade enregistré</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: COLORS.textFaint, fontSize: 11, textTransform: "uppercase" }}>
                    {["Date", "Symbole", "Sens", "Entrée", "Sortie", "Qté", "P&L", "Stratégie", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontWeight: 500, borderBottom: `1px solid ${COLORS.borderSoft}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTrades.map((t) => {
                    const pnl = computePnl(t);
                    const isOpen = pnl === null;
                    return (
                      <tr key={t.id} className="row-hover" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                        <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontFamily: FONT_MONO }}>{fmtDate(t.entryDate)}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{t.symbol}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "2px 7px", borderRadius: 5, color: t.direction === "long" ? COLORS.gain : COLORS.loss, background: t.direction === "long" ? COLORS.gainSoft : COLORS.lossSoft, fontWeight: 600 }}>
                            {t.direction === "long" ? "Long" : "Short"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO }}>{Number(t.entryPrice).toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO }}>{isOpen ? <span style={{ color: COLORS.gold }}>ouvert</span> : Number(t.exitPrice).toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO }}>{t.quantity}</td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO, fontWeight: 600, color: isOpen ? COLORS.textFaint : pnl >= 0 ? COLORS.gain : COLORS.loss }}>
                          {isOpen ? "—" : fmtMoney(pnl)}
                        </td>
                        <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>{t.strategy || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
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

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,7,10,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, width: "100%", maxWidth: 460, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{editingId ? "Modifier" : "Nouveau trade"}</div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Symbole (ex: GOLD, EURUSD)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9, color: COLORS.text }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setForm({ ...form, direction: "long" })} style={{ flex: 1, padding: 8, background: form.direction === "long" ? COLORS.gainSoft : "transparent", color: form.direction === "long" ? COLORS.gain : COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>Long</button>
                <button onClick={() => setForm({ ...form, direction: "short" })} style={{ flex: 1, padding: 8, background: form.direction === "short" ? COLORS.lossSoft : "transparent", color: form.direction === "short" ? COLORS.loss : COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>Short</button>
              </div>
              <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9, color: COLORS.text }} />
              <input type="number" placeholder="Prix d'entrée" value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9, color: COLORS.text }} />
              <input type="number" placeholder="Prix de sortie (laisser vide si ouvert)" value={form.exitPrice} onChange={(e) => setForm({ ...form, exitPrice: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9, color: COLORS.text }} />
              <input type="number" placeholder="Quantité / Lots" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9, color: COLORS.text }} />
              <input placeholder="Stratégie (ex: FVG, Breaker, MSS)" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 9, color: COLORS.text }} />
              <button onClick={submitForm} style={{ marginTop: 10, background: COLORS.gold, color: "#161923", border: "none", borderRadius: 8, padding: 11, fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
            </div>
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
      <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
