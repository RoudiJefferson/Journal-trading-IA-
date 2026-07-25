import React, { useState, useEffect } from 'react';

// --- DONNÉES PAR DÉFAUT ---
const initialTrades = [
  {
    id: 1,
    date: '2026-07-20',
    pair: 'XAUUSD (Gold)',
    type: 'BUY',
    entry: 2370.00,
    exit: 2380.00,
    lot: 0.5,
    pnl: 500,
    result: 'WIN',
    rr: 2.0,
    setup: 'Liquidity Sweep',
    notes: 'Achat sur balayage des plus bas de la session asiatique.',
    image: ''
  },
  {
    id: 2,
    date: '2026-07-22',
    pair: 'EURUSD',
    type: 'SELL',
    entry: 1.0880,
    exit: 1.0895,
    lot: 1.0,
    pnl: -150,
    result: 'LOSS',
    rr: -1,
    setup: 'Breaker Block',
    notes: 'Entrée prématurée sans confirmation du bias HTF.',
    image: ''
  },
  {
    id: 3,
    date: '2026-07-24',
    pair: 'XAUUSD (Gold)',
    type: 'BUY',
    entry: 2380.50,
    exit: 2395.00,
    lot: 0.5,
    pnl: 725,
    result: 'WIN',
    rr: 2.5,
    setup: 'Liquidity Sweep + FVG',
    notes: 'Exécution propre sur le créneau de New York.',
    image: ''
  },
  {
    id: 4,
    date: '2026-07-25',
    pair: 'GBPUSD',
    type: 'SELL',
    entry: 1.2910,
    exit: 1.2880,
    lot: 0.8,
    pnl: 240,
    result: 'WIN',
    rr: 2.0,
    setup: 'Order Block',
    notes: 'Rejet propre sur le bloc de commande M15.',
    image: ''
  }
];

const monthsList = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function App() {
  const [isClient, setIsClient] = useState(false);
  const [trades, setTrades] = useState([]);
  const [filterPair, setFilterPair] = useState('ALL');
  const [calendarDate, setCalendarDate] = useState(null);
  const [calendarPhase, setCalendarPhase] = useState('month');

  const [formData, setFormData] = useState({
    date: '2026-07-25',
    pair: 'XAUUSD (Gold)',
    type: 'BUY',
    entry: '',
    exit: '',
    lot: '',
    pnl: '',
    rr: '',
    setup: 'Liquidity Sweep',
    notes: '',
    image: ''
  });

  // Sécurité anti-crash SSR / Vercel (Hydration Protection)
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('rm_trading_journal_v2');
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        setTrades(initialTrades);
      }
    } else {
      setTrades(initialTrades);
    }
    const today = new Date();
    setCalendarDate(today);
    setFormData(prev => ({ ...prev, date: today.toISOString().split('T')[0] }));
  }, []);

  useEffect(() => {
    if (isClient && trades.length > 0) {
      localStorage.setItem('rm_trading_journal_v2', JSON.stringify(trades));
    }
  }, [trades, isClient]);

  if (!isClient || !calendarDate) {
    return (
      <div style={{ background: '#0b0f19', color: '#38bdf8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
        Chargement de RM Trading Journal...
      </div>
    );
  }

  // --- CALCULS DES STATISTIQUES ---
  const totalTrades = trades.length;
  const wins = trades.filter(t => Number(t.pnl) > 0).length;
  const losses = trades.filter(t => Number(t.pnl) < 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';
  const netPnL = trades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);

  // --- GRAPHIC / EQUITY CURVE ---
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningTotal = 0;
  const equityPoints = sortedTrades.map(t => {
    runningTotal += parseFloat(t.pnl) || 0;
    return { date: t.date, pnl: t.pnl, total: runningTotal, pair: t.pair };
  });

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTrade = (e) => {
    e.preventDefault();
    if (!formData.pnl || !formData.date) return;

    const valPnL = parseFloat(formData.pnl);
    const newTrade = {
      ...formData,
      id: Date.now(),
      pnl: valPnL,
      result: valPnL >= 0 ? 'WIN' : 'LOSS'
    };

    setTrades([newTrade, ...trades]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      pair: 'XAUUSD (Gold)',
      type: 'BUY',
      entry: '',
      exit: '',
      lot: '',
      pnl: '',
      rr: '',
      setup: 'Liquidity Sweep',
      notes: '',
      image: ''
    });
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer ce trade ?')) {
      setTrades(trades.filter(t => t.id !== id));
    }
  };

  const handleReset = () => {
    if (confirm('Effacer toutes les données du journal ?')) {
      localStorage.removeItem('rm_trading_journal_v2');
      setTrades([]);
    }
  };

  // --- CALENDRIER & IA ---
  const cYear = calendarDate.getFullYear();
  const cMonth = calendarDate.getMonth();
  const cDay = calendarDate.getDate();

  const changeCalendarDate = (delta) => {
    const d = new Date(calendarDate);
    if (calendarPhase === 'day') d.setDate(d.getDate() + delta);
    if (calendarPhase === 'month') d.setMonth(d.getMonth() + delta);
    if (calendarPhase === 'year') d.setFullYear(d.getFullYear() + delta);
    setCalendarDate(d);
  };

  const getDayPnL = (y, m, d) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTrades = trades.filter(t => t.date === dateStr);
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
  };

  const filteredTrades = filterPair === 'ALL'
    ? trades
    : trades.filter(t => t.pair.toLowerCase().includes(filterPair.toLowerCase()));

  return (
    <div className="trading-container">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #0b0f19; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
        .trading-container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
        
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 15px; }
        .title { font-size: 1.6rem; font-weight: 800; color: #38bdf8; letter-spacing: -0.5px; }
        
        .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .kpi-box { background: #151c2c; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; }
        .kpi-title { font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
        .kpi-num { font-size: 1.6rem; font-weight: 800; }
        .green { color: #22c55e; }
        .red { color: #ef4444; }

        .card { background: #151c2c; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; }
        .card-title { font-size: 1rem; font-weight: 700; color: #38bdf8; margin-bottom: 15px; }

        .layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; }
        @media (max-width: 850px) { .layout { grid-template-columns: 1fr; } }

        .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        .field label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
        .field input, .field select, .field textarea {
          background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.85rem; outline: none;
        }
        .field input:focus, .field select:focus { border-color: #38bdf8; }
        
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-add { background: #38bdf8; color: #000; font-weight: 800; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%; margin-top: 5px; }
        .btn-add:hover { opacity: 0.9; }

        .table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
        .table th { background: #0f172a; color: #94a3b8; padding: 10px; font-size: 0.75rem; border-bottom: 1px solid #1e293b; }
        .table td { padding: 10px; border-bottom: 1px solid #1e293b; }

        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-top: 10px; }
        .cal-head { text-align: center; font-size: 0.75rem; color: #94a3b8; font-weight: 700; }
        .cal-cell { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; min-height: 80px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; }
        .cal-cell:hover { border-color: #38bdf8; }
        .cal-cell.today { border-color: #38bdf8; background: rgba(56, 189, 248, 0.08); }
        
        .badge-win { background: rgba(34, 197, 94, 0.15); color: #22c55e; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 0.75rem; text-align: center; }
        .badge-loss { background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 0.75rem; text-align: center; }

        .nav-btn { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
        .nav-btn:hover { border-color: #38bdf8; }
      `}</style>

      {/* HEADER */}
      <header className="header">
        <div>
          <h1 className="title">RM TRADING JOURNAL</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Suivi d'Équité • Graphique • Calendrier & IA</p>
        </div>
        <button className="nav-btn" onClick={handleReset}>Réinitialiser</button>
      </header>

      {/* KPI METRICS */}
      <div className="kpi-row">
        <div className="kpi-box">
          <div className="kpi-title">P&L Net</div>
          <div className={`kpi-num ${netPnL >= 0 ? 'green' : 'red'}`}>
            {netPnL >= 0 ? `+${netPnL.toFixed(2)}$` : `${netPnL.toFixed(2)}$`}
          </div>
        </div>
        <div className="kpi-box">
          <div className="kpi-title">Win Rate</div>
          <div className="kpi-num green">{winRate}%</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-title">Total Trades</div>
          <div className="kpi-num">{totalTrades}</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-title">Gains / Pertes</div>
          <div className="kpi-num">
            <span className="green">{wins}W</span> / <span className="red">{losses}L</span>
          </div>
        </div>
      </div>

      {/* COURBE D'ÉQUITÉ (GRAPH) */}
      <div className="card">
        <div className="card-title">📈 Courbe de Capital (Equity Curve)</div>
        {equityPoints.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Aucune donnée de trade enregistrée.</p>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox="0 0 800 180" style={{ width: '100%', height: 'auto', minWidth: '450px' }}>
              {(() => {
                const width = 800;
                const height = 180;
                const pad = 30;
                const vals = equityPoints.map(p => p.total);
                const min = Math.min(0, ...vals);
                const max = Math.max(100, ...vals);
                
                const getX = (i) => equityPoints.length === 1 ? width / 2 : pad + (i / (equityPoints.length - 1)) * (width - pad * 2);
                const getY = (v) => height - pad - ((v - min) / ((max - min) || 1)) * (height - pad * 2);

                const pts = equityPoints.map((p, i) => `${getX(i)},${getY(p.total)}`).join(' L ');
                const isWin = netPnL >= 0;
                const color = isWin ? '#22c55e' : '#ef4444';

                return (
                  <g>
                    <line x1={pad} y1={getY(0)} x2={width - pad} y2={getY(0)} stroke="#1e293b" strokeDasharray="4" />
                    <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth="3" />
                    {equityPoints.map((p, i) => (
                      <circle key={i} cx={getX(i)} cy={getY(p.total)} r="4" fill={color} />
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        )}
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="layout">
        {/* FORMULAIRE */}
        <div className="card">
          <div className="card-title">✍️ Nouveau Trade</div>
          <form onSubmit={handleAddTrade}>
            <div className="row-2">
              <div className="field">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="field">
                <label>Paire</label>
                <input type="text" name="pair" value={formData.pair} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="row-2">
              <div className="field">
                <label>Direction</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div className="field">
                <label>Lot</label>
                <input type="number" step="0.01" name="lot" value={formData.lot} onChange={handleInputChange} placeholder="0.5" />
              </div>
            </div>

            <div className="row-2">
              <div className="field">
                <label>P&L ($)</label>
                <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleInputChange} placeholder="250 ou -100" required />
              </div>
              <div className="field">
                <label>R:R</label>
                <input type="number" step="0.1" name="rr" value={formData.rr} onChange={handleInputChange} placeholder="2.0" />
              </div>
            </div>

            <div className="field">
              <label>Setup</label>
              <select name="setup" value={formData.setup} onChange={handleInputChange}>
                <option value="Liquidity Sweep">Liquidity Sweep</option>
                <option value="Order Block">Order Block</option>
                <option value="Breaker Block">Breaker Block</option>
              </select>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea name="notes" rows="2" value={formData.notes} onChange={handleInputChange} placeholder="Commentaires..." />
            </div>

            <button type="submit" className="btn-add">Ajouter au Journal</button>
          </form>
        </div>

        {/* TABLEAU */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <div className="card-title" style={{ margin: 0 }}>📊 Historique</div>
            <select 
              value={filterPair} 
              onChange={(e) => setFilterPair(e.target.value)}
              style={{ background: '#0f172a', color: '#fff', border: '1px solid #1e293b', padding: '4px 8px', borderRadius: 5, fontSize: '0.8rem' }}
            >
              <option value="ALL">Toutes les paires</option>
              <option value="XAUUSD">Gold (XAUUSD)</option>
              <option value="EURUSD">EURUSD</option>
              <option value="GBPUSD">GBPUSD</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Paire</th>
                  <th>Type</th>
                  <th>R:R</th>
                  <th>P&L</th>
                  <th>Setup</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: 15 }}>Aucun trade enregistré.</td>
                  </tr>
                ) : (
                  filteredTrades.map(t => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td style={{ fontWeight: 700 }}>{t.pair}</td>
                      <td style={{ color: t.type === 'BUY' ? '#38bdf8' : '#f59e0b', fontWeight: 800 }}>{t.type}</td>
                      <td>1:{t.rr || '0'}</td>
                      <td style={{ fontWeight: 800, color: t.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                        {t.pnl >= 0 ? `+${t.pnl}$` : `${t.pnl}$`}
                      </td>
                      <td style={{ color: '#94a3b8' }}>{t.setup}</td>
                      <td>
                        <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CALENDRIER */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div className="card-title" style={{ margin: 0 }}>📅 Calendrier Trading ({monthsList[cMonth]} {cYear})</div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="nav-btn" onClick={() => changeCalendarDate(-1)}>&lt;</button>
            <button className="nav-btn" onClick={() => setCalendarDate(new Date())}>Aujourd'hui</button>
            <button className="nav-btn" onClick={() => changeCalendarDate(1)}>&gt;</button>
          </div>
        </div>

        <div className="cal-grid">
          {weekdays.map(w => <div key={w} className="cal-head">{w}</div>)}
          {(() => {
            const firstDayIdx = new Date(cYear, cMonth, 1).getDay();
            const offset = (firstDayIdx === 0 ? 6 : firstDayIdx - 1);
            const totalDays = new Date(cYear, cMonth + 1, 0).getDate();
            const today = new Date();
            const cells = [];

            for (let i = 0; i < offset; i++) {
              cells.push(<div key={`empty-${i}`} style={{ background: 'transparent' }} />);
            }

            for (let d = 1; d <= totalDays; d++) {
              const isToday = today.getDate() === d && today.getMonth() === cMonth && today.getFullYear() === cYear;
              const pnlVal = getDayPnL(cYear, cMonth, d);

              cells.push(
                <div key={`d-${d}`} className={`cal-cell ${isToday ? 'today' : ''}`}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{d}</span>
                  {pnlVal !== null ? (
                    <div className={pnlVal >= 0 ? 'badge-win' : 'badge-loss'}>
                      {pnlVal >= 0 ? `+${pnlVal}$` : `${pnlVal}$`}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>-</span>
                  )}
                </div>
              );
            }
            return cells;
          })()}
        </div>
      </div>
    </div>
  );
}
