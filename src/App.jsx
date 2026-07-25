import React, { useState, useEffect } from 'react';

// --- DONNÉES DE DÉPART (Exemples) ---
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
    image: 'https://via.placeholder.com/600x300/1e293b/38bdf8?text=Trade+Gold'
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
    notes: 'Entrée prématurée sans confirmation du bias Higher Timeframe.',
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
    notes: 'Rejet propre sur le bloc de commande 15m.',
    image: ''
  }
];

const monthsList = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Algorithme de génération du rapport IA
function getIAReport(date) {
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const hash = (y * 365) + (m * 31) + d;

  const score = 70 + (hash % 29);
  const prod = Math.min(99, score + 1);
  const windows = ['Matin (08h-12h)', 'Après-midi (14h-17h)', 'Soirée (18h-20h)'];
  const windowStr = windows[hash % windows.length];

  return {
    score,
    productivity: `${prod}%`,
    focus: score > 88 ? 'Excellente' : 'Modérée',
    window: windowStr,
    timeline: [
      { time: 'Matinée', text: d % 2 === 0 ? 'Forte volatilité attendue. Priorisez les configurations A+.' : 'Review globale et prépa de la watchlist.' },
      { time: 'Après-midi', text: d % 3 === 0 ? 'Créneau idéal pour NY. Attention aux annonces économiques.' : 'Gestion rigoureuse du risque et des trailing stops.' },
      { time: 'Soirée', text: 'Débriefing de la journée et mise à jour du journal.' }
    ],
    recommendation: d % 2 === 0
      ? `Conditions de marché optimales (Score : ${score}/100). Focus recommandé sur ${windowStr}.`
      : `Marché indécis. Privilégiez un risque réduit (0.5% max) et évitez l'overtrading.`
  };
}

export default function App() {
  // --- ÉTATS DU JOURNAL ---
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('rm_tv_journal_data');
    return saved ? JSON.parse(saved) : initialTrades;
  });

  const [formData, setFormData] = useState({
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

  const [filterPair, setFilterPair] = useState('ALL');

  // --- ÉTATS DU CALENDRIER ---
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarPhase, setCalendarPhase] = useState('month');

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem('rm_tv_journal_data', JSON.stringify(trades));
  }, [trades]);

  // --- STATISTIQUES GLOBALES ---
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
  const netPnL = trades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);

  // --- CALCUL DE LA COURBE D'ÉQUITÉ (PROGRESSION) ---
  const sortedTradesForChart = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulativePnL = 0;
  const equityPoints = sortedTradesForChart.map((t) => {
    cumulativePnL += parseFloat(t.pnl) || 0;
    return { date: t.date, pnl: t.pnl, total: cumulativePnL, pair: t.pair };
  });

  // --- HANDLERS FORMULAIRE ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTrade = (e) => {
    e.preventDefault();
    if (!formData.pnl || !formData.date) return;

    const pnlNum = parseFloat(formData.pnl);
    const newTrade = {
      ...formData,
      id: Date.now(),
      entry: parseFloat(formData.entry) || 0,
      exit: parseFloat(formData.exit) || 0,
      lot: parseFloat(formData.lot) || 0,
      pnl: pnlNum,
      rr: parseFloat(formData.rr) || 0,
      result: pnlNum >= 0 ? 'WIN' : 'LOSS'
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

  const handleDeleteTrade = (id) => {
    if (window.confirm('Voulez-vous supprimer ce trade ?')) {
      setTrades(trades.filter(t => t.id !== id));
    }
  };

  const handleResetData = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données ?')) {
      localStorage.removeItem('rm_tv_journal_data');
      setTrades([]);
    }
  };

  // --- HANDLERS CALENDRIER ---
  const navigateCalendar = (direction) => {
    const d = new Date(calendarDate);
    if (calendarPhase === 'day') d.setDate(d.getDate() + direction);
    else if (calendarPhase === 'month') d.setMonth(d.getMonth() + direction);
    else if (calendarPhase === 'year') d.setFullYear(d.getFullYear() + direction);
    setCalendarDate(d);
  };

  const cYear = calendarDate.getFullYear();
  const cMonth = calendarDate.getMonth();
  const cDay = calendarDate.getDate();
  const monthName = monthsList[cMonth];
  const iaReport = getIAReport(calendarDate);

  const getCalendarTitle = () => {
    if (calendarPhase === 'day') return `${cDay} ${monthName} ${cYear}`;
    if (calendarPhase === 'month') return `${monthName} ${cYear}`;
    return `${cYear}`;
  };

  const getDayPnL = (y, m, d) => {
    const formattedDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTrades = trades.filter(t => t.date === formattedDate);
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
  };

  const currentDateFormatted = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-${String(cDay).padStart(2, '0')}`;
  const tradesForCurrentDate = trades.filter(t => t.date === currentDateFormatted);

  const filteredTrades = filterPair === 'ALL' 
    ? trades 
    : trades.filter(t => t.pair.toLowerCase().includes(filterPair.toLowerCase()));

  // --- COMPOSANT GRAPHIQUE (SVG EQUITY CURVE) CORRIGÉ ---
  const renderEquityChart = () => {
    if (equityPoints.length === 0) {
      return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Aucune donnée de trade pour afficher la courbe.</div>;
    }

    const width = 800;
    const height = 220;
    const padding = 40;

    const values = equityPoints.map(p => p.total);
    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(100, ...values);

    const getX = (idx) => {
      if (equityPoints.length <= 1) return width / 2;
      return padding + (idx / (equityPoints.length - 1)) * (width - padding * 2);
    };

    const getY = (val) => {
      const range = maxVal - minVal || 1;
      return height - padding - ((val - minVal) / range) * (height - padding * 2);
    };

    const zeroY = getY(0);

    const pointsPath = equityPoints.map((p, i) => `${getX(i)},${getY(p.total)}`).join(' L ');
    const areaPath = `M ${getX(0)},${zeroY} L ${pointsPath} L ${getX(equityPoints.length - 1)},${zeroY} Z`;

    const isPositiveOverall = netPnL >= 0;
    const lineColor = isPositiveOverall ? '#22c55e' : '#ef4444';
    const gradientId = isPositiveOverall ? 'greenGrad' : 'redGrad';

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '500px' }}>
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Ligne 0 PnL */}
          <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#2a364f" strokeDasharray="4 4" strokeWidth="1" />

          {/* Remplissage en dégradé sous la courbe */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Courbe principale */}
          <path d={`M ${pointsPath}`} fill="none" stroke={lineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points cliquables avec PnL */}
          {equityPoints.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.total);
            return (
              <g key={i} className="chart-point-group">
                <circle cx={cx} cy={cy} r="5" fill={lineColor} stroke="#0b0f19" strokeWidth="2" />
                <title>{`${p.date} (${p.pair}): ${p.pnl >= 0 ? '+' : ''}${p.pnl}$ | Total: ${p.total.toFixed(2)}$`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="app-viewport">
      <style>{`
        :root {
          --bg-main: #0b0f19;
          --bg-card: #151c2c;
          --bg-card-hover: #1e293b;
          --border: #2a364f;
          --primary: #38bdf8;
          --primary-glow: rgba(56, 189, 248, 0.15);
          --accent: #818cf8;
          --green: #22c55e;
          --green-bg: rgba(34, 197, 94, 0.12);
          --red: #ef4444;
          --red-bg: rgba(239, 68, 68, 0.12);
          --text: #f8fafc;
          --text-muted: #94a3b8;
          --radius: 12px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: var(--bg-main); color: var(--text); font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 20px; }
        .app-viewport { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        /* HEADER */
        .app-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
        .app-title { font-size: 1.8rem; font-weight: 800; background: linear-gradient(90deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        /* KPI METRICS */
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .kpi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
        .kpi-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; font-weight: 700; }
        .kpi-value { font-size: 1.8rem; font-weight: 800; }
        .kpi-value.green { color: var(--green); }
        .kpi-value.red { color: var(--red); }

        /* GRAPH CARD */
        .graph-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }

        /* MAIN CONTENT LAYOUT */
        .main-layout { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
        @media (max-width: 960px) { .main-layout { grid-template-columns: 1fr; } }

        /* FORM */
        .form-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; height: fit-content; }
        .section-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; color: var(--primary); }
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .form-group label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
        .form-group input, .form-group select, .form-group textarea {
          background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 10px; color: var(--text); font-size: 0.9rem; outline: none;
        }
        .form-group input:focus, .form-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-glow); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-submit { background: var(--primary); color: #000; font-weight: 800; padding: 12px; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 6px; }
        .btn-submit:hover { opacity: 0.9; }

        /* TABLE */
        .content-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .table-filter-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .trade-table-wrapper { overflow-x: auto; }
        .trade-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
        .trade-table th { background: #0f172a; padding: 12px; color: var(--text-muted); border-bottom: 1px solid var(--border); font-size: 0.78rem; font-weight: 700; }
        .trade-table td { padding: 12px; border-bottom: 1px solid var(--border); }
        .trade-table tr:hover { background: var(--bg-card-hover); }

        .badge { padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 800; text-align: center; display: inline-block; }
        .badge-buy { background: rgba(56, 189, 248, 0.15); color: var(--primary); }
        .badge-sell { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

        /* CALENDRIER TRADINGVIEW INTEGRÉ */
        .calendar-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .cal-nav { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 14px; }
        .cal-tabs { display: flex; gap: 6px; background: #0f172a; padding: 4px; border-radius: 8px; border: 1px solid var(--border); }
        .cal-tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.8rem; }
        .cal-tab-btn.active { background: var(--bg-card); color: var(--primary); }
        .btn-nav { background: #0f172a; border: 1px solid var(--border); color: var(--text); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
        .btn-nav:hover { border-color: var(--primary); color: var(--primary); }

        /* CALENDAR MONTH GRID */
        .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
        .cal-weekday { text-align: center; color: var(--text-muted); font-size: 0.8rem; font-weight: 700; padding-bottom: 6px; }
        .cal-day-cell { background: #0f172a; border: 1px solid var(--border); border-radius: 10px; min-height: 95px; padding: 8px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s; }
        .cal-day-cell:hover:not(.empty) { border-color: var(--primary); transform: translateY(-2px); }
        .cal-day-cell.today { border-color: var(--primary); background: var(--primary-glow); }
        .cal-day-cell.selected { border-color: var(--accent); }
        .cal-day-num { font-weight: 800; font-size: 1rem; }
        .cal-ia-tag { font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; background: rgba(129, 140, 248, 0.15); color: var(--accent); }

        /* TRADING BADGES IN CALENDAR */
        .pnl-badge-cal { padding: 4px 6px; border-radius: 6px; font-weight: 800; font-size: 0.78rem; text-align: center; margin-top: 4px; }
        .pnl-badge-win { background: var(--green-bg); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.3); }
        .pnl-badge-loss { background: var(--red-bg); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3); }

        /* DAY VUE DETAIL */
        .day-view-container { display: grid; grid-template-columns: 240px 1fr; gap: 20px; }
        .day-hero-card { background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.1)); border: 1px solid var(--primary); border-radius: var(--radius); padding: 24px; text-align: center; }
        .day-hero-num { font-size: 4.5rem; font-weight: 900; color: var(--primary); line-height: 1; }
        
        .ia-report-box { background: #0f172a; border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .ia-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .ia-metric-card { background: var(--bg-card); border: 1px solid var(--border); padding: 10px; border-radius: 8px; text-align: center; }

        /* VUE ANNÉE */
        .year-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .year-month-card { background: #0f172a; border: 1px solid var(--border); border-radius: 10px; padding: 12px; cursor: pointer; }
        .year-month-card:hover { border-color: var(--primary); }
        .mini-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; font-size: 0.65rem; text-align: center; margin-top: 8px; }
      `}</style>

      {/* HEADER */}
      <header className="app-header">
        <div>
          <h1 className="app-title">RM TRADING JOURNAL</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Interface Pro TradingView • Suivi d'Équité & Calendrier IA</p>
        </div>
        <button className="btn-nav" onClick={handleResetData}>Réinitialiser</button>
      </header>

      {/* STATISTIQUES KPI */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">P&L Net Total</div>
          <div className={`kpi-value ${netPnL >= 0 ? 'green' : 'red'}`}>
            {netPnL >= 0 ? `+${netPnL.toFixed(2)}$` : `${netPnL.toFixed(2)}$`}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Win Rate</div>
          <div className="kpi-value green">{winRate}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Trades</div>
          <div className="kpi-value">{totalTrades}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Gains / Pertes</div>
          <div className="kpi-value">
            <span style={{ color: 'var(--green)' }}>{wins}W</span> / <span style={{ color: 'var(--red)' }}>{losses}L</span>
          </div>
        </div>
      </section>

      {/* COURBE DE PROGRESSION / EQUITY CURVE */}
      <section className="graph-card">
        <div className="section-title">📈 Courbe de Progression du Capital (Equity Curve)</div>
        {renderEquityChart()}
      </section>

      {/* FORMULAIRE & HISTORIQUE */}
      <main className="main-layout">
        {/* FORMULAIRE */}
        <div className="form-card">
          <div className="section-title">✍️ Saisir un Trade</div>
          <form onSubmit={handleAddTrade}>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Paire</label>
                <input type="text" name="pair" value={formData.pair} onChange={handleInputChange} placeholder="XAUUSD" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lot</label>
                <input type="number" step="0.01" name="lot" value={formData.lot} onChange={handleInputChange} placeholder="0.5" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>P&L ($)</label>
                <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleInputChange} placeholder="725 ou -150" required />
              </div>
              <div className="form-group">
                <label>R:R</label>
                <input type="number" step="0.1" name="rr" value={formData.rr} onChange={handleInputChange} placeholder="2.5" />
              </div>
            </div>

            <div className="form-group">
              <label>Setup / Stratégie</label>
              <select name="setup" value={formData.setup} onChange={handleInputChange}>
                <option value="Liquidity Sweep">Liquidity Sweep + FVG</option>
                <option value="Order Block">Order Block ICT</option>
                <option value="Breaker Block">Breaker Block</option>
              </select>
            </div>

            <div className="form-group">
              <label>Lien Capture (TradeZou/Imgur)</label>
              <input type="url" name="image" value={formData.image} onChange={handleInputChange} placeholder="https://..." />
            </div>

            <div className="form-group">
              <label>Observations</label>
              <textarea name="notes" rows="2" value={formData.notes} onChange={handleInputChange} placeholder="Incertitudes, psychologie..." />
            </div>

            <button type="submit" className="btn-submit">Ajouter au Journal</button>
          </form>
        </div>

        {/* HISTORIQUE */}
        <div className="content-card">
          <div className="table-filter-bar">
            <div className="section-title" style={{ marginBottom: 0 }}>📊 Journal des Trades</div>
            <select 
              value={filterPair} 
              onChange={(e) => setFilterPair(e.target.value)}
              style={{ background: '#0f172a', color: '#fff', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6 }}
            >
              <option value="ALL">Toutes les paires</option>
              <option value="XAUUSD">Gold (XAUUSD)</option>
              <option value="EURUSD">EURUSD</option>
              <option value="GBPUSD">GBPUSD</option>
            </select>
          </div>

          <div className="trade-table-wrapper">
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Paire</th>
                  <th>Type</th>
                  <th>R:R</th>
                  <th>P&L ($)</th>
                  <th>Setup</th>
                  <th>Graphique</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                      Aucun trade enregistré.
                    </td>
                  </tr>
                ) : (
                  filteredTrades.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td style={{ fontWeight: 700 }}>{t.pair}</td>
                      <td><span className={`badge ${t.type === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{t.type}</span></td>
                      <td>1:{t.rr}</td>
                      <td style={{ fontWeight: 800, color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {t.pnl >= 0 ? `+${t.pnl}$` : `${t.pnl}$`}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.setup}</td>
                      <td>
                        {t.image ? (
                          <a href={t.image} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Voir</a>
                        ) : '-'}
                      </td>
                      <td>
                        <button onClick={() => handleDeleteTrade(t.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CALENDRIER TRADING DU BAS DE PAGE */}
      <section className="calendar-section">
        <div className="cal-nav">
          <div>
            <div className="section-title" style={{ marginBottom: 4 }}>📅 Calendrier de Trading & Assistant IA</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getCalendarTitle()}</p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="cal-tabs">
              <button className={`cal-tab-btn ${calendarPhase === 'day' ? 'active' : ''}`} onClick={() => setCalendarPhase('day')}>Jour</button>
              <button className={`cal-tab-btn ${calendarPhase === 'month' ? 'active' : ''}`} onClick={() => setCalendarPhase('month')}>Mois</button>
              <button className={`cal-tab-btn ${calendarPhase === 'year' ? 'active' : ''}`} onClick={() => setCalendarPhase('year')}>Année</button>
            </div>
            <div>
              <button className="btn-nav" onClick={() => navigateCalendar(-1)}>&lt;</button>
              <button className="btn-nav" onClick={() => setCalendarDate(new Date())} style={{ margin: '0 4px' }}>Aujourd'hui</button>
              <button className="btn-nav" onClick={() => navigateCalendar(1)}>&gt;</button>
            </div>
          </div>
        </div>

        {/* VUE MOIS */}
        {calendarPhase === 'month' && (
          <div className="month-grid">
            {weekdays.map(w => <div key={w} className="cal-weekday">{w}</div>)}
            {(() => {
              const firstDayIdx = new Date(cYear, cMonth, 1).getDay();
              const startOffset = (firstDayIdx === 0 ? 6 : firstDayIdx - 1);
              const totalDays = new Date(cYear, cMonth + 1, 0).getDate();
              const today = new Date();
              const cells = [];

              for (let i = 0; i < startOffset; i++) {
                cells.push(<div key={`emp-${i}`} className="cal-day-cell empty" style={{ background: 'transparent', border: 'none' }} />);
              }

              for (let d = 1; d <= totalDays; d++) {
                const isToday = today.getDate() === d && today.getMonth() === cMonth && today.getFullYear() === cYear;
                const isSelected = calendarDate.getDate() === d && calendarDate.getMonth() === cMonth && calendarDate.getFullYear() === cYear;
                const dayDate = new Date(cYear, cMonth, d);
                const ia = getIAReport(dayDate);
                const dayPnL = getDayPnL(cYear, cMonth, d);

                cells.push(
                  <div
                    key={`d-${d}`}
                    className={`cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setCalendarDate(new Date(cYear, cMonth, d))}
                    onDoubleClick={() => { setCalendarDate(new Date(cYear, cMonth, d)); setCalendarPhase('day'); }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="cal-day-num">{d}</span>
                      <span className="cal-ia-tag">IA {ia.score}%</span>
                    </div>

                    {/* AFFICHAGE DES TRADES ENREGISTRÉS SUR LE CALENDRIER */}
                    {dayPnL !== null ? (
                      <div className={`pnl-badge-cal ${dayPnL >= 0 ? 'pnl-badge-win' : 'pnl-badge-loss'}`}>
                        {dayPnL >= 0 ? `+${dayPnL}$` : `${dayPnL}$`}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pas de trade</div>
                    )}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        )}

        {/* VUE JOUR */}
        {calendarPhase === 'day' && (
          <div className="day-view-container">
            <div className="day-hero-card">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>SESSION DU JOUR</div>
              <div className="day-hero-num">{cDay}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 8 }}>{monthName} {cYear}</div>
            </div>

            <div className="ia-report-box">
              {/* HISTORIQUE DE LA JOURNÉE DANS LA VUE JOUR */}
              <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>📊 Trades exécutés pour ce jour :</span>
                {tradesForCurrentDate.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Aucun trade enregistré pour cette date.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {tradesForCurrentDate.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#0f172a', borderRadius: 6, fontSize: '0.85rem' }}>
                        <span><strong>{t.pair}</strong> ({t.type}) - {t.setup}</span>
                        <span style={{ fontWeight: 800, color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {t.pnl >= 0 ? `+${t.pnl}$` : `${t.pnl}$`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RAPPORT PRÉDICTIF IA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>✨ Rapport de session IA</span>
                <span className="cal-ia-tag" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Probabilité Succès : {iaReport.score}%</span>
              </div>

              <div className="ia-metrics">
                <div className="ia-metric-card">
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{iaReport.productivity}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Volatilité IA</div>
                </div>
                <div className="ia-metric-card">
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{iaReport.focus}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qualité Setups</div>
                </div>
                <div className="ia-metric-card">
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>{iaReport.window}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Créneau Favorable</div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', lineHeight: 1.4, background: 'var(--bg-card)', padding: 10, borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                💡 <strong>Conseil IA :</strong> {iaReport.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* VUE ANNÉE */}
        {calendarPhase === 'year' && (
          <div className="year-grid">
            {monthsList.map((m, idx) => (
              <div key={m} className="year-month-card" onClick={() => { setCalendarDate(new Date(cYear, idx, 1)); setCalendarPhase('month'); }}>
                <div style={{ fontWeight: 800, color: 'var(--primary)', textAlign: 'center' }}>{m}</div>
                <div className="mini-calendar">
                  {Array.from({ length: new Date(cYear, idx + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                    <div key={day} style={{ color: 'var(--text-muted)' }}>{day}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
