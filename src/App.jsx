import React, { useState, useEffect } from 'react';

// --- DONNÉES DE DÉPART ---
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
    notes: 'Achat sur balayage des plus bas de la session asiatique.'
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
    notes: 'Entrée prématurée sans confirmation.'
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
    notes: 'Exécution propre sur le créneau de New York.'
  }
];

const monthsList = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [trades, setTrades] = useState([]);
  const [filterPair, setFilterPair] = useState('ALL');
  const [calendarDate, setCalendarDate] = useState(null);

  const [formData, setFormData] = useState({
    date: '',
    pair: 'XAUUSD (Gold)',
    type: 'BUY',
    entry: '',
    exit: '',
    lot: '',
    pnl: '',
    rr: '',
    setup: 'Liquidity Sweep',
    notes: ''
  });

  // Protection d'hydratation absolue
  useEffect(() => {
    setMounted(true);
    const today = new Date();
    setCalendarDate(today);
    setFormData(prev => ({ ...prev, date: today.toISOString().split('T')[0] }));

    const saved = localStorage.getItem('rm_trading_journal_v3');
    if (saved) {
      try { setTrades(JSON.parse(saved)); } catch (e) { setTrades(initialTrades); }
    } else {
      setTrades(initialTrades);
    }
  }, []);

  useEffect(() => {
    if (mounted && trades.length > 0) {
      localStorage.setItem('rm_trading_journal_v3', JSON.stringify(trades));
    }
  }, [trades, mounted]);

  // Si le composant n'est pas encore monté côté client, on n'affiche rien (évite le clash SSR/Client)
  if (!mounted || !calendarDate) {
    return null;
  }

  // --- CALCULS ---
  const totalTrades = trades.length;
  const wins = trades.filter(t => Number(t.pnl) > 0).length;
  const losses = trades.filter(t => Number(t.pnl) < 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';
  const netPnL = trades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);

  // --- EQUITY GRAPH ---
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningTotal = 0;
  const equityPoints = sortedTrades.map(t => {
    runningTotal += parseFloat(t.pnl) || 0;
    return { date: t.date, pnl: t.pnl, total: runningTotal };
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
    setFormData(prev => ({
      ...prev,
      pnl: '',
      rr: '',
      notes: ''
    }));
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer ce trade ?')) {
      setTrades(trades.filter(t => t.id !== id));
    }
  };

  const handleReset = () => {
    if (confirm('Effacer le journal ?')) {
      localStorage.removeItem('rm_trading_journal_v3');
      setTrades([]);
    }
  };

  const changeMonth = (delta) => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() + delta);
    setCalendarDate(d);
  };

  const cYear = calendarDate.getFullYear();
  const cMonth = calendarDate.getMonth();

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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', background: '#0b0f19', color: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        * { box-sizing: border-box; }
        .grid-2 { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
        @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }
        .card { background: #151c2c; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .input-field { width: 100%; background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; padding: 8px; color: #fff; margin-top: 4px; margin-bottom: 12px; }
        .btn { background: #38bdf8; color: #000; font-weight: bold; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%; }
        .table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
        .table th, .table td { padding: 10px; border-bottom: 1px solid #1e293b; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 10px; }
        .cal-cell { background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; min-height: 65px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#38bdf8', fontSize: '1.5rem', margin: 0 }}>RM TRADING JOURNAL</h1>
        <button onClick={handleReset} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Réinitialiser</button>
      </div>

      {/* KPIS */}
      <div className="kpi-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>P&L NET</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: netPnL >= 0 ? '#22c55e' : '#ef4444' }}>
            {netPnL >= 0 ? `+${netPnL.toFixed(2)}$` : `${netPnL.toFixed(2)}$`}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>WIN RATE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>{winRate}%</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TRADES TOTAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalTrades}</div>
        </div>
      </div>

      {/* GRAPH */}
      <div className="card">
        <h3 style={{ color: '#38bdf8', fontSize: '1rem', marginTop: 0 }}>📈 Courbe de Capital</h3>
        {equityPoints.length > 0 && (
          <svg viewBox="0 0 800 150" style={{ width: '100%', height: '150px' }}>
            {(() => {
              const vals = equityPoints.map(p => p.total);
              const min = Math.min(0, ...vals);
              const max = Math.max(100, ...vals);
              const getX = (i) => equityPoints.length === 1 ? 400 : 30 + (i / (equityPoints.length - 1)) * 740;
              const getY = (v) => 130 - ((v - min) / ((max - min) || 1)) * 110;
              const pts = equityPoints.map((p, i) => `${getX(i)},${getY(p.total)}`).join(' L ');
              return (
                <g>
                  <line x1="30" y1={getY(0)} x2="770" y2={getY(0)} stroke="#1e293b" strokeDasharray="4" />
                  <path d={`M ${pts}`} fill="none" stroke={netPnL >= 0 ? '#22c55e' : '#ef4444'} strokeWidth="3" />
                </g>
              );
            })()}
          </svg>
        )}
      </div>

      {/* MAIN */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ color: '#38bdf8', fontSize: '1rem', marginTop: 0 }}>✍️ Nouveau Trade</h3>
          <form onSubmit={handleAddTrade}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Date</label>
            <input className="input-field" type="date" name="date" value={formData.date} onChange={handleInputChange} required />

            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Paire</label>
            <input className="input-field" type="text" name="pair" value={formData.pair} onChange={handleInputChange} required />

            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Type</label>
            <select className="input-field" name="type" value={formData.type} onChange={handleInputChange}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>

            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>P&L ($)</label>
            <input className="input-field" type="number" step="any" name="pnl" value={formData.pnl} onChange={handleInputChange} placeholder="ex: 200 ou -100" required />

            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>R:R</label>
            <input className="input-field" type="number" step="0.1" name="rr" value={formData.rr} onChange={handleInputChange} placeholder="2.0" />

            <button type="submit" className="btn">Ajouter</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ color: '#38bdf8', fontSize: '1rem', margin: 0 }}>📊 Historique</h3>
            <select value={filterPair} onChange={(e) => setFilterPair(e.target.value)} style={{ background: '#0f172a', color: '#fff', border: '1px solid #1e293b', padding: '4px', borderRadius: 4 }}>
              <option value="ALL">Toutes les paires</option>
              <option value="XAUUSD">Gold (XAUUSD)</option>
              <option value="EURUSD">EURUSD</option>
            </select>
          </div>

          <table className="table">
            <thead>
              <tr style={{ color: '#94a3b8' }}>
                <th>Date</th>
                <th>Paire</th>
                <th>Type</th>
                <th>P&L</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map(t => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td style={{ fontWeight: 'bold' }}>{t.pair}</td>
                  <td style={{ color: t.type === 'BUY' ? '#38bdf8' : '#f59e0b', fontWeight: 'bold' }}>{t.type}</td>
                  <td style={{ fontWeight: 'bold', color: t.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                    {t.pnl >= 0 ? `+${t.pnl}$` : `${t.pnl}$`}
                  </td>
                  <td>
                    <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CALENDRIER */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#38bdf8', fontSize: '1rem', margin: 0 }}>📅 Calendrier ({monthsList[cMonth]} {cYear})</h3>
          <div>
            <button onClick={() => changeMonth(-1)} style={{ background: '#0f172a', color: '#fff', border: '1px solid #1e293b', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', marginRight: 5 }}>&lt;</button>
            <button onClick={() => changeMonth(1)} style={{ background: '#0f172a', color: '#fff', border: '1px solid #1e293b', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>&gt;</button>
          </div>
        </div>

        <div className="cal-grid">
          {weekdays.map(w => <div key={w} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>{w}</div>)}
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
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{d}</span>
                  {pnlVal !== null && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: pnlVal >= 0 ? '#22c55e' : '#ef4444' }}>
                      {pnlVal >= 0 ? `+${pnlVal}$` : `${pnlVal}$`}
                    </span>
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
