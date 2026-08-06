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
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trades, setTrades] = useState([]);
  const [startingBalance, setStartingBalance] = useState(10000);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [hideBalance, setHideBalance] = useState(false);

  // Formulaire de Trade
  const [symbol, setSymbol] = useState('XAUUSD');
  const [direction, setDirection] = useState('long');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [rawPnl, setRawPnl] = useState('');
  const [rr, setRr] = useState('');
  const [strategy, setStrategy] = useState('Liquidity Sweep / ICT');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState('');

  // Charger les données (Supabase + LocalStorage)
  useEffect(() => {
    const loadData = async () => {
      setSaving(true);
      try {
        const { data } = await supabase
          .from('journal_data')
          .select('content')
          .eq('id', 1)
          .single();

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
        console.error("Erreur de chargement:", err);
      }
      setSaving(false);
      setLoaded(true);
    };
    loadData();
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    if (!loaded) return;
    const saveData = async () => {
      setSaving(true);
      const payload = { startingBalance, trades };
      localStorage.setItem('rm_trading_journal', JSON.stringify(payload));
      try {
        await supabase
          .from('journal_data')
          .upsert({ id: 1, content: payload });
      } catch (err) {
        console.error("Erreur de sauvegarde:", err);
      }
      setSaving(false);
    };
    saveData();
  }, [trades, startingBalance, loaded]);

  // Capture directe Ctrl + V quand la modal est ouverte
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (!modalOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          const reader = new FileReader();
          reader.onloadend = () => {
            setScreenshot(reader.result);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [modalOpen]);

  // Calculs KPIs
  const stats = useMemo(() => {
    let currentBalance = startingBalance;
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;

    trades.forEach(t => {
      const pnl = Number(t.rawPnl || 0);
      totalPnl += pnl;
      currentBalance += pnl;
      if (pnl > 0) wins++;
      if (pnl < 0) losses++;
    });

    const totalClosed = wins + losses;
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

    return { currentBalance, totalPnl, winRate, totalClosed };
  }, [trades, startingBalance]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symbol) return;

    const newEntry = {
      id: uid(),
      symbol: symbol.toUpperCase(),
      direction,
      entryDate,
      rawPnl: rawPnl === '' ? 0 : Number(rawPnl),
      rr: rr === '' ? '' : Number(rr),
      strategy,
      notes,
      screenshot
    };

    setTrades([newEntry, ...trades]);
    setModalOpen(false);
    setRawPnl('');
    setRr('');
    setNotes('');
    setScreenshot('');
  };

  const deleteTrade = (id) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  return (
    <div style={{ backgroundColor: '#131722', color: '#d1d4dc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* En-tête */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #2a2e39' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2962ff', fontSize: '22px' }}>RM Trading Journal</h1>
            <span style={{ fontSize: '12px', color: '#787b86' }}>
              {saving ? '⏳ Synchronisation...' : '🟢 Base Cloud Active'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              style={{ backgroundColor: '#2a2e39', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              {hideBalance ? '👁️ Afficher Solde' : '🙈 Masquer Solde'}
            </button>
            <button 
              onClick={() => setModalOpen(true)}
              style={{ backgroundColor: '#2962ff', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Nouveau Trade
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', margin: '25px 0' }}>
          <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#787b86', fontSize: '12px' }}>SOLDE ACTUEL</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>
              {hideBalance ? '•••••• €' : `${stats.currentBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
            </div>
          </div>
          <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#787b86', fontSize: '12px' }}>P&L TOTAL</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: stats.totalPnl >= 0 ? '#089981' : '#f23645', marginTop: '5px' }}>
              {hideBalance ? '•••••• €' : fmtMoney(stats.totalPnl)}
            </div>
          </div>
          <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#787b86', fontSize: '12px' }}>WIN RATE</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>
              {stats.winRate.toFixed(1)} %
            </div>
          </div>
          <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#787b86', fontSize: '12px' }}>TOTAL TRADES</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>
              {stats.totalClosed}
            </div>
          </div>
        </div>

        {/* Tableau des Trades */}
        <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #2a2e39', fontWeight: 'bold' }}>Journal de Trading</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#787b86', borderBottom: '1px solid #2a2e39' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Paire</th>
                  <th style={{ padding: '12px' }}>Sens</th>
                  <th style={{ padding: '12px' }}>Stratégie</th>
                  <th style={{ padding: '12px' }}>P&L (€)</th>
                  <th style={{ padding: '12px' }}>R:R</th>
                  <th style={{ padding: '12px' }}>Graphique</th>
                  <th style={{ padding: '12px' }}>Notes</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr><td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#787b86' }}>Aucun trade enregistré.</td></tr>
                ) : (
                  trades.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #2a2e39' }}>
                      <td style={{ padding: '12px', color: '#787b86' }}>{t.entryDate}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#fff' }}>{t.symbol}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: t.direction === 'long' ? '#089981' : '#f23645', fontWeight: 'bold' }}>
                          {t.direction === 'long' ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#787b86' }}>{t.strategy}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: t.rawPnl >= 0 ? '#089981' : '#f23645' }}>
                        {fmtMoney(t.rawPnl)}
                      </td>
                      <td style={{ padding: '12px' }}>{t.rr ? `1:${t.rr}` : '—'}</td>
                      <td style={{ padding: '12px' }}>
                        {t.screenshot ? (
                          <button onClick={() => setSelectedImg(t.screenshot)} style={{ backgroundColor: '#2a2e39', color: '#2962ff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                            🖼️ Voir
                          </button>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px', color: '#787b86', fontSize: '12px' }}>{t.notes || '—'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => deleteTrade(t.id)} style={{ backgroundColor: 'transparent', color: '#f23645', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Ajouter un Trade */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '20px', borderRadius: '8px', width: '420px', maxWidth: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Nouveau Trade</h3>
                <button onClick={() => setModalOpen(false)} style={{ backgroundColor: 'transparent', color: '#787b86', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#787b86' }}>Date</label>
                  <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px', marginTop: '3px' }} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <input type="text" placeholder="Paire (ex: XAUUSD)" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button type="button" onClick={() => setDirection('long')} style={{ flex: 1, padding: '8px', border: '1px solid #089981', backgroundColor: direction === 'long' ? '#089981' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>BUY</button>
                  <button type="button" onClick={() => setDirection('short')} style={{ flex: 1, padding: '8px', border: '1px solid #f23645', backgroundColor: direction === 'short' ? '#f23645' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>SELL</button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="number" step="any" placeholder="P&L (€) ex: 150" value={rawPnl} onChange={(e) => setRawPnl(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                  <input type="number" step="0.1" placeholder="R:R ex: 3" value={rr} onChange={(e) => setRr(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <input type="text" placeholder="Stratégie (ex: ICT / Liquidity Sweep)" value={strategy} onChange={(e) => setStrategy(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                </div>

                {/* Zone Aperçu Image + Ctrl + V */}
                <div style={{ border: screenshot ? '2px solid #089981' : '2px dashed #2962ff', padding: '12px', textAlign: 'center', borderRadius: '6px', backgroundColor: '#131722', marginBottom: '10px' }}>
                  {screenshot ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <img src={screenshot} alt="Capture TradingView" style={{ maxWidth: '100%', maxHeight: '130px', borderRadius: '4px', border: '1px solid #2a2e39' }} />
                      <button type="button" onClick={() => setScreenshot('')} style={{ backgroundColor: '#f23645', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                        Supprimer la capture
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#787b86' }}>
                      Appuie sur <b>Ctrl + V</b> pour coller ta capture TradingView
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <input type="text" placeholder="Notes / Observations" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                </div>

                <button type="submit" style={{ width: '100%', backgroundColor: '#2962ff', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>
                  Ajouter le Trade
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Visionneuse Image Grand Format */}
        {selectedImg && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
            <div style={{ position: 'relative', maxWidth: '90%' }}>
              <button onClick={() => setSelectedImg(null)} style={{ position: 'absolute', top: '-30px', right: 0, color: '#fff', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕ Fermer</button>
              <img src={selectedImg} alt="Graphique Grand Format" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '6px', border: '1px solid #2a2e39' }} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
