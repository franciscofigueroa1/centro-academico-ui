const SIM_STORAGE_KEY = "ca_simulador_ev3_valores";

const simCourses = [
  {
    id: "int",
    name: "Interfaz de Usuario",
    meta: "Sección 02 | Examen: 14 dic (13:00, Sala L-203)",
    badgeText: "Prioridad alta",
    badgeClass: "b-high",
    ev1: "6.4",
    ev2: "5.5",
    ev3Label: "Trabajo 3 - Maqueta web (40% NP)",
    defaultEv3: 6.0,
    calcNP: v => 6.4 * 0.25 + 5.5 * 0.35 + v * 0.4,
    verdict: "Con un 6.0 en el Trabajo 3 aseguras una nota de presentación sobre 5.9 y llegas con margen amplio al cierre."
  },
  {
    id: "con",
    name: "Construcción de Software",
    meta: "Sección 01 | Examen: 09 dic (11:10, Sala L-201)",
    badgeText: "En progreso",
    badgeClass: "b-med",
    ev1: "5.2",
    ev2: "5.6",
    ev3Label: "Evaluación 3 - Proyecto (40% NP)",
    defaultEv3: 5.5,
    calcNP: v => 5.2 * 0.25 + 5.6 * 0.35 + v * 0.4,
    verdict: "Manteniendo sobre 5.0 en la tercera entrega necesitas menos de un 3.0 en el examen final para aprobar."
  },
  {
    id: "met",
    name: "Metodologías y Calidad",
    meta: "Sección 01 | Examen: 18 dic (13:00, Sala L-201)",
    badgeText: "Ramo al día",
    badgeClass: "b-low",
    ev1: "6.1",
    ev2: "5.9",
    ev3Label: "Trabajo 2 - Presentación (40% NP)",
    defaultEv3: 5.8,
    calcNP: v => 6.1 * 0.25 + 5.9 * 0.35 + v * 0.4,
    verdict: "Buen promedio acumulado. Con una entrega sobre 5.5 quedas en rango de eximición o examen mínimo."
  },
  {
    id: "ado",
    name: "Análisis y Diseño OO",
    meta: "Sección 01 | Examen: 15 dic (08:10, Sala L-203)",
    badgeText: "En progreso",
    badgeClass: "b-med",
    ev1: "5.4",
    ev2: "5.7",
    ev3Label: "Entrega UML y secuencia (40% NP)",
    defaultEv3: 5.5,
    calcNP: v => 5.4 * 0.25 + 5.7 * 0.35 + v * 0.4,
    verdict: "Las dos primeras notas te dejan bien posicionado; apunta a 5.5 en el modelo UML para cerrar sobre 5.5."
  },
  {
    id: "tal",
    name: "Taller de Nuevas Tecnologías",
    meta: "Sección 01 | Examen: 11 dic (11:10, Sala L-204)",
    badgeText: "Ramo al día",
    badgeClass: "b-low",
    ev1: "6.2",
    ev2: "5.8",
    ev3Label: "Proyecto aplicado (40% NP)",
    defaultEv3: 5.6,
    calcNP: v => 6.2 * 0.25 + 5.8 * 0.35 + v * 0.4,
    verdict: "Promedio estable durante el semestre. Un 5.0 o más mantiene la nota de presentación cerca de 5.8."
  },
  {
    id: "mat",
    name: "Matemática Aplicada",
    meta: "Sección 02 | Examen: 07 dic (11:10, Sala S-305)",
    badgeText: "Priorizar estudio",
    badgeClass: "b-high",
    ev1: "4.6",
    ev2: "4.8",
    ev3Label: "Certamen 2 + Controles (40% NP)",
    defaultEv3: 5.0,
    calcNP: v => 4.6 * 0.25 + 4.8 * 0.35 + v * 0.4,
    verdict: "Es el ramo que requiere más práctica esta semana: subir de 4.5 a 5.2 en el Certamen 2 baja bastante la exigencia del examen."
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

function updateGlobalSummary() {
  if (!summaryBadge) return;
  let totalNp = 0;

  for (const c of simCourses) {
    const val = Number(savedMap[c.id] ?? c.defaultEv3);
    totalNp += c.calcNP(val);
  }

  const avgSemester = (totalNp / simCourses.length).toFixed(2);
  summaryBadge.textContent = `NP promedio proyectada: ${avgSemester}`;
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
        <span class="sim-badge ${c.badgeClass}">${c.badgeText}</span>
      </div>

      <div class="sim-grades-row">
        <div><span>Ev1 (25%)</span><strong>${c.ev1}</strong></div>
        <div><span>Ev2 (35%)</span><strong>${c.ev2}</strong></div>
        <div><span>Pendiente</span><strong>Ev3 (40%)</strong></div>
      </div>

      <div class="sim-slider-box">
        <div class="sim-slider-header">
          <label for="sl-${c.id}">${c.ev3Label}</label>
          <strong>Nota Ev3: <span id="val-${c.id}">${initialVal.toFixed(1)}</span></strong>
        </div>
        <input type="range" min="1.0" max="7.0" step="0.1" value="${initialVal}" id="sl-${c.id}">
        <div class="sim-pro-results">
          <div>NP proyectada: <strong id="np-${c.id}">-</strong></div>
          <div>Examen para 4.0: <strong id="ex-${c.id}">-</strong></div>
        </div>
      </div>

      <p class="sim-verdict">${c.verdict}</p>
    `;

    simGrid.append(card);

    const slider = card.querySelector(`#sl-${c.id}`);
    const valEl = card.querySelector(`#val-${c.id}`);
    const npEl = card.querySelector(`#np-${c.id}`);
    const exEl = card.querySelector(`#ex-${c.id}`);

    function updateCard() {
      const v = Number(slider.value);
      savedMap[c.id] = v;
      saveValues(savedMap);

      const np = c.calcNP(v);
      const ex = (4.0 - 0.6 * np) / 0.4;

      valEl.textContent = v.toFixed(1);
      npEl.textContent = np.toFixed(2);
      npEl.className = np < 4.0 ? "sim-val-warn" : "sim-val-ok";

      if (ex > 7.0) {
        exEl.textContent = `${ex.toFixed(2)} (No alcanza)`;
        exEl.className = "sim-val-bad";
      } else {
        const cleanEx = Math.max(1.0, ex);
        exEl.textContent = cleanEx.toFixed(2);
        exEl.className = cleanEx <= 4.0 ? "sim-val-ok" : cleanEx <= 5.2 ? "sim-val-warn" : "sim-val-bad";
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
