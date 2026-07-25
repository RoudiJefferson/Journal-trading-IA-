<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendrier & Analyse IA - Phase & Interactivité</title>
  <style>
    :root {
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --primary-color: #2563eb;
      --primary-light: #eff6ff;
      --accent-color: #8b5cf6;
      --text-color: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      --radius: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 950px;
      background-color: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Navigation par phases */
    .tabs-nav {
      display: flex;
      background-color: var(--bg-color);
      padding: 6px;
      border-radius: 12px;
      gap: 6px;
    }

    .tab-btn {
      flex: 1;
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: var(--text-color);
    }

    .tab-btn.active {
      background-color: var(--card-bg);
      color: var(--primary-color);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    /* En-tête */
    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--border-color);
    }

    .current-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-color);
      text-transform: capitalize;
    }

    .nav-btns {
      display: flex;
      gap: 8px;
    }

    .nav-btn {
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .nav-btn:hover {
      background: var(--border-color);
    }

    /* Vues par Phase */
    .view-phase {
      display: none;
      animation: fadeIn 0.25s ease-in-out;
    }

    .view-phase.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* --- PHASE 1 : VUE JOUR & ANALYSE IA --- */
    .day-wrapper {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
    }

    .day-card {
      background: var(--primary-light);
      border: 1px solid #bfdbfe;
      border-radius: var(--radius);
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .day-tag {
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--primary-color);
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .day-number {
      font-size: 5.5rem;
      font-weight: 900;
      line-height: 1;
      color: var(--primary-color);
      margin-bottom: 10px;
    }

    .day-details {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
      text-transform: capitalize;
    }

    /* Section Analyse IA Jour */
    .ai-analysis-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }

    .ai-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }

    .ai-title {
      font-size: 1.2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--accent-color);
    }

    .ai-score {
      background: #f3e8ff;
      color: var(--accent-color);
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .ai-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .metric-box {
      background: var(--bg-color);
      padding: 12px;
      border-radius: 10px;
      text-align: center;
    }

    .metric-val {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .metric-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .ai-section-title {
      font-weight: 700;
      font-size: 0.95rem;
      margin-top: 5px;
      color: var(--text-color);
    }

    .ai-timeline {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.9rem;
    }

    .timeline-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 8px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .timeline-time {
      font-weight: 700;
      color: var(--primary-color);
      min-width: 65px;
    }

    .ai-recommendation {
      background: #ecfdf5;
      border-left: 4px solid var(--success-color);
      padding: 12px;
      border-radius: 0 8px 8px 0;
      font-size: 0.9rem;
      color: #065f46;
    }

    /* --- PHASE 2 : VUE MOIS --- */
    .month-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 10px;
      text-align: center;
    }

    .weekday-header {
      font-weight: 600;
      color: var(--text-muted);
      padding: 10px 0;
      font-size: 0.9rem;
      text-transform: uppercase;
    }

    .month-day {
      padding: 14px 8px;
      border-radius: 12px;
      font-weight: 600;
      background-color: var(--bg-color);
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      min-height: 75px;
      border: 2px solid transparent;
    }

    .month-day:hover:not(.empty) {
      background-color: #e2e8f0;
      border-color: var(--primary-color);
      transform: translateY(-2px);
    }

    .month-day.empty {
      background: transparent;
      cursor: default;
      border: none;
    }

    .month-day.selected {
      border-color: var(--primary-color);
      background-color: var(--primary-light);
    }

    .month-day.today {
      background-color: var(--primary-color);
      color: white;
    }

    .day-badge {
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 6px;
      font-weight: 700;
      margin-top: 4px;
    }

    .badge-high { background: #dcfce7; color: #15803d; }
    .badge-mid { background: #fef3c7; color: #b45309; }
    .month-day.today .day-badge { background: rgba(255,255,255,0.3); color: white; }

    /* Modal / Drawer d'aperçu rapide au clic dans la vue Mois */
    .quick-ia-preview {
      margin-top: 20px;
      padding: 16px;
      background: #f1f5f9;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* --- PHASE 3 : VUE ANNÉE --- */
    .year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .year-month-card {
      background: var(--bg-color);
      border-radius: 12px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .year-month-card:hover {
      border-color: var(--primary-color);
      background: var(--card-bg);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .year-month-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 10px;
      color: var(--primary-color);
      text-align: center;
      text-transform: capitalize;
    }

    .mini-calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      font-size: 0.7rem;
      text-align: center;
    }

    .mini-day {
      padding: 4px 0;
      border-radius: 4px;
    }

    .mini-day.has-date {
      color: var(--text-color);
    }

    .mini-day.today {
      background-color: var(--primary-color);
      color: white;
      font-weight: bold;
    }

    @media (max-width: 800px) {
      .day-wrapper {
        grid-template-columns: 1fr;
      }
      .year-grid {
        grid-template-columns: repeat(1, 1fr);
      }
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Barre de sélection des phases -->
    <nav class="tabs-nav">
      <button class="tab-btn active" onclick="switchPhase('day')">Jour</button>
      <button class="tab-btn" onclick="switchPhase('month')">Mois</button>
      <button class="tab-btn" onclick="switchPhase('year')">Année</button>
    </nav>

    <!-- En-tête de navigation dynamique -->
    <div class="date-header">
      <h1 class="current-title" id="headerTitle">Juillet 2026</h1>
      <div class="nav-btns">
        <button class="nav-btn" onclick="navigate(-1)">&lt; Précédent</button>
        <button class="nav-btn" onclick="goToToday()">Aujourd'hui</button>
        <button class="nav-btn" onclick="navigate(1)">Suivant &gt;</button>
      </div>
    </div>

    <!-- PHASE 1 : VUE JOUR AVEC ANALYSE IA COMPLÈTE -->
    <div id="dayView" class="view-phase active">
      <div class="day-wrapper">
        <div class="day-card">
          <div class="day-tag">VUE JOUR</div>
          <div class="day-number" id="dayBigNumber">25</div>
          <div class="day-details" id="dayFullDetails">Samedi 25 Juillet 2026</div>
        </div>

        <div class="ai-analysis-card">
          <div class="ai-header">
            <div class="ai-title">✨ Analyse IA Avancée du Jour</div>
            <div class="ai-score" id="aiScoreTag">Score IA : 92/100</div>
          </div>

          <div class="ai-metrics">
            <div class="metric-box">
              <div class="metric-val" id="mProductivity">88%</div>
              <div class="metric-lbl">Productivité</div>
            </div>
            <div class="metric-box">
              <div class="metric-val" id="mFocus">Haute</div>
              <div class="metric-lbl">Clarté/Focus</div>
            </div>
            <div class="metric-box">
              <div class="metric-val" id="mVolat">Optimale</div>
              <div class="metric-lbl">Fenêtre d'action</div>
            </div>
          </div>

          <div class="ai-section-title">📅 Synthèse & Découpage IA de la journée :</div>
          <div class="ai-timeline" id="aiTimeline">
            <!-- Rempli par JavaScript -->
          </div>

          <div class="ai-section-title">💡 Recommandation Stratégique IA :</div>
          <div class="ai-recommendation" id="aiRecommendation">
            <!-- Rempli par JavaScript -->
          </div>
        </div>
      </div>
    </div>

    <!-- PHASE 2 : VUE MOIS -->
    <div id="monthView" class="view-phase">
      <div class="month-grid" id="monthGrid">
        <!-- Rempli en JavaScript -->
      </div>
      <div class="quick-ia-preview" id="quickPreview">
        <div>
          <strong id="previewDateTitle">Cliquez sur un jour du mois</strong>
          <p id="previewText" style="font-size:0.85rem; color:var(--text-muted);">Sélectionnez une case pour voir l'analyse synthétique et accéder au détail complet.</p>
        </div>
        <button class="nav-btn" id="btnGoToDay" style="display:none;" onclick="switchPhase('day')">Voir le détail du jour &gt;</button>
      </div>
    </div>

    <!-- PHASE 3 : VUE ANNÉE -->
    <div id="yearView" class="view-phase">
      <div class="year-grid" id="yearGrid">
        <!-- Rempli en JavaScript -->
      </div>
    </div>
  </div>

  <script>
    let currentDate = new Date();
    let currentPhase = 'day'; // 'day', 'month', ou 'year'

    const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    /* Algorithme de simulation d'analyse IA dynamique selon la date */
    function generateIAData(date) {
      const dayNum = date.getDate();
      const seed = (date.getFullYear() * 1000) + (date.getMonth() * 31) + dayNum;
      
      const scores = [85, 92, 78, 95, 88, 90, 82];
      const score = scores[seed % scores.length];
      
      const focusLevels = ['Très Haute', 'Excellente', 'Modérée', 'Optimale'];
      const focus = focusLevels[seed % focusLevels.length];

      return {
        score: score,
        productivity: `${Math.min(99, score - 3)}%`,
        focus: focus,
        window: (dayNum % 2 === 0) ? 'Matin (08h-12h)' : 'Après-midi (14h-18h)',
        timeline: [
          { time: 'Matin', text: dayNum % 2 === 0 ? 'Pics de concentration élevés. Idéal pour les tâches complexes et décisions clés.' : 'Phase d\'organisation et de révision des objectifs.' },
          { time: 'Après-midi', text: dayNum % 3 === 0 ? 'Session à forte valeur ajoutée. Opportunités d\'exécution optimales.' : 'Suivi des opérations, réunions et ajustements tactiques.' },
          { time: 'Soir', text: 'Bilan de journée, consolidation des résultats et préparation du lendemain.' }
        ],
        recommendation: dayNum % 2 === 0 
          ? 'Priorisez l\'exécution en début de journée. La fenêtre temporelle du matin présente les meilleures probabilités de succès.'
          : 'Concentrez-vous sur l\'analyse approfondie et la planification stratégique globale avant d\'engager des actions majeures.'
      };
    }

    function switchPhase(phase) {
      currentPhase = phase;

      document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', 
          (phase === 'day' && idx === 0) || 
          (phase === 'month' && idx === 1) || 
          (phase === 'year' && idx === 2)
        );
      });

      document.getElementById('dayView').classList.toggle('active', phase === 'day');
      document.getElementById('monthView').classList.toggle('active', phase === 'month');
      document.getElementById('yearView').classList.toggle('active', phase === 'year');

      render();
    }

    function navigate(direction) {
      if (currentPhase === 'day') {
        currentDate.setDate(currentDate.getDate() + direction);
      } else if (currentPhase === 'month') {
        currentDate.setMonth(currentDate.getMonth() + direction);
      } else if (currentPhase === 'year') {
        currentDate.setFullYear(currentDate.getFullYear() + direction);
      }
      render();
    }

    function goToToday() {
      currentDate = new Date();
      render();
    }

    function selectDate(year, month, day, directToDay = false) {
      currentDate = new Date(year, month, day);
      if (directToDay) {
        switchPhase('day');
      } else {
        renderMonthView();
        updateQuickPreview();
      }
    }

    function selectMonth(year, month) {
      currentDate = new Date(year, month, 1);
      switchPhase('month');
    }

    function render() {
      renderHeader();
      if (currentPhase === 'day') renderDayView();
      if (currentPhase === 'month') renderMonthView();
      if (currentPhase === 'year') renderYearView();
    }

    function renderHeader() {
      const headerTitle = document.getElementById('headerTitle');
      const year = currentDate.getFullYear();
      const monthName = months[currentDate.getMonth()];
      const day = currentDate.getDate();

      if (currentPhase === 'day') {
        headerTitle.textContent = `${day} ${monthName} ${year}`;
      } else if (currentPhase === 'month') {
        headerTitle.textContent = `${monthName} ${year}`;
      } else if (currentPhase === 'year') {
        headerTitle.textContent = `${year}`;
      }
    }

    /* Rendu Phase 1: Jour + Analyse IA */
    function renderDayView() {
      const dayBigNumber = document.getElementById('dayBigNumber');
      const dayFullDetails = document.getElementById('dayFullDetails');

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = currentDate.toLocaleDateString('fr-FR', options);

      dayBigNumber.textContent = currentDate.getDate();
      dayFullDetails.textContent = formattedDate;

      // Injection Analyse IA dynamique
      const ia = generateIAData(currentDate);
      document.getElementById('aiScoreTag').textContent = `Score IA : ${ia.score}/100`;
      document.getElementById('mProductivity').textContent = ia.productivity;
      document.getElementById('mFocus').textContent = ia.focus;
      document.getElementById('mVolat').textContent = ia.window;

      const timelineContainer = document.getElementById('aiTimeline');
      timelineContainer.innerHTML = ia.timeline.map(item => `
        <div class="timeline-item">
          <span class="timeline-time">${item.time}</span>
          <span>${item.text}</span>
        </div>
      `).join('');

      document.getElementById('aiRecommendation').textContent = ia.recommendation;
    }

    /* Rendu Phase 2: Mois */
    function renderMonthView() {
      const grid = document.getElementById('monthGrid');
      grid.innerHTML = '';

      weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'weekday-header';
        header.textContent = day;
        grid.appendChild(header);
      });

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDayIndex = new Date(year, month, 1).getDay();
      const adjustedFirstDay = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
      const totalDays = new Date(year, month + 1, 0).getDate();
      const today = new Date();

      for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'month-day empty';
        grid.appendChild(emptyCell);
      }

      for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'month-day';

        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        const isSelected = currentDate.getDate() === day && currentDate.getMonth() === month && currentDate.getFullYear() === year;

        if (isToday) dayCell.classList.add('today');
        if (isSelected && !isToday) dayCell.classList.add('selected');

        const tempDate = new Date(year, month, day);
        const iaData = generateIAData(tempDate);

        dayCell.innerHTML = `
          <span>${day}</span>
          <span class="day-badge ${iaData.score >= 90 ? 'badge-high' : 'badge-mid'}">IA: ${iaData.score}%</span>
        `;

        // Clic sur la case du mois
        dayCell.onclick = () => selectDate(year, month, day, false);
        // Double clic pour aller directement à la vue jour
        dayCell.ondblclick = () => selectDate(year, month, day, true);

        grid.appendChild(dayCell);
      }

      updateQuickPreview();
    }

    function updateQuickPreview() {
      const ia = generateIAData(currentDate);
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      
      document.getElementById('previewDateTitle').textContent = `Jour sélectionné : ${currentDate.toLocaleDateString('fr-FR', options)}`;
      document.getElementById('previewText').textContent = `Score de la journée : ${ia.score}/100 — Fenêtre d'action idéale : ${ia.window}. ${ia.recommendation}`;
      
      const btn = document.getElementById('btnGoToDay');
      btn.style.display = 'inline-block';
    }

    /* Rendu Phase 3: Année */
    function renderYearView() {
      const grid = document.getElementById('yearGrid');
      grid.innerHTML = '';

      const year = currentDate.getFullYear();
      const today = new Date();

      months.forEach((monthName, monthIndex) => {
        const card = document.createElement('div');
        card.className = 'year-month-card';
        card.onclick = () => selectMonth(year, monthIndex);

        const title = document.createElement('div');
        title.className = 'year-month-title';
        title.textContent = monthName;
        card.appendChild(title);

        const miniCal = document.createElement('div');
        miniCal.className = 'mini-calendar';

        const totalDays = new Date(year, monthIndex + 1, 0).getDate();
        for (let d = 1; d <= totalDays; d++) {
          const miniDay = document.createElement('div');
          miniDay.className = 'mini-day has-date';
          miniDay.textContent = d;

          if (today.getDate() === d && today.getMonth() === monthIndex && today.getFullYear() === year) {
            miniDay.classList.add('today');
          }

          miniCal.appendChild(miniDay);
        }

        card.appendChild(miniCal);
        grid.appendChild(card);
      });
    }

    // Initialisation
    render();
  </script>

</body>
</html>
