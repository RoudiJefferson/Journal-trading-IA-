<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendrier Interactif Moderne</title>
  <style>
    :root {
      --bg-color: #f4f6f9;
      --card-bg: #ffffff;
      --primary-color: #2563eb;
      --primary-hover: #1d4ed8;
      --text-color: #1e293b;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --accent-bg: #eff6ff;
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
      max-width: 900px;
      background-color: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Navigation par onglets (Phases) */
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

    /* En-tête de contrôle de date */
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

    /* Phases/Vues */
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

    /* --- VUE JOUR --- */
    .day-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      background: var(--accent-bg);
      border-radius: var(--radius);
      border: 1px solid #dbeafe;
    }

    .day-tag {
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--primary-color);
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .day-number {
      font-size: 7rem;
      font-weight: 900;
      line-height: 1;
      color: var(--primary-color);
      margin-bottom: 10px;
    }

    .day-details {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--text-color);
      text-transform: capitalize;
    }

    /* --- VUE MOIS --- */
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
      padding: 16px 0;
      border-radius: 10px;
      font-weight: 600;
      background-color: var(--bg-color);
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.2s;
    }

    .month-day:hover:not(.empty) {
      background-color: var(--border-color);
    }

    .month-day.empty {
      background: transparent;
      cursor: default;
    }

    .month-day.today {
      background-color: var(--primary-color);
      color: white;
    }

    /* --- VUE ANNÉE --- */
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
      border: 1px solid transparent;
    }

    .year-month-card:hover {
      border-color: var(--primary-color);
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

    @media (max-width: 640px) {
      .year-grid {
        grid-template-columns: repeat(1, 1fr);
      }
      .day-number {
        font-size: 5rem;
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

    <!-- PHASE 1 : VUE JOUR -->
    <div id="dayView" class="view-phase active">
      <div class="day-container">
        <div class="day-tag">VUE JOUR</div>
        <div class="day-number" id="dayBigNumber">25</div>
        <div class="day-details" id="dayFullDetails">Samedi 25 Juillet 2026</div>
      </div>
    </div>

    <!-- PHASE 2 : VUE MOIS -->
    <div id="monthView" class="view-phase">
      <div class="month-grid" id="monthGrid">
        <!-- Rempli en JavaScript -->
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
    let currentPhase = 'day'; // 'day', 'month', or 'year'

    const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    function switchPhase(phase) {
      currentPhase = phase;

      // Mettre à jour les onglets
      document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', 
          (phase === 'day' && idx === 0) || 
          (phase === 'month' && idx === 1) || 
          (phase === 'year' && idx === 2)
        );
      });

      // Mettre à jour les conteneurs
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

    function selectDate(year, month, day) {
      currentDate = new Date(year, month, day);
      switchPhase('day');
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

    /* Render Phase 1: Jour */
    function renderDayView() {
      const dayBigNumber = document.getElementById('dayBigNumber');
      const dayFullDetails = document.getElementById('dayFullDetails');

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = currentDate.toLocaleDateString('fr-FR', options);

      dayBigNumber.textContent = currentDate.getDate();
      dayFullDetails.textContent = formattedDate;
    }

    /* Render Phase 2: Mois */
    function renderMonthView() {
      const grid = document.getElementById('monthGrid');
      grid.innerHTML = '';

      // En-têtes des jours de la semaine
      weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'weekday-header';
        header.textContent = day;
        grid.appendChild(header);
      });

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Premier jour du mois
      const firstDayIndex = new Date(year, month, 1).getDay();
      // Ajuster pour commencer par Lundi (0) au lieu de Dimanche (0)
      const adjustedFirstDay = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);

      const totalDays = new Date(year, month + 1, 0).getDate();
      const today = new Date();

      // Cases vides avant le 1er du mois
      for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'month-day empty';
        grid.appendChild(emptyCell);
      }

      // Jours du mois
      for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'month-day';
        dayCell.textContent = day;

        const isToday = today.getDate() === day && 
                        today.getMonth() === month && 
                        today.getFullYear() === year;

        if (isToday) dayCell.classList.add('today');

        dayCell.onclick = () => selectDate(year, month, day);
        grid.appendChild(dayCell);
      }
    }

    /* Render Phase 3: Année */
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

        // Jours du mois en mini
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
