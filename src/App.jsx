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

  // Formulaire de Trade / Transfert (Dépôt & Retrait)
  const [formType, setFormType] = useState('trade'); // 'trade' ou 'transfer'
  const [symbol, setSymbol] = useState('XAUUSD');
  const [direction, setDirection] = useState('long');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [rawPnl, setRawPnl] = useState('');
  const [rr, setRr] = useState('');
  const [strategy, setStrategy] = useState('Liquidity Sweep / ICT');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState('');
  
  // Champs spécifiques aux Transferts
  const [transferType, setTransferType] = useState('deposit'); // 'deposit' par défaut
  const [transferAmount, setTransferAmount] = useState('');

  // Charger les données (Supabase + Fallback LocalStorage)
  useEffect(() => {
    const loadData = async () => {
      setSaving(true);
      try {
        const { data, error } = await supabase
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

  // Capture directe d'image (Ctrl + V / Cmd + V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => setScreenshot(reader.result);
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  };

  // Calculs KPIs & Performance
  const stats = useMemo(() => {
    let currentBalance = startingBalance;
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;

    trades.forEach(t => {
      if (t.type === 'transfer') {
        const amt = Number(t.transferAmount || 0);
        currentBalance += t.transferType === 'deposit' ? amt : -amt;
      } else {
        const pnl = Number(t.rawPnl || 0);
        totalPnl += pnl;
        currentBalance += pnl;
        if (pnl > 0) wins++;
        if (pnl < 0) losses++;
      }
    });

    const totalClosed = wins + losses;
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

    return { currentBalance, totalPnl, winRate, totalClosed };
  }, [trades, startingBalance]);

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
              + Enregistrer / Dépôt
            </button>
          </div>
        </header>

        {/* Dashboard Solde & KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', margin: '25px 0' }}>
          <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#787b86', fontSize: '12px' }}>SOLDE ACTUEL</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>
              {hideBalance ? '•••••• €' : `${stats.currentBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
            </div>
          </div>
          <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '16px', borderRadius: '8px' }}>
            <div style={{ color: '#787b86', fontSize: '12px' }}>P&L TOTAL TRADES</div>
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
        </div>

        {/* Historique des Positions & Mouvements */}
        <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #2a2e39', fontWeight: 'bold' }}>Historique des Opérations & Dépôts</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#787b86', borderBottom: '1px solid #2a2e39' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Paire / Type</th>
                  <th style={{ padding: '12px' }}>Sens / Operation</th>
                  <th style={{ padding: '12px' }}>P&L / Montant</th>
                  <th style={{ padding: '12px' }}>R:R</th>
                  <th style={{ padding: '12px' }}>Graphique / Notes</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#787b86' }}>Aucune donnée enregistrée.</td></tr>
                ) : (
                  trades.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #2a2e39' }}>
                      <td style={{ padding: '12px', color: '#787b86' }}>{t.entryDate}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#fff' }}>
                        {t.type === 'transfer' ? (t.transferType === 'deposit' ? '💳 DÉPÔT' : '📤 RETRAIT') : t.symbol}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {t.type === 'trade' ? (
                          <span style={{ color: t.direction === 'long' ? '#089981' : '#f23645', fontWeight: 'bold' }}>
                            {t.direction === 'long' ? 'BUY' : 'SELL'}
                          </span>
                        ) : (
                          <span style={{ color: t.transferType === 'deposit' ? '#089981' : '#f59e0b', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#131722' }}>
                            {t.transferType === 'deposit' ? 'CREDIT' : 'DEBIT'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: t.type === 'transfer' ? (t.transferType === 'deposit' ? '#089981' : '#f59e0b') : (t.rawPnl >= 0 ? '#089981' : '#f23645') }}>
                        {t.type === 'transfer' ? `${t.transferType === 'deposit' ? '+' : '-'}${t.transferAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : fmtMoney(t.rawPnl)}
                      </td>
                      <td style={{ padding: '12px' }}>{t.rr ? `1:${t.rr}` : '—'}</td>
                      <td style={{ padding: '12px' }}>
                        {t.screenshot ? (
                          <button onClick={() => setSelectedImg(t.screenshot)} style={{ backgroundColor: '#2a2e39', color: '#2962ff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                            🖼️ Voir
                          </button>
                        ) : (t.notes ? <span style={{ fontSize: '11px', color: '#787b86' }}>{t.notes}</span> : '—')}
                      </td>
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

        {/* Modal Nouveau Trade / Dépôt */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', padding: '20px', borderRadius: '8px', width: '420px', maxWidth: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Nouvelle Entrée</h3>
                <button onClick={() => setModalOpen(false)} style={{ backgroundColor: 'transparent', color: '#787b86', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>

              {/* Selecteur d'Onglet: Trade vs Dépôt / Retrait */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                  type="button"
                  onClick={() => setFormType('trade')} 
                  style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: formType === 'trade' ? '#2962ff' : '#2a2e39', color: '#fff' }}
                >
                  📈 Trade
                </button>
                <button 
                  type="button"
                  onClick={() => setFormType('transfer')} 
                  style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: formType === 'transfer' ? '#2962ff' : '#2a2e39', color: '#fff' }}
                >
                  💳 Dépôt / Retrait
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#787b86' }}>Date</label>
                  <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px', marginTop: '3px' }} />
                </div>

                {formType === 'trade' ? (
                  <>
                    <div style={{ marginBottom: '10px' }}>
                      <input type="text" placeholder="Paire (ex: XAUUSD, BTCUSD)" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <button type="button" onClick={() => setDirection('long')} style={{ flex: 1, padding: '8px', border: '1px solid #089981', backgroundColor: direction === 'long' ? '#089981' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>BUY</button>
                      <button type="button" onClick={() => setDirection('short')} style={{ flex: 1, padding: '8px', border: '1px solid #f23645', backgroundColor: direction === 'short' ? '#f23645' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>SELL</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input type="number" step="any" placeholder="P&L (€) ex: 150 ou -50" value={rawPnl} onChange={(e) => setRawPnl(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                      <input type="number" step="0.1" placeholder="R:R ex: 2.5" value={rr} onChange={(e) => setRr(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                    </div>

                    {/* Zone de collage TradingView */}
                    <div tabIndex="0" onPaste={handlePaste} style={{ border: '2px dashed #2962ff', padding: '12px', textAlign: 'center', borderRadius: '6px', backgroundColor: '#131722', marginBottom: '10px', cursor: 'pointer', outline: 'none' }}>
                      <span style={{ fontSize: '12px', color: '#787b86' }}>
                        Clique ici puis <b>Ctrl + V</b> pour coller le graphique TradingView
                      </span>
                      {screenshot && <div style={{ color: '#089981', fontSize: '11px', marginTop: '4px' }}>✓ Image capturée avec succès</div>}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#787b86' }}>Type de Mouvement</label>
                      <select value={transferType} onChange={(e) => setTransferType(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px', marginTop: '3px' }}>
                        <option value="deposit">💳 Dépôt (+)</option>
                        <option value="withdrawal">📤 Retrait (-)</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#787b86' }}>Montant (€)</label>
                      <input type="number" placeholder="ex: 500" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px', marginTop: '3px' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <input type="text" placeholder="Note (Optionnel, ex: Ajout capital)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }} />
                    </div>
                  </>
                )}

                <button type="submit" style={{ width: '100%', backgroundColor: '#2962ff', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                  Enregistrer
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Visionneuse Image */}
        {selectedImg && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
            <div style={{ position: 'relative', maxWidth: '90%' }}>
              <button onClick={() => setSelectedImg(null)} style={{ position: 'absolute', top: '-30px', right: 0, color: '#fff', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕ Fermer</button>
              <img src={selectedImg} alt="TradingView Chart" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '6px', border: '1px solid #2a2e39' }} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
