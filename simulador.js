const SIM_STORAGE_KEY = "ca_simulador_n3_4ramos";

const simCourses = [
  {
    id: "int",
    name: "Interfaz de Usuario",
    meta: "Nota 1: 25% | Nota 2: 35% | Nota 3: 40%",
    ev1: "6.2",
    ev2: "5.8",
    ev3Label: "Nota 3 - Trabajo 3 Maqueta web (40%)",
    defaultEv3: 6.0,
    calcNP: v => 6.2 * 0.25 + 5.8 * 0.35 + v * 0.4
  },
  {
    id: "con",
    name: "Construcción de Software",
    meta: "Nota 1: 25% | Nota 2: 35% | Nota 3: 40%",
    ev1: "5.0",
    ev2: "5.4",
    ev3Label: "Nota 3 - Defensa de proyecto (40%)",
    defaultEv3: 5.2,
    calcNP: v => 5.0 * 0.25 + 5.4 * 0.35 + v * 0.4
  },
  {
    id: "met",
    name: "Metodologías y Calidad",
    meta: "Nota 1: 25% | Nota 2: 35% | Nota 3: 40%",
    ev1: "6.4",
    ev2: "6.0",
    ev3Label: "Nota 3 - Auditoría y presentación (40%)",
    defaultEv3: 5.9,
    calcNP: v => 6.4 * 0.25 + 6.0 * 0.35 + v * 0.4
  },
  {
    id: "ado",
    name: "Análisis y Diseño OO",
    meta: "Nota 1: 25% | Nota 2: 35% | Nota 3: 40%",
    ev1: "3.5",
    ev2: "3.8",
    ev3Label: "Nota 3 - Diagramas UML y GRASP (40%)",
    defaultEv3: 3.5,
    calcNP: v => 3.5 * 0.25 + 3.8 * 0.35 + v * 0.4
  }
];

const simGrid = document.querySelector("#sim-courses-grid");
const summaryBadge = document.querySelector("#sim-summary-badge");
const resetAllBtn = document.querySelector("#sim-reset-all");

function loadSavedValues() {
  try {
    const raw = JSON.parse(localStorage.getItem(SIM_STORAGE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function saveValues(map) {
  try {
    localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignorar
  }
}

let savedMap = loadSavedValues();

function getCourseState(np, ex) {
  if (np < 4.0 || ex > 4.8) {
    return {
      cardClass: "state-bad",
      badgeClass: "b-crit",
      badgeText: "En riesgo",
      verdict: `Alerta roja: con Nota 1 (${3.5}) y Nota 2 (${3.8}) tu NP queda en ${np.toFixed(2)}. Sube la Nota 3 sobre 4.5 para salir de riesgo.`
    };
  }
  if (np < 5.3 || ex > 3.2) {
    return {
      cardClass: "state-warn",
      badgeClass: "b-med",
      badgeText: "Atención",
      verdict: `En rango medio: tu NP proyectada es ${np.toFixed(2)} y necesitas ${ex.toFixed(2)} en el examen final.`
    };
  }
  return {
    cardClass: "state-good",
    badgeClass: "b-low",
    badgeText: "Todo bien",
    verdict: `En verde: excelente promedio de presentación (${np.toFixed(2)}), solo necesitas ${Math.max(1.0, ex).toFixed(2)} en el examen.`
  };
}

function updateGlobalSummary() {
  if (!summaryBadge) return;
  let totalNp = 0;
  let riskCount = 0;

  for (const c of simCourses) {
    const val = Number(savedMap[c.id] ?? c.defaultEv3);
    const np = c.calcNP(val);
    totalNp += np;
    if (np < 4.0) riskCount += 1;
  }

  const avgSemester = (totalNp / simCourses.length).toFixed(2);
  summaryBadge.classList.remove("b-low", "b-med", "b-crit");

  if (riskCount > 0) {
    summaryBadge.textContent = `${riskCount} ramo en rojo | NP media: ${avgSemester}`;
    summaryBadge.classList.add("b-crit");
  } else {
    summaryBadge.textContent = `4 ramos aprobando | NP media: ${avgSemester}`;
    summaryBadge.classList.add("b-low");
  }
}

function renderSimulatorCards() {
  if (!simGrid) return;
  simGrid.innerHTML = "";

  for (const c of simCourses) {
    const initialVal = Number(savedMap[c.id] ?? c.defaultEv3);
    const card = document.createElement("article");
    card.className = "sim-pro-card";

    card.innerHTML = `
      <div class="sim-pro-top">
        <div>
          <h3>${c.name}</h3>
          <p class="sim-pro-meta">${c.meta}</p>
        </div>
        <span class="sim-badge" id="badge-${c.id}">-</span>
      </div>

      <div class="sim-grades-row">
        <div><span>Nota 1 (25%)</span><strong>${c.ev1}</strong></div>
        <div><span>Nota 2 (35%)</span><strong>${c.ev2}</strong></div>
        <div><span>Nota 3 (40%)</span><strong id="n3-box-${c.id}">${initialVal.toFixed(1)}</strong></div>
      </div>

      <div class="sim-slider-box">
        <div class="sim-slider-header">
          <label for="sl-${c.id}">${c.ev3Label}</label>
          <strong>Simular N3: <span id="val-${c.id}">${initialVal.toFixed(1)}</span></strong>
        </div>
        <input type="range" min="1.0" max="7.0" step="0.1" value="${initialVal}" id="sl-${c.id}">
        <div class="sim-pro-results">
          <div>NP proyectada: <strong id="np-${c.id}">-</strong></div>
          <div>Examen para 4.0: <strong id="ex-${c.id}">-</strong></div>
        </div>
      </div>

      <p class="sim-verdict" id="verdict-${c.id}"></p>
    `;

    simGrid.append(card);

    const slider = card.querySelector(`#sl-${c.id}`);
    const valEl = card.querySelector(`#val-${c.id}`);
    const n3BoxEl = card.querySelector(`#n3-box-${c.id}`);
    const npEl = card.querySelector(`#np-${c.id}`);
    const exEl = card.querySelector(`#ex-${c.id}`);
    const badgeEl = card.querySelector(`#badge-${c.id}`);
    const verdictEl = card.querySelector(`#verdict-${c.id}`);

    function updateCard() {
      const v = Number(slider.value);
      savedMap[c.id] = v;
      saveValues(savedMap);

      const np = c.calcNP(v);
      const ex = (4.0 - 0.6 * np) / 0.4;
      const state = getCourseState(np, ex);

      card.className = `sim-pro-card ${state.cardClass}`;
      badgeEl.className = `sim-badge ${state.badgeClass}`;
      badgeEl.textContent = state.badgeText;
      verdictEl.textContent = state.verdict;

      valEl.textContent = v.toFixed(1);
      n3BoxEl.textContent = v.toFixed(1);
      npEl.textContent = np.toFixed(2);
      npEl.className = np < 4.0 ? "sim-val-bad" : np < 5.3 ? "sim-val-warn" : "sim-val-ok";

      if (ex > 7.0) {
        exEl.textContent = `${ex.toFixed(2)} (No alcanza)`;
        exEl.className = "sim-val-bad";
      } else {
        const cleanEx = Math.max(1.0, ex);
        exEl.textContent = cleanEx.toFixed(2);
        exEl.className = cleanEx <= 3.5 ? "sim-val-ok" : cleanEx <= 4.8 ? "sim-val-warn" : "sim-val-bad";
      }

      updateGlobalSummary();
    }

    slider.addEventListener("input", updateCard);
    updateCard();
  }
}

if (resetAllBtn) {
  resetAllBtn.addEventListener("click", () => {
    savedMap = {};
    saveValues(savedMap);
    renderSimulatorCards();
  });
}

renderSimulatorCards();
