import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus, X, Trash2, Pencil, TrendingUp, TrendingDown,
  Wallet, Target, Percent, ArrowUpRight, ArrowDownRight, ChevronRight, Image as ImageIcon,
  Bot, Sparkles, CheckCircle2, AlertTriangle, Calendar, Filter, ArrowUpFromLine, ArrowDownToLine, Clipboard, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

// =========================================================================
// 1. CONFIGURATION SUPABASE
// =========================================================================
const SUPABASE_URL = "https://rvxfnfddtgjxspyihzbq.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_TCwIr7C0LvztrmbuxMm9Zg_3B_1X96U"; // <--- Colle ta clé sb_publishable_... ici

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Couleurs Style TradingView Dark Theme
const COLORS = {
  bg: "#131722",
  surface: "#1E222D",
  surfaceAlt: "#2A2E39",
  border: "#2A2E39",
  borderSoft: "#222631",
  text: "#D1D4DC",
  textMuted: "#787B86",
  textFaint: "#50535E",
  accent: "#2962FF",
  accentSoft: "rgba(41, 98, 255, 0.15)",
  gain: "#089981",
  gainSoft: "rgba(8, 153, 129, 0.15)",
  loss: "#F23645",
  lossSoft: "rgba(242, 54, 69, 0.15)",
  warning: "#F59E0B"
};

const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

const monthsList = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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
  if (t.type === "transfer") return null;
  if (t.exitPrice !== "" && t.exitPrice !== null && t.exitPrice !== undefined) {
    const dir = t.direction === "short" ? -1 : 1;
    const raw = (Number(t.exitPrice) - Number(t.entryPrice)) * Number(t.quantity) * dir;
    return raw - Number(t.fees || 0);
  }
  if (t.rawPnl !== "" && t.rawPnl !== null && t.rawPnl !== undefined) {
    return Number(t.rawPnl);
  }
  return null;
}

const emptyForm = {
  type: "trade",
  symbol: "XAUUSD (Gold)",
  direction: "long",
  entryDate: todayISO(),
  entryPrice: "",
  exitDate: "",
  exitPrice: "",
  quantity: "0.5",
  rawPnl: "",
  rr: "",
  fees: "",
  strategy: "Liquidity Sweep",
  notes: "",
  screenshot: "",
  transferType: "withdrawal",
  transferAmount: "",
};

function StatCard({ icon, label, value, tone }) {
  const color = tone === "gain" ? COLORS.gain : tone === "loss" ? COLORS.loss : "#F0F3FA";
  return (
    <div className="tv-card" style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.textMuted, fontSize: 11, marginBottom: 4 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trades, setTrades] = useState([]);
  const [startingBalance, setStartingBalance] = useState(10000);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState("10000");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  
  const [filterPair, setFilterPair] = useState("ALL");
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Charge les données depuis Supabase
  const fetchCloudData = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("journal_data")
        .select("content")
        .eq("id", 1)
        .single();

      if (data && data.content) {
        setTrades(data.content.trades || []);
        setStartingBalance(data.content.startingBalance ?? 10000);
        setBalanceDraft(String(data.content.startingBalance ?? 10000));
      }
    } catch (e) {
      console.error("Erreur de chargement des données Supabase:", e);
    } finally {
      setSaving(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  // Sauvegarde dans Supabase
  useEffect(() => {
    if (!loaded) return;
    const saveData = async () => {
      try {
        setSaving(true);
        await supabase
          .from("journal_data")
          .upsert({ id: 1, content: { startingBalance, trades } });
      } catch (e) {
        console.error("Erreur de sauvegarde Supabase:", e);
      } finally {
        setSaving(false);
      }
    };
    saveData();
  }, [trades, startingBalance, loaded]);

  const stats = useMemo(() => {
    const onlyTrades = trades.filter((t) => t.type !== "transfer");
    
    const closed = onlyTrades
      .map((t) => ({ ...t, pnl: computePnl(t) }))
      .filter((t) => t.pnl !== null);
    const open = onlyTrades.filter((t) => computePnl(t) === null);

    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const wins = closed.filter((t) => t.pnl > 0);
    const losses = closed.filter((t) => t.pnl < 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : null;
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : null;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : null;
    const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : null;

    const allEvents = [...trades].sort(
      (a, b) => new Date(a.exitDate || a.entryDate) - new Date(b.exitDate || b.entryDate)
    );

    let running = startingBalance;
    const curve = [{ date: "Départ", balance: running }];

    allEvents.forEach((item) => {
      if (item.type === "transfer") {
        const amt = Number(item.transferAmount || 0);
        running += item.transferType === "deposit" ? amt : -amt;
      } else {
        const pnl = computePnl(item);
        if (pnl !== null) running += pnl;
      }
      curve.push({ date: fmtDate(item.exitDate || item.entryDate), balance: Math.round(running * 100) / 100 });
    });

    const netTransfers = trades.reduce((acc, t) => {
      if (t.type === "transfer") {
        const amt = Number(t.transferAmount || 0);
        return acc + (t.transferType === "deposit" ? amt : -amt);
      }
      return acc;
    }, 0);

    const currentBalance = startingBalance + totalPnl + netTransfers;
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

  const aiFeedback = useMemo(() => {
    if (stats.closedCount === 0) {
      return {
        type: "info",
        title: "Assistant IA Trading",
        msg: "Enregistre tes premiers trades pour recevoir une analyse automatique de tes statistiques.",
      };
    }
    if (stats.winRate !== null && stats.winRate < 40 && (stats.profitFactor === null || stats.profitFactor < 1)) {
      return {
        type: "warning",
        title: "Attention au Risk Management",
        msg: `Win Rate à ${stats.winRate.toFixed(1)}% et Profit Factor faible (${stats.profitFactor ? stats.profitFactor.toFixed(2) : '—'}). Évite le sur-trading et valide tes setups HTF.`,
      };
    }
    if (stats.avgWin && stats.avgLoss && Math.abs(stats.avgLoss) > stats.avgWin * 1.5) {
      return {
        type: "danger",
        title: "Ratios R:R asymétriques",
        msg: `Tes pertes moyennes (${fmtMoney(stats.avgLoss)}) dépassent tes gains moyens (${fmtMoney(stats.avgWin)}). Respecte tes Stop Loss !`,
      };
    }
    if (stats.winRate && stats.winRate >= 50 && stats.totalPnl > 0) {
      return {
        type: "success",
        title: "Excellente discipline",
        msg: `Belle régularité avec ${stats.winRate.toFixed(1)}% de réussite et un P&L positif de ${fmtMoney(stats.totalPnl)}. Maintiens tes exécutions propres.`,
      };
    }
    return {
      type: "info",
      title: "Analyse des performances",
      msg: `${stats.closedCount} trade(s) clôturé(s). Taux de réussite : ${stats.winRate ? stats.winRate.toFixed(1) : '0'}%. Poursuis ton journal avec rigueur.`,
    };
  }, [stats]);

  const filteredTrades = useMemo(() => {
    let result = [...trades];
    if (filterPair !== "ALL") {
      result = result.filter(t => t.type !== "transfer" && t.symbol.toLowerCase().includes(filterPair.toLowerCase()));
    }
    return result.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [trades, filterPair]);

  function openAddModal() {
    setForm({ ...emptyForm, entryDate: todayISO() });
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(t) {
    setForm({
      type: t.type || "trade",
      symbol: t.symbol || "XAUUSD (Gold)",
      direction: t.direction || "long",
      entryDate: t.entryDate || todayISO(),
      entryPrice: t.entryPrice || "",
      exitDate: t.exitDate || "",
      exitPrice: t.exitPrice || "",
      quantity: t.quantity || "",
      rawPnl: t.rawPnl !== undefined ? t.rawPnl : "",
      rr: t.rr || "",
      fees: t.fees || "",
      strategy: t.strategy || "",
      notes: t.notes || "",
      screenshot: t.screenshot || "",
      transferType: t.transferType || "withdrawal",
      transferAmount: t.transferAmount || "",
    });
    setEditingId(t.id);
    setModalOpen(true);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) processImageFile(file);
  }

  function processImageFile(file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, screenshot: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          processImageFile(blob);
          e.preventDefault();
          break;
        }
      }
    }
  }

  function submitForm() {
    if (!form.entryDate) return;
    
    let payload = {};

    if (form.type === "transfer") {
      if (!form.transferAmount || Number(form.transferAmount) <= 0) return;
      payload = {
        type: "transfer",
        entryDate: form.entryDate,
        transferType: form.transferType,
        transferAmount: Number(form.transferAmount),
        notes: form.notes,
      };
    } else {
      if (!form.symbol.trim()) return;
      payload = {
        ...form,
        type: "trade",
        symbol: form.symbol.trim().toUpperCase(),
        entryPrice: form.entryPrice === "" ? "" : Number(form.entryPrice),
        exitPrice: form.exitPrice === "" ? "" : Number(form.exitPrice),
        quantity: form.quantity === "" ? "" : Number(form.quantity),
        rawPnl: form.rawPnl === "" ? "" : Number(form.rawPnl),
        rr: form.rr === "" ? "" : Number(form.rr),
        fees: form.fees === "" ? 0 : Number(form.fees),
      };
    }

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

  const cYear = calendarDate.getFullYear();
  const cMonth = calendarDate.getMonth();

  const changeMonth = (delta) => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() + delta);
    setCalendarDate(d);
  };

  const getDayPnL = (y, m, d) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTrades = trades.filter(t => t.type !== "transfer" && (t.exitDate || t.entryDate) === dateStr);
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((acc, t) => {
      const pnl = computePnl(t);
      return acc + (pnl !== null ? pnl : 0);
    }, 0);
  };

  if (!loaded) return <div style={{ background: COLORS.bg, color: COLORS.text, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Chargement du journal...</div>;

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
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 10px; }
        .cal-cell { background: ${COLORS.bg}; border: 1px solid ${COLORS.borderSoft}; border-radius: 6px; min-height: 65px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; }
        .paste-dropzone:focus { border-color: ${COLORS.accent} !important; background: rgba(41, 98, 255, 0.05); }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: COLORS.accent, color: "#fff", width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>RM</div>
            <div>
              <h1 style={{ fontWeight: 600, fontSize: 18, margin: 0, color: "#F0F3FA" }}>RM Trading Journal</h1>
              <span style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                Cloud Sync {saving ? <RefreshCw size={11} className="spin" style={{ color: COLORS.accent }} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.gain }}></span>}
              </span>
            </div>
          </div>
          <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accent, color: "#FFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={16} /> Nouveau / Modifier
          </button>
        </div>

        {/* Coach IA Feedback */}
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

        {/* Solde & Courbe d'Équité */}
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
                La courbe se mettra à jour à chaque trade clôturé ou retrait.
              </div>
            )}
          </div>
        </div>

        {/* Cartes KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          <StatCard icon={<Target size={14} />} label="Win Rate" value={stats.winRate === null ? "—" : `${stats.winRate.toFixed(1)} %`} />
          <StatCard icon={<Percent size={14} />} label="Profit Factor" value={stats.profitFactor === null ? "—" : stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} />
          <StatCard icon={<TrendingUp size={14} />} label="Gain Moyen" value={fmtMoney(stats.avgWin)} tone="gain" />
          <StatCard icon={<TrendingDown size={14} />} label="Perte Moyenne" value={fmtMoney(stats.avgLoss)} tone="loss" />
          <StatCard icon={<Wallet size={14} />} label="Clôturés" value={stats.closedCount} />
          <StatCard icon={<ChevronRight size={14} />} label="En Cours" value={stats.openCount} />
        </div>

        {/* Tableau Historique */}
        <div className="tv-card" style={{ overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, color: "#F0F3FA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Positions & Historique</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Filter size={13} style={{ color: COLORS.textMuted }} />
              <select value={filterPair} onChange={(e) => setFilterPair(e.target.value)} style={{ background: COLORS.surfaceAlt, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 12 }}>
                <option value="ALL">Toutes les paires</option>
                <option value="XAUUSD">XAUUSD (Gold)</option>
                <option value="EURUSD">EURUSD</option>
                <option value="GBPUSD">GBPUSD</option>
                <option value="BTCUSD">BTCUSD</option>
              </select>
            </div>
          </div>

          {filteredTrades.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>Aucune transaction enregistrée.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: COLORS.textMuted, fontSize: 11, borderBottom: `1px solid ${COLORS.border}` }}>
                    {["Date", "Type / Paire", "Sens", "P&L / Montant", "R:R", "Setup / Note", "Graphique", "Statut", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((t) => {
                    if (t.type === "transfer") {
                      const isWithdrawal = t.transferType === "withdrawal";
                      return (
                        <tr key={t.id} className="row-hover" style={{ borderBottom: `1px solid ${COLORS.borderSoft}`, background: "rgba(255,255,255,0.01)" }}>
                          <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontFamily: FONT_MONO }}>{fmtDate(t.entryDate)}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#F0F3FA", display: "flex", alignItems: "center", gap: 6 }}>
                            {isWithdrawal ? <ArrowUpFromLine size={14} style={{ color: COLORS.warning }} /> : <ArrowDownToLine size={14} style={{ color: COLORS.gain }} />}
                            {isWithdrawal ? "RETRAIT" : "DÉPÔT"}
                          </td>
                          <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>—</td>
                          <td style={{ padding: "10px 14px", fontFamily: FONT_MONO, fontWeight: 600, color: isWithdrawal ? COLORS.warning : COLORS.gain }}>
                            {isWithdrawal ? `−${t.transferAmount} €` : `+${t.transferAmount} €`}
                          </td>
                          <td style={{ padding: "10px 14px", color: COLORS.textFaint }}>—</td>
                          <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>{t.notes || "Transfert de capital"}</td>
                          <td style={{ padding: "10px 14px", color: COLORS.textFaint }}>—</td>
                          <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontSize: 11 }}>Capital</td>
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
                    }

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
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO, fontWeight: 600, color: isOpen ? COLORS.textMuted : pnl >= 0 ? COLORS.gain : COLORS.loss }}>
                          {isOpen ? <span style={{ color: COLORS.accent, fontSize: 11 }}>EN COURS</span> : fmtMoney(pnl)}
                        </td>
                        <td style={{ padding: "10px 14px", fontFamily: FONT_MONO }}>{t.rr ? `1:${t.rr}` : "—"}</td>
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
                        <td style={{ padding: "10px 14px" }}>
                          {isOpen ? (
                            <span style={{ color: COLORS.textFaint, fontSize: 11 }}>En cours</span>
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

        {/* Calendrier Trading */}
        <div className="tv-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#F0F3FA", display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={15} style={{ color: COLORS.accent }} /> Calendrier Trading ({monthsList[cMonth]} {cYear})
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => changeMonth(-1)} style={{ background: COLORS.surfaceAlt, color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>&lt;</button>
              <button onClick={() => setCalendarDate(new Date())} style={{ background: COLORS.surfaceAlt, color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Aujourd'hui</button>
              <button onClick={() => changeMonth(1)} style={{ background: COLORS.surfaceAlt, color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>&gt;</button>
            </div>
          </div>

          <div className="cal-grid">
            {weekdays.map(w => <div key={w} style={{ textAlign: "center", fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{w}</div>)}
            {(() => {
              const firstIdx = new Date(cYear, cMonth, 1).getDay();
              const offset = (firstIdx === 0 ? 6 : firstIdx - 1);
              const totalDays = new Date(cYear, cMonth + 1, 0).getDate();
              const cells = [];

              for (let i = 0; i < offset; i++) cells.push(<div key={`e-${i}`} />);

              for (let d = 1; d <= totalDays; d++) {
                const pnlVal = getDayPnL(cYear, cMonth, d);
                cells.push(
                  <div key={`d-${d}`} className="cal-cell">
                    <span style={{ fontSize: 11, fontWeight: "bold", color: COLORS.textMuted }}>{d}</span>
                    {pnlVal !== null ? (
                      <span style={{ fontSize: 11, fontWeight: "bold", color: pnlVal >= 0 ? COLORS.gain : COLORS.loss, background: pnlVal >= 0 ? COLORS.gainSoft : COLORS.lossSoft, padding: "2px 4px", borderRadius: 4, textAlign: "center" }}>
                        {pnlVal >= 0 ? `+${pnlVal.toFixed(0)}€` : `${pnlVal.toFixed(0)}€`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: COLORS.textFaint }}>—</span>
                    )}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      </div>

      {/* Modal Formulaire */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div className="tv-card" style={{ width: "100%", maxWidth: 480, padding: 22, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#F0F3FA" }}>{editingId ? "Modifier l'enregistrement" : "Nouveau Trade / Retrait"}</div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><X size={16} /></button>
            </div>

            <div style={{ display: "flex", background: COLORS.surfaceAlt, borderRadius: 6, padding: 3, marginBottom: 16 }}>
              <button
                onClick={() => setForm({ ...form, type: "trade" })}
                style={{
                  flex: 1, padding: "6px 0", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: form.type === "trade" ? COLORS.accent : "transparent",
                  color: form.type === "trade" ? "#FFF" : COLORS.textMuted
                }}
              >
                Trade
              </button>
              <button
                onClick={() => setForm({ ...form, type: "transfer" })}
                style={{
                  flex: 1, padding: "6px 0", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: form.type === "transfer" ? COLORS.accent : "transparent",
                  color: form.type === "transfer" ? "#FFF" : COLORS.textMuted
                }}
              >
                Retrait / Dépôt
              </button>
            </div>
            
            {form.type === "trade" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Paire / Actif (ex: XAUUSD, EURUSD)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} style={{ flex: 2, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
                  <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 12 }} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setForm({ ...form, direction: "long" })} style={{ flex: 1, padding: 8, background: form.direction === "long" ? COLORS.gainSoft : "transparent", color: form.direction === "long" ? COLORS.gain : COLORS.textMuted, border: `1px solid ${form.direction === "long" ? COLORS.gain : COLORS.border}`, borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>BUY (ACHAT)</button>
                  <button onClick={() => setForm({ ...form, direction: "short" })} style={{ flex: 1, padding: 8, background: form.direction === "short" ? COLORS.lossSoft : "transparent", color: form.direction === "short" ? COLORS.loss : COLORS.textMuted, border: `1px solid ${form.direction === "short" ? COLORS.loss : COLORS.border}`, borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>SELL (VENTE)</button>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" step="any" placeholder="P&L Direct (€) (ex: 250 ou -100)" value={form.rawPnl} onChange={(e) => setForm({ ...form, rawPnl: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
                  <input type="number" step="0.1" placeholder="R:R (ex: 2.0)" value={form.rr} onChange={(e) => setForm({ ...form, rr: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }} />
                </div>

                <select value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13 }}>
                  <option value="Liquidity Sweep">Liquidity Sweep</option>
                  <option value="Order Block">Order Block</option>
                  <option value="FVG (Fair Value Gap)">FVG (Fair Value Gap)</option>
                  <option value="Breaker Block">Breaker Block</option>
                </select>

                <textarea placeholder="Notes / Remarques sur la session..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 12 }} />

                <div 
                  tabIndex={0} 
                  onPaste={handlePaste} 
                  className="paste-dropzone"
                  style={{ background: COLORS.surfaceAlt, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: "12px 10px", textAlign: "center", outline: "none", cursor: "pointer" }}
                >
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Clipboard size={14} style={{ color: COLORS.accent }} />
                    <span>Colle l'image ici (<b>Ctrl + V</b>) ou choisis un fichier</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: 11, color: COLORS.textMuted }} />
                  {form.screenshot && (
                    <div style={{ marginTop: 8, fontSize: 11, color: COLORS.gain, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <CheckCircle2 size={12} /> Image attachée avec succès
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setForm({ ...form, transferType: "withdrawal" })} style={{ flex: 1, padding: 10, background: form.transferType === "withdrawal" ? "rgba(245, 158, 11, 0.15)" : "transparent", color: form.transferType === "withdrawal" ? COLORS.warning : COLORS.textMuted, border: `1px solid ${form.transferType === "withdrawal" ? COLORS.warning : COLORS.border}`, borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <ArrowUpFromLine size={14} /> RETRAIT DE CAPITAL
                  </button>
                  <button onClick={() => setForm({ ...form, transferType: "deposit" })} style={{ flex: 1, padding: 10, background: form.transferType === "deposit" ? COLORS.gainSoft : "transparent", color: form.transferType === "deposit" ? COLORS.gain : COLORS.textMuted, border: `1px solid ${form.transferType === "deposit" ? COLORS.gain : COLORS.border}`, borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <ArrowDownToLine size={14} /> DÉPÔT DE CAPITAL
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" step="any" placeholder="Montant en (€)" value={form.transferAmount} onChange={(e) => setForm({ ...form, transferAmount: e.target.value })} style={{ flex: 2, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 13, fontFamily: FONT_MONO }} />
                  <input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} style={{ flex: 1, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 12 }} />
                </div>

                <textarea placeholder="Motif ou note sur le transfert..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 8, color: COLORS.text, fontSize: 12 }} />
              </div>
            )}

            <button onClick={submitForm} style={{ marginTop: 14, width: "100%", background: COLORS.accent, color: "#fff", border: "none", borderRadius: 4, padding: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              {editingId ? "Enregistrer les modifications" : "Valider l'opération"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Visualisation Image */}
      {selectedImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button onClick={() => setSelectedImg(null)} style={{ position: "absolute", top: -35, right: 0, background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <X size={24} />
            </button>
            <img src={selectedImg} alt="Graphique du trade" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
          </div>
        </div>
      )}
    </div>
  );
}
