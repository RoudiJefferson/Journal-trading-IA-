import React, { useState, useEffect } from 'react';

// --- DONNÉES PAR DÉFAUT ---
const initialTrades = [
  {
    id: 1,
    date: '2026-07-25',
    pair: 'XAUUSD (Gold)',
    type: 'BUY',
    entry: 2380.50,
    exit: 2395.00,
    lot: 0.5,
    pnl: 725,
    result: 'WIN',
    rr: 2.5,
    setup: 'Liquidity Sweep + FVG',
    notes: 'Exécution propre sur la session NY.',
    image: ''
  },
  {
    id: 2,
    date: '2026-07-24',
    pair: 'EURUSD',
    type: 'SELL',
    entry: 1.0850,
    exit: 1.0875,
    lot: 1.0,
    pnl: -250,
    result: 'LOSS',
    rr: -1,
    setup: 'Breaker Block',
    notes: 'Entrée prématurée.',
    image: ''
  }
];

const months = [
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

  const score = 75 + (hash % 24);
  const prod = Math.min(98, score - 2);
  const windows = ['Matin (08h-12h)', 'Après-midi (14h-17h)', 'Début de soirée (18h-20h)'];
  const windowStr = windows[hash % windows.length];

  return {
    score,
    productivity: `${prod}%`,
    focus: score > 88 ? 'Excellente' : 'Modérée',
    window: windowStr,
    timeline: [
      { time: 'Matinée', text: d % 2 === 0 ? 'Forte capacité d\'analyse et de décision. Priorisez le travail de fond.' : 'Review globale et organisation des priorités.' },
      { time: 'Après-midi', text: d % 3 === 0 ? 'Créneau stratégique d\'exécution. Résolution de problèmes complexes.' : 'Gestion des flux de travail courants et échanges clés.' },
      { time: 'Soirée', text: 'Analyse des résultats de la journée et préparation de la session suivante.' }
    ],
    recommendation: d % 2 === 0
      ? `Journée particulièrement favorable avec un score de ${score}/100. Maximisez votre engagement sur le créneau du ${windowStr}.`
      : `Journée d'équilibre. Maintenez une approche méthodique et évitez la dispersion d'énergie.`
  };
}

export default function App() {
  // --- ÉTATS DU JOURNAL ---
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('rm_trading_journal_data');
    return saved ? JSON.parse(saved) : initialTrades;
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: 'XAUUSD',
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPhase, setCurrentPhase] = useState('month'); // 'day', 'month', 'year'

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem('rm_trading_journal_data', JSON.stringify(trades));
  }, [trades]);

  // --- STATISTIQUES GLOBALES ---
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
  const netPnL = trades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);

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
      pair: 'XAUUSD',
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

  // --- NAVIGATION CALENDRIER ---
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (currentPhase === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (currentPhase === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (currentPhase === 'year') newDate.setFullYear(newDate.getFullYear() + direction);
    setCurrentDate(newDate);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const monthName = months[month];
  const iaReport = getIAReport(currentDate);

  const getHeaderTitle = () => {
    if (currentPhase === 'day') return `${day} ${monthName} ${year}`;
    if (currentPhase === 'month') return `${monthName} ${year}`;
    return `${year}`;
  };

  // Calcule le PnL cumulé pour une date précise (YYYY-MM-DD)
  const getDayPnL = (year, month, day) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = trades.filter(t => t.date === formattedDate);
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
  };

  // Formater les trades de la date courante pour la vue Jour
  const currentDateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const tradesForCurrentDate = trades.filter(t => t.date === currentDateFormatted);

  const filteredTrades = filterPair === 'ALL' 
    ? trades 
    : trades.filter(t => t.pair.toLowerCase().includes(filterPair.toLowerCase()));

  // --- RENDU DU CALENDRIER ---
  const renderMonthGrid = () => {
    const firstDayIdx = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIdx === 0 ? 6 : firstDayIdx - 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const cells = [];

    weekdays.forEach((d) => {
      cells.push(<div key={`lbl-${d}`} className="weekday-label">{d}</div>);
    });

    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      const isSelected = currentDate.getDate() === d && currentDate.getMonth() === month && currentDate.getFullYear() === year;
      const dayDate = new Date(year, month, d);
      const ia = getIAReport(dayDate);
      const dayPnL = getDayPnL(year, month, d);

      let classNames = "calendar-day-cell";
      if (isToday) classNames += " today";
      else if (isSelected) classNames += " selected";

      cells.push(
        <div
          key={`day-${d}`}
          className={classNames}
          onClick={() => setCurrentDate(new Date(year, month, d))}
          onDoubleClick={() => {
            setCurrentDate(new Date(year, month, d));
            setCurrentPhase('day');
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="day-num">{d}</span>
            <span className={`day-ia-badge ${ia.score >= 88 ? 'badge-high' : 'badge-mid'}`}>
              IA {ia.score}%
            </span>
          </div>

          {/* AFFICHAGE DES RÉSULTATS DE TRADING SUR LE CALENDRIER */}
          {dayPnL !== null ? (
            <div className={`trading-result-badge ${dayPnL >= 0 ? 'pnl-win' : 'pnl-loss'}`}>
              {dayPnL >= 0 ? `+${dayPnL}$` : `${dayPnL}$`}
            </div>
          ) : (
            <div className="cell-hint">Pas de trade</div>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="app-container">
      <style>{`
        :root {
          --bg-body: #f1f5f9;
          --card-bg: #ffffff;
          --primary: #2563eb;
          --primary-hover: #1d4ed8;
          --primary-soft: #eff6ff;
          --accent: #7c3aed;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --success: #10b981;
          --success-bg: #ecfdf5;
          --danger: #ef4444;
          --danger-bg: #fef2f2;
          --radius: 16px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: var(--bg-body); color: var(--text-main); font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
        .app-container { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        /* DASHBOARD CARDS */
        .card { background: var(--card-bg); border-radius: var(--radius); padding: 24px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        .header-title { font-size: 1.8rem; font-weight: 800; color: var(--primary); }

        .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .kpi-box { background: #f8fafc; border: 1px solid var(--border); padding: 16px; border-radius: 12px; }
        .kpi-title { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .kpi-val { font-size: 1.6rem; font-weight: 800; margin-top: 4px; }

        /* MAIN GRID */
        .main-grid { display: grid; grid-template-columns: 340px 1fr; gap: 24px; }
        @media(max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

        /* FORM */
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .form-group label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
        .form-group input, .form-group select, .form-group textarea { padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.9rem; outline: none; }
        .form-group input:focus, .form-group select:focus { border-color: var(--primary); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-primary { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; }
        .btn-primary:hover { background: var(--primary-hover); }

        /* TABLE */
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left; }
        th { background: #f8fafc; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.8rem; }
        td { padding: 12px; border-bottom: 1px solid var(--border); }

        /* CALENDRIER CLASSIQUE */
        .tabs-header { display: flex; background: #f8fafc; padding: 6px; border-radius: 12px; border: 1px solid var(--border); gap: 8px; }
        .tab-btn { flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-muted); font-weight: 700; border-radius: 8px; cursor: pointer; }
        .tab-btn.active { background: #ffffff; color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

        .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-top: 12px; }
        .btn-action { background: #fff; border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-action:hover { background: var(--primary-soft); color: var(--primary); }

        .calendar-month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 16px; }
        .weekday-label { text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; }
        .calendar-day-cell { background: #f8fafc; border: 2px solid transparent; border-radius: 12px; min-height: 95px; padding: 8px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s; }
        .calendar-day-cell:hover:not(.empty) { background: #fff; border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.1); }
        .calendar-day-cell.empty { background: transparent; border: none; cursor: default; }
        .calendar-day-cell.selected { border-color: var(--primary); background: var(--primary-soft); }
        .calendar-day-cell.today { border-color: var(--primary); font-weight: bold; }
        
        .day-num { font-size: 1.1rem; font-weight: 800; }
        .day-ia-badge { font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 12px; }
        .badge-high { background: #dcfce7; color: #15803d; }
        .badge-mid { background: #fef3c7; color: #b45309; }
        .cell-hint { font-size: 0.65rem; color: var(--text-muted); }

        /* BADGES TRADING DANS CALENDRIER */
        .trading-result-badge { margin-top: 4px; padding: 4px 6px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; text-align: center; }
        .pnl-win { background: var(--success-bg); color: var(--success); border: 1px solid #a7f3d0; }
        .pnl-loss { background: var(--danger-bg); color: var(--danger); border: 1px solid #fecaca; }

        /* VUE JOUR DETAILED */
        .full-day-container { display: grid; grid-template-columns: 260px 1fr; gap: 20px; }
        .big-day-card { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: var(--radius); padding: 24px; text-align: center; }
        .big-day-number { font-size: 5rem; font-weight: 900; color: var(--primary); line-height: 1; }

        .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .metric-card { background: #f8fafc; border: 1px solid var(--border); padding: 10px; border-radius: 8px; text-align: center; }
        
        .year-grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .year-month-box { background: #f8fafc; border-radius: 12px; padding: 12px; cursor: pointer; border: 1px solid var(--border); }
        .year-month-box:hover { border-color: var(--primary); background: #fff; }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="header-title">RM TRADING JOURNAL</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Suivi d'activité & Analyse de performance</p>
          </div>
          <button className="btn-action" onClick={() => localStorage.clear() || setTrades([])}>Réinitialiser</button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="kpi-row">
        <div className="kpi-box">
          <div className="kpi-title">P&L Net Total</div>
          <div className="kpi-val" style={{ color: netPnL >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {netPnL >= 0 ? `+${netPnL.toFixed(2)}$` : `${netPnL.toFixed(2)}$`}
          </div>
        </div>
        <div className="kpi-box">
          <div className="kpi-title">Win Rate</div>
          <div className="kpi-val" style={{ color: 'var(--primary)' }}>{winRate}%</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-title">Total Trades</div>
          <div className="kpi-val">{totalTrades}</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-title">Victoires / Défaites</div>
          <div className="kpi-val">
            <span style={{ color: 'var(--success)' }}>{wins}W</span> / <span style={{ color: 'var(--danger)' }}>{losses}L</span>
          </div>
        </div>
      </div>

      {/* FORMULAIRE + HISTORIQUE */}
      <div className="main-grid">
        {/* FORMULAIRE */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14 }}>✍️ Enregistrer un Trade</h2>
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
                <label>P&L ($ Gains/Pertes)</label>
                <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleInputChange} placeholder="725 ou -250" required />
              </div>
              <div className="form-group">
                <label>Ratio R:R</label>
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
              <label>Observations</label>
              <textarea name="notes" rows="2" value={formData.notes} onChange={handleInputChange} placeholder="Commentaires du trade..." />
            </div>

            <button type="submit" className="btn-primary">Ajouter au Journal</button>
          </form>
        </div>

        {/* HISTORIQUE */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>📊 Historique des Trades</h2>
            <select value={filterPair} onChange={(e) => setFilterPair(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <option value="ALL">Toutes les paires</option>
              <option value="XAUUSD">Gold (XAUUSD)</option>
              <option value="EURUSD">EURUSD</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Paire</th>
                  <th>Type</th>
                  <th>R:R</th>
                  <th>P&L ($)</th>
                  <th>Setup</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlignment: 'center', color: 'var(--text-muted)' }}>Aucun trade enregistré.</td>
                  </tr>
                ) : (
                  filteredTrades.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td style={{ fontWeight: 700 }}>{t.pair}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, background: t.type === 'BUY' ? '#eff6ff' : '#fff7ed', color: t.type === 'BUY' ? 'var(--primary)' : '#c2410c' }}>
                          {t.type}
                        </span>
                      </td>
                      <td>1:{t.rr}</td>
                      <td style={{ fontWeight: 800, color: t.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {t.pnl >= 0 ? `+${t.pnl}$` : `${t.pnl}$`}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.setup}</td>
                      <td>
                        <button onClick={() => handleDeleteTrade(t.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION CALENDRIER DE TRADING INTEGRÉ */}
      <div className="card">
        {/* Onglets */}
        <nav className="tabs-header">
          <button className={`tab-btn ${currentPhase === 'day' ? 'active' : ''}`} onClick={() => setCurrentPhase('day')}>Vue Jour</button>
          <button className={`tab-btn ${currentPhase === 'month' ? 'active' : ''}`} onClick={() => setCurrentPhase('month')}>Vue Mois</button>
          <button className={`tab-btn ${currentPhase === 'year' ? 'active' : ''}`} onClick={() => setCurrentPhase('year')}>Vue Année</button>
        </nav>

        {/* Barre d'en-tête Nav */}
        <div className="top-bar">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'capitalize' }}>{getHeaderTitle()}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-action" onClick={() => navigate(-1)}>&lt; Précédent</button>
            <button className="btn-action" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
            <button className="btn-action" onClick={() => navigate(1)}>Suivant &gt;</button>
          </div>
        </div>

        {/* VUE MOIS */}
        {currentPhase === 'month' && (
          <div className="calendar-month-grid">
            {renderMonthGrid()}
          </div>
        )}

        {/* VUE JOUR */}
        {currentPhase === 'day' && (
          <div className="full-day-container" style={{ marginTop: 16 }}>
            <div className="big-day-card">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: 1 }}>JOURNÉE DU</div>
              <div className="big-day-number">{day}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* RÉSULTATS DU TRADING CE JOUR */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 8 }}>📊 Trades enregistrés pour cette date</h3>
                {tradesForCurrentDate.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aucun trade enregistré pour ce jour-là.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tradesForCurrentDate.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700 }}>{t.pair} ({t.type})</span>
                        <span style={{ fontWeight: 800, color: t.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {t.pnl >= 0 ? `+${t.pnl}$` : `${t.pnl}$`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ANLYSE IA */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>✨ Rapport & Clarté d'esprit IA</div>
                <div className="metrics-row" style={{ marginBottom: 12 }}>
                  <div className="metric-card">
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{iaReport.productivity}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Productivité</div>
                  </div>
                  <div className="metric-card">
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{iaReport.focus}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus</div>
                  </div>
                  <div className="metric-card">
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>{iaReport.window}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fenêtre clé</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  💡 {iaReport.recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VUE ANNÉE */}
        {currentPhase === 'year' && (
          <div className="year-grid-container" style={{ marginTop: 16 }}>
            {months.map((mName, mIdx) => {
              const daysInM = new Date(year, mIdx + 1, 0).getDate();
              return (
                <div key={mName} className="year-month-box" onClick={() => { setCurrentDate(new Date(year, mIdx, 1)); setCurrentPhase('month'); }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', textAlign: 'center', marginBottom: 8 }}>{mName}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: '0.65rem', textAlign: 'center' }}>
                    {Array.from({ length: daysInM }, (_, i) => i + 1).map((d) => (
                      <div key={d} style={{ color: 'var(--text-muted)' }}>{d}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
