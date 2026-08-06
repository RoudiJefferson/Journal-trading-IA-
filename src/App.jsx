import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// =========================================================================
// CONFIGURATION SUPABASE
// =========================================================================
const SUPABASE_URL = "https://rvxfnfddtgjxspyihzbq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TCwIr7C0LvztrmbuxMm9Zg_3B_1X96U";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

function fmtMoney(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "0.00 €";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trades, setTrades] = useState([]);
  const [startingBalance, setStartingBalance] = useState(10000);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState('journal'); // 'journal', 'calendar', 'analytics'

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  // Form State
  const [formType, setFormType] = useState('trade'); // 'trade' | 'transfer'
  const [symbol, setSymbol] = useState('XAUUSD');
  const [direction, setDirection] = useState('long');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [rawPnl, setRawPnl] = useState('');
  const [rr, setRr] = useState('');
  const [strategy, setStrategy] = useState('ICT / Liquidity Sweep');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState('');

  // Transfer State
  const [transferType, setTransferType] = useState('deposit');
  const [transferAmount, setTransferAmount] = useState('');

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // 1. Chargement Supabase / LocalStorage
  useEffect(() => {
    const loadData = async () => {
      setSaving(true);
      try {
        const { data } = await supabase.from('journal_data').select('content').eq('id', 1).single();
        if (data && data.content) {
          setTrades(data.content.trades || []);
          setStartingBalance(data.content.startingBalance ?? 10000);
        } else {
          const local = localStorage.getItem('rm_trading_journal');
          if (local) {
            const parsed = JSON.parse(local);
            setTrades(parsed.trades || []);
            setStartingBalance(parsed.startingBalance || 10000);
          }
        }
      } catch (err) {
        console.error("Erreur chargement:", err);
      }
      setSaving(false);
      setLoaded(true);
    };
    loadData();
  }, []);

  // 2. Sauvegarde Auto
  useEffect(() => {
    if (!loaded) return;
    const saveData = async () => {
      setSaving(true);
      const payload = { startingBalance, trades };
      localStorage.setItem('rm_trading_journal', JSON.stringify(payload));
      try {
        await supabase.from('journal_data').upsert({ id: 1, content: payload });
      } catch (err) {
        console.error("Erreur sauvegarde:", err);
      }
      setSaving(false);
    };
    saveData();
  }, [trades, startingBalance, loaded]);

  // 3. Capture Ctrl+V globale
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (!modalOpen || formType !== 'trade') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          const reader = new FileReader();
          reader.onloadend = () => setScreenshot(reader.result);
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [modalOpen, formType]);

  // 4. Moteur Analytics & KPIs Pro
  const analytics = useMemo(() => {
    let currentBalance = startingBalance;
    let totalPnl = 0;
    let wins = [];
    let losses = [];
    let equityCurve = [{ date: 'Départ', balance: startingBalance }];

    // Tri chrono
    const sorted = [...trades].sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));

    sorted.forEach(t => {
      if (t.type === 'transfer') {
        const amt = Number(t.transferAmount || 0);
        currentBalance += t.transferType === 'deposit' ? amt : -amt;
      } else {
        const pnl = Number(t.rawPnl || 0);
        totalPnl += pnl;
        currentBalance += pnl;
        if (pnl > 0) wins.push(pnl);
        if (pnl < 0) losses.push(Math.abs(pnl));
      }
      equityCurve.push({ date: t.entryDate, balance: currentBalance });
    });

    const totalTrades = wins.length + losses.length;
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const totalWinsAmount = wins.reduce((a, b) => a + b, 0);
    const totalLossesAmount = losses.reduce((a, b) => a + b, 0);
    const profitFactor = totalLossesAmount > 0 ? (totalWinsAmount / totalLossesAmount) : totalWinsAmount > 0 ? 99 : 0;
    const avgWin = wins.length > 0 ? totalWinsAmount / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLossesAmount / losses.length : 0;

    return {
      currentBalance,
      totalPnl,
      winRate,
      profitFactor,
      totalTrades,
      avgWin,
      avgLoss,
      equityCurve
    };
  }, [trades, startingBalance]);

  // 5. Calculs Calendrier Mensuel
  const calendarData = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyPnl = {};
    let monthTotalPnl = 0;

    trades.forEach(t => {
      if (t.type === 'trade') {
        const dateStr = t.entryDate;
        const pnl = Number(t.rawPnl || 0);
        const tDate = new Date(dateStr);
        if (tDate.getFullYear() === year && tDate.getMonth() === month) {
          dailyPnl[dateStr] = (dailyPnl[dateStr] || 0) + pnl;
          monthTotalPnl += pnl;
        }
      }
    });

    return { firstDay, daysInMonth, dailyPnl, monthTotalPnl, year, month };
  }, [trades, currentMonthDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let newEntry = {};

    if (formType === 'transfer') {
      if (!transferAmount) return;
      newEntry = {
        id: uid(),
        type: 'transfer',
        entryDate,
        transferType,
        transferAmount: Number(transferAmount),
        notes
      };
    } else {
      if (!symbol) return;
      newEntry = {
        id: uid(),
        type: 'trade',
        symbol: symbol.toUpperCase(),
        direction,
        entryDate,
        rawPnl: rawPnl === '' ? 0 : Number(rawPnl),
        rr: rr === '' ? '' : Number(rr),
        strategy,
        notes,
        screenshot
      };
    }

    setTrades([newEntry, ...trades]);
    setModalOpen(false);
    setRawPnl('');
    setNotes('');
    setScreenshot('');
    setTransferAmount('');
  };

  const deleteTrade = (id) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  return (
    <div style={{ backgroundColor: '#0e1117', color: '#c9d1d9', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* HEADER TOP BAR */}
      <header style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#238636' }}></div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f0f6fc', letterSpacing: '0.5px' }}>
            RM TRADING PRO JOURNAL
          </h1>
          <span style={{ fontSize: '11px', color: '#8b949e', backgroundColor: '#21262d', padding: '3px 8px', borderRadius: '12px', border: '1px solid #30363d' }}>
            {saving ? '⏳ Sync Cloud...' : '🟢 Supabase Direct'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setHideBalance(!hideBalance)} style={{ backgroundColor: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
            {hideBalance ? '👁️ Afficher Solde' : '🙈 Masquer Solde'}
          </button>
          <button onClick={() => setModalOpen(true)} style={{ backgroundColor: '#238636', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
            + Nouvelle Opération / Dépôt
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px' }}>
        
        {/* EXECUTIVE METRICS BAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', textTransform: 'uppercase' }}>SOLDE COMPTE</span>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#f0f6fc', marginTop: '4px' }}>
              {hideBalance ? '•••••• €' : `${analytics.currentBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
            </div>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', textTransform: 'uppercase' }}>P&L NET TOTAL</span>
            <div style={{ fontSize: '22px', fontWeight: '700', color: analytics.totalPnl >= 0 ? '#3fb950' : '#f85149', marginTop: '4px' }}>
              {hideBalance ? '•••••• €' : fmtMoney(analytics.totalPnl)}
            </div>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', textTransform: 'uppercase' }}>WIN RATE</span>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#f0f6fc', marginTop: '4px' }}>
              {analytics.winRate.toFixed(1)} %
            </div>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', textTransform: 'uppercase' }}>PROFIT FACTOR</span>
            <div style={{ fontSize: '22px', fontWeight: '700', color: analytics.profitFactor >= 1.5 ? '#3fb950' : '#e3b341', marginTop: '4px' }}>
              {analytics.profitFactor.toFixed(2)}
            </div>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', textTransform: 'uppercase' }}>GAIN / PERTE MOY.</span>
            <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '6px' }}>
              <span style={{ color: '#3fb950' }}>+{analytics.avgWin.toFixed(0)}€</span> / <span style={{ color: '#f85149' }}>-{analytics.avgLoss.toFixed(0)}€</span>
            </div>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #30363d', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('journal')}
            style={{ padding: '10px 18px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'journal' ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === 'journal' ? '#58a6ff' : '#8b949e', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            📋 Journal des Ordres & Mouvements
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            style={{ padding: '10px 18px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'calendar' ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === 'calendar' ? '#58a6ff' : '#8b949e', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            📅 Calendrier P&L
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{ padding: '10px 18px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'analytics' ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === 'analytics' ? '#58a6ff' : '#8b949e', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            📈 Graphique & Equity Curve
          </button>
        </div>

        {/* TAB 1: JOURNAL TABLE */}
        {activeTab === 'journal' && (
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#21262d', color: '#8b949e', borderBottom: '1px solid #30363d' }}>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Type / Paire</th>
                    <th style={{ padding: '12px 16px' }}>Sens</th>
                    <th style={{ padding: '12px 16px' }}>Stratégie</th>
                    <th style={{ padding: '12px 16px' }}>P&L Net / Montant</th>
                    <th style={{ padding: '12px 16px' }}>R:R</th>
                    <th style={{ padding: '12px 16px' }}>Graphique</th>
                    <th style={{ padding: '12px 16px' }}>Notes</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr><td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>Aucun enregistrement dans votre journal.</td></tr>
                  ) : (
                    trades.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #21262d' }}>
                        <td style={{ padding: '12px 16px', color: '#8b949e' }}>{t.entryDate}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#f0f6fc' }}>
                          {t.type === 'transfer' ? (t.transferType === 'deposit' ? '💳 DÉPÔT' : '📤 RETRAIT') : t.symbol}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {t.type === 'trade' ? (
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', backgroundColor: t.direction === 'long' ? 'rgba(57,211,83,0.15)' : 'rgba(248,81,73,0.15)', color: t.direction === 'long' ? '#3fb950' : '#f85149' }}>
                              {t.direction === 'long' ? 'BUY' : 'SELL'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#8b949e' }}>MOUVEMENT</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#8b949e' }}>{t.type === 'trade' ? t.strategy : '—'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: t.type === 'transfer' ? (t.transferType === 'deposit' ? '#3fb950' : '#e3b341') : (t.rawPnl >= 0 ? '#3fb950' : '#f85149') }}>
                          {t.type === 'transfer' ? `${t.transferType === 'deposit' ? '+' : '-'}${t.transferAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : fmtMoney(t.rawPnl)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{t.rr ? `1:${t.rr}` : '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {t.screenshot ? (
                            <button onClick={() => setSelectedImg(t.screenshot)} style={{ backgroundColor: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                              🖼️ Voir Chart
                            </button>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#8b949e', fontSize: '12px', maxWidth: '200px' }}>{t.notes || '—'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => deleteTrade(t.id)} style={{ backgroundColor: 'transparent', color: '#f85149', border: 'none', cursor: 'pointer', fontSize: '15px' }}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CALENDRIER PERFORMANCES */}
        {activeTab === 'calendar' && (
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setCurrentMonthDate(new Date(calendarData.year, calendarData.month - 1, 1))} style={{ backgroundColor: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>◀</button>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#f0f6fc' }}>
                  {currentMonthDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h2>
                <button onClick={() => setCurrentMonthDate(new Date(calendarData.year, calendarData.month + 1, 1))} style={{ backgroundColor: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>▶</button>
              </div>

              <div style={{ fontSize: '15px', fontWeight: '700' }}>
                Cumul du mois : <span style={{ color: calendarData.monthTotalPnl >= 0 ? '#3fb950' : '#f85149' }}>{fmtMoney(calendarData.monthTotalPnl)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textTransform: 'uppercase', fontSize: '11px', color: '#8b949e', marginBottom: '8px', textAlign: 'center' }}>
              <div>Dim</div><div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {Array.from({ length: calendarData.firstDay }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: '80px', backgroundColor: '#0e1117', borderRadius: '6px', opacity: 0.3 }}></div>
              ))}

              {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                const day = i + 1;
                const monthFormatted = String(calendarData.month + 1).padStart(2, '0');
                const dayFormatted = String(day).padStart(2, '0');
                const dateKey = `${calendarData.year}-${monthFormatted}-${dayFormatted}`;
                const dayPnl = calendarData.dailyPnl[dateKey];

                return (
                  <div 
                    key={day} 
                    style={{ 
                      height: '80px', 
                      backgroundColor: dayPnl !== undefined ? (dayPnl >= 0 ? 'rgba(57,211,83,0.1)' : 'rgba(248,81,73,0.1)') : '#21262d', 
                      border: dayPnl !== undefined ? (dayPnl >= 0 ? '1px solid #238636' : '1px solid #da3633') : '1px solid #30363d', 
                      borderRadius: '6px', 
                      padding: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justify: 'space-between' 
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#8b949e', fontWeight: '600' }}>{day}</span>
                    {dayPnl !== undefined && (
                      <span style={{ fontSize: '13px', fontWeight: '700', color: dayPnl >= 0 ? '#3fb950' : '#f85149' }}>
                        {fmtMoney(dayPnl)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: GRAPHIC EQUITY CURVE */}
        {activeTab === 'analytics' && (
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f0f6fc' }}>Évolution du Capital (Equity Curve)</h3>
            <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '20px', borderBottom: '1px solid #30363d' }}>
              {analytics.equityCurve.map((point, idx) => {
                const maxVal = Math.max(...analytics.equityCurve.map(p => p.balance), startingBalance * 1.2);
                const minVal = Math.min(...analytics.equityCurve.map(p => p.balance), startingBalance * 0.8);
                const range = maxVal - minVal || 1;
                const heightPct = Math.max(10, ((point.balance - minVal) / range) * 100);

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div 
                      title={`${point.date} : ${point.balance.toFixed(2)} €`}
                      style={{ 
                        width: '100%', 
                        height: `${heightPct}%`, 
                        backgroundColor: point.balance >= startingBalance ? '#238636' : '#da3633', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }}
                    ></div>
                    <span style={{ fontSize: '9px', color: '#8b949e', marginTop: '6px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                      {point.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* MODAL NOUVELLE ENTREE */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '24px', borderRadius: '10px', width: '440px', maxWidth: '90%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f0f6fc', fontSize: '16px' }}>Saisie d'Opération</h3>
              <button onClick={() => setModalOpen(false)} style={{ backgroundColor: 'transparent', color: '#8b949e', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button type="button" onClick={() => setFormType('trade')} style={{ flex: 1, padding: '8px', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', backgroundColor: formType === 'trade' ? '#1f6feb' : '#21262d', color: '#fff' }}>📈 Trade Execution</button>
              <button type="button" onClick={() => setFormType('transfer')} style={{ flex: 1, padding: '8px', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', backgroundColor: formType === 'transfer' ? '#1f6feb' : '#21262d', color: '#fff' }}>💳 Dépôt / Retrait</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#8b949e', display: 'block', marginBottom: '4px' }}>Date d'exécution</label>
                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px' }} />
              </div>

              {formType === 'trade' ? (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <input type="text" placeholder="Paire / Actif (ex: XAUUSD, BTCUSD)" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button type="button" onClick={() => setDirection('long')} style={{ flex: 1, padding: '8px', border: '1px solid #238636', backgroundColor: direction === 'long' ? '#238636' : 'transparent', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>BUY / LONG</button>
                    <button type="button" onClick={() => setDirection('short')} style={{ flex: 1, padding: '8px', border: '1px solid #da3633', backgroundColor: direction === 'short' ? '#da3633' : 'transparent', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>SELL / SHORT</button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input type="number" step="any" placeholder="P&L Net (€) ex: 150 ou -50" value={rawPnl} onChange={(e) => setRawPnl(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px' }} />
                    <input type="number" step="0.1" placeholder="R:R Atteint ex: 3" value={rr} onChange={(e) => setRr(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px' }} />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <input type="text" placeholder="Stratégie (ex: ICT / Order Block)" value={strategy} onChange={(e) => setStrategy(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px' }} />
                  </div>

                  {/* PASTE ZONE */}
                  <div style={{ border: screenshot ? '1px solid #238636' : '1px dashed #58a6ff', padding: '12px', textAlign: 'center', borderRadius: '6px', backgroundColor: '#0e1117', marginBottom: '12px' }}>
                    {screenshot ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <img src={screenshot} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px' }} />
                        <button type="button" onClick={() => setScreenshot('')} style={{ backgroundColor: '#da3633', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer l'image</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#8b949e' }}>
                        Fais <b>Ctrl + V</b> pour coller ta capture TradingView
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', color: '#8b949e' }}>Sens du Mouvement</label>
                    <select value={transferType} onChange={(e) => setTransferType(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px', marginTop: '4px' }}>
                      <option value="deposit">💳 Dépôt (Ajout Capital)</option>
                      <option value="withdrawal">📤 Retrait (Soustraction Capital)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <input type="number" placeholder="Montant (€)" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px' }} />
                  </div>
                </>
              )}

              <div style={{ marginBottom: '16px' }}>
                <input type="text" placeholder="Notes / Remarques (Optionnel)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0e1117', border: '1px solid #30363d', color: '#fff', borderRadius: '6px' }} />
              </div>

              <button type="submit" style={{ width: '100%', backgroundColor: '#238636', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                Enregistrer l'Opération
              </button>
            </form>

          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {selectedImg && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ position: 'relative', maxWidth: '90%' }}>
            <button onClick={() => setSelectedImg(null)} style={{ position: 'absolute', top: '-30px', right: 0, color: '#fff', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕ Fermer</button>
            <img src={selectedImg} alt="Graphique Grand Format" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '6px', border: '1px solid #30363d' }} />
          </div>
        </div>
      )}

    </div>
  );
}
