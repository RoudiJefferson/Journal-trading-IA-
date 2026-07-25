import React, { useState } from 'react';

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

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
    score: score,
    productivity: `${prod}%`,
    focus: score > 88 ? 'Excellente' : 'Modérée',
    window: windowStr,
    timeline: [
      { time: 'Matinée', text: d % 2 === 0 ? 'Forte capacité d\'analyse et de décision. Priorisez le travail de fond.' : 'Review globale, organisation des priorités et mise au propre des dossiers.' },
      { time: 'Après-midi', text: d % 3 === 0 ? 'Créneau stratégique d\'exécution. Résolution de problèmes complexes.' : 'Gestion des flux de travail courants et échanges clés.' },
      { time: 'Soirée', text: 'Analyse des résultats de la journée et préparation de la session suivante.' }
    ],
    recommendation: d % 2 === 0
      ? `Journée particulièrement favorable avec un score de ${score}/100. Maximisez votre engagement sur le créneau du ${windowStr}.`
      : `Journée d'équilibre. Maintenez une approche méthodique et évitez la dispersion d'énergie durant l'après-midi.`
  };
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPhase, setCurrentPhase] = useState('month'); // 'day', 'month', 'year'

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (currentPhase === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (currentPhase === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (currentPhase === 'year') {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleCellClick = (year, month, day) => {
    setCurrentDate(new Date(year, month, day));
  };

  const handleCellDoubleClick = (year, month, day) => {
    setCurrentDate(new Date(year, month, day));
    setCurrentPhase('day');
  };

  const selectMonthFromYear = (year, month) => {
    setCurrentDate(new Date(year, month, 1));
    setCurrentPhase('month');
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

  // Calcul du calendrier mois
  const renderMonthGrid = () => {
    const firstDayIdx = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIdx === 0 ? 6 : firstDayIdx - 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const cells = [];

    // Jours de la semaine
    weekdays.forEach((d) => {
      cells.push(<div key={`lbl-${d}`} className="weekday-label">{d}</div>);
    });

    // Cases vides
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
    }

    // Jours du mois
    for (let d = 1; d <= totalDays; d++) {
      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      const isSelected = currentDate.getDate() === d && currentDate.getMonth() === month && currentDate.getFullYear() === year;
      const dayDate = new Date(year, month, d);
      const ia = getIAReport(dayDate);

      let classNames = "calendar-day-cell";
      if (isToday) classNames += " today";
      else if (isSelected) classNames += " selected";

      cells.push(
        <div
          key={`day-${d}`}
          className={classNames}
          onClick={() => handleCellClick(year, month, d)}
          onDoubleClick={() => handleCellDoubleClick(year, month, d)}
        >
          <div className="day-num">{d}</div>
          <div className={`day-ia-badge ${ia.score >= 88 ? 'badge-high' : 'badge-mid'}`}>
            IA {ia.score}%
          </div>
          <div className="cell-hint">Cliquer pour voir</div>
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
          --radius: 16px;
        }
        body { background-color: var(--bg-body); color: var(--text-main); font-family: system-ui, sans-serif; }
        .app-container { max-width: 1050px; margin: 24px auto; background: var(--card-bg); border-radius: var(--radius); padding: 32px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 24px; }
        .tabs-header { display: flex; background: #f8fafc; padding: 6px; border-radius: 12px; border: 1px solid var(--border); gap: 8px; }
        .tab-btn { flex: 1; padding: 12px; border: none; background: transparent; color: var(--text-muted); font-weight: 600; border-radius: 8px; cursor: pointer; }
        .tab-btn.active { background: #ffffff; color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
        .top-title { font-size: 1.8rem; font-weight: 800; text-transform: capitalize; }
        .nav-controls { display: flex; gap: 10px; }
        .btn-action { background: #fff; border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-action:hover { background: var(--primary-soft); color: var(--primary); }
        .calendar-month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
        .weekday-label { text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; }
        .calendar-day-cell { background: #f8fafc; border: 2px solid transparent; border-radius: 12px; min-height: 95px; padding: 10px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s; }
        .calendar-day-cell:hover:not(.empty) { background: #fff; border-color: var(--primary); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(37,99,235,0.12); }
        .calendar-day-cell.empty { background: transparent; border: none; cursor: default; }
        .calendar-day-cell.selected { border-color: var(--primary); background: var(--primary-soft); }
        .calendar-day-cell.today { background: var(--primary); color: white; }
        .day-num { font-size: 1.1rem; font-weight: 800; }
        .day-ia-badge { font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; align-self: flex-start; }
        .badge-high { background: #dcfce7; color: #15803d; }
        .badge-mid { background: #fef3c7; color: #b45309; }
        .calendar-day-cell.today .day-ia-badge { background: rgba(255,255,255,0.3); color: white; }
        .cell-hint { font-size: 0.65rem; color: var(--text-muted); }
        .day-details-drawer { margin-top: 20px; background: #f8fafc; border: 1px solid var(--border); border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .drawer-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
        .drawer-title { font-size: 1.3rem; font-weight: 800; }
        .drawer-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
        .full-day-container { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
        .big-day-card { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: var(--radius); padding: 36px 20px; text-align: center; }
        .big-day-number { font-size: 6rem; font-weight: 900; color: var(--primary); line-height: 1; }
        .ia-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .metric-card { background: #f8fafc; border: 1px solid var(--border); padding: 12px; border-radius: 10px; text-align: center; }
        .metric-value { font-size: 1.3rem; font-weight: 800; color: var(--primary); }
        .metric-label { font-size: 0.75rem; color: var(--text-muted); }
        .timeline-row { display: flex; gap: 12px; padding: 10px; background: #f8fafc; border-radius: 8px; font-size: 0.9rem; }
        .timeline-time { font-weight: 700; color: var(--primary); min-width: 80px; }
        .recom-box { background: var(--success-bg); border-left: 4px solid var(--success); padding: 14px; border-radius: 0 10px 10px 0; color: #065f46; font-size: 0.9rem; }
        .year-grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .year-month-box { background: #f8fafc; border-radius: 14px; padding: 16px; cursor: pointer; transition: all 0.2s; }
        .year-month-box:hover { background: #fff; transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.05); }
        .month-box-title { font-weight: 800; color: var(--primary); text-align: center; margin-bottom: 12px; }
        .mini-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; font-size: 0.7rem; text-align: center; }
        .mini-cell.today { background: var(--primary); color: white; font-weight: bold; border-radius: 4px; }
      `}</style>

      {/* Onglets */}
      <nav className="tabs-header">
        <button className={`tab-btn ${currentPhase === 'day' ? 'active' : ''}`} onClick={() => setCurrentPhase('day')}>Vue Jour</button>
        <button className={`tab-btn ${currentPhase === 'month' ? 'active' : ''}`} onClick={() => setCurrentPhase('month')}>Vue Mois</button>
        <button className={`tab-btn ${currentPhase === 'year' ? 'active' : ''}`} onClick={() => setCurrentPhase('year')}>Vue Année</button>
      </nav>

      {/* Barre d'en-tête */}
      <div className="top-bar">
        <h1 className="top-title">{getHeaderTitle()}</h1>
        <div className="nav-controls">
          <button className="btn-action" onClick={() => navigate(-1)}>&lt; Précédent</button>
          <button className="btn-action" onClick={goToToday}>Aujourd'hui</button>
          <button className="btn-action" onClick={() => navigate(1)}>Suivant &gt;</button>
        </div>
      </div>

      {/* VUE JOUR */}
      {currentPhase === 'day' && (
        <div className="full-day-container">
          <div className="big-day-card">
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: 2 }}>VUE JOUR</div>
            <div className="big-day-number">{day}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 10, textTransform: 'capitalize' }}>
              {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="ia-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>✨ Rapport & Analyse IA de la journée</div>
              <div className="day-ia-badge badge-high">Score IA : {iaReport.score}/100</div>
            </div>

            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-value">{iaReport.productivity}</div>
                <div className="metric-label">Productivité</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{iaReport.focus}</div>
                <div className="metric-label">Clarté d'esprit</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{iaReport.window}</div>
                <div className="metric-label">Créneau clé</div>
              </div>
            </div>

            <div style={{ fontWeight: 700 }}>📅 Découpage horaire synthétique :</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {iaReport.timeline.map((t, idx) => (
                <div key={idx} className="timeline-row">
                  <span className="timeline-time">{t.time}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700 }}>💡 Recommandation IA :</div>
            <div className="recom-box">{iaReport.recommendation}</div>
          </div>
        </div>
      )}

      {/* VUE MOIS */}
      {currentPhase === 'month' && (
        <>
          <div className="calendar-month-grid">
            {renderMonthGrid()}
          </div>

          <div className="day-details-drawer">
            <div className="drawer-header">
              <div className="drawer-title">
                {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <button className="btn-action" onClick={() => setCurrentPhase('day')}>Ouvrir en plein écran &gt;</button>
            </div>
            <div className="drawer-grid">
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Score & Métriques</p>
                <div className="day-ia-badge badge-high" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                  Score IA : {iaReport.score}/100
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>Analyse synthétique IA :</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4 }}>
                  {iaReport.recommendation} Fenêtre d'action optimale : {iaReport.window}.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VUE ANNÉE */}
      {currentPhase === 'year' && (
        <div className="year-grid-container">
          {months.map((mName, mIdx) => {
            const daysInM = new Date(year, mIdx + 1, 0).getDate();
            const today = new Date();

            return (
              <div key={mName} className="year-month-box" onClick={() => selectMonthFromYear(year, mIdx)}>
                <div className="month-box-title">{mName}</div>
                <div className="mini-grid">
                  {Array.from({ length: daysInM }, (_, i) => i + 1).map((d) => {
                    const isToday = today.getDate() === d && today.getMonth() === mIdx && today.getFullYear() === year;
                    return (
                      <div key={d} className={`mini-cell ${isToday ? 'today' : ''}`}>
                        {d}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
