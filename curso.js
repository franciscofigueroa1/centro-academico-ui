const courseTabs = [...document.querySelectorAll('[role="tab"]')];

function selectCourseTab(selectedTab, moveFocus = false) {
  for (const tab of courseTabs) {
    const selected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;

    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (panel) panel.hidden = !selected;
  }

  if (moveFocus) selectedTab.focus();
}

for (const [index, tab] of courseTabs.entries()) {
  tab.addEventListener("click", () => selectCourseTab(tab));
  tab.addEventListener("keydown", event => {
    let nextIndex;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % courseTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + courseTabs.length) % courseTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = courseTabs.length - 1;

    if (nextIndex !== undefined) {
      event.preventDefault();
      selectCourseTab(courseTabs[nextIndex], true);
    }
  });
}

/* Carga dinamica del ramo seleccionado y simulador de notas */
const allCourses = (window.ACADEMIC_DATA && window.ACADEMIC_DATA.courses) || {};
const params = new URLSearchParams(window.location.search);
const courseId = params.get("ramo") || "iu";
const currentCourse = allCourses[courseId] || allCourses.iu;

if (currentCourse) {
  document.title = `${currentCourse.name} | Centro académico`;

  const badgeEl = document.querySelector("#course-badge");
  const titleEl = document.querySelector("#course-title");
  const areaEl = document.querySelector("#course-area");
  const tasksListEl = document.querySelector("#course-tasks-list");
  const materialsListEl = document.querySelector("#course-materials-list");
  const gradesTbody = document.querySelector("#grades-tbody");
  const avgBadge = document.querySelector("#grades-current-avg");
  const simExamTitle = document.querySelector("#sim-exam-title");
  const simTarget = document.querySelector("#sim-target");
  const simResult = document.querySelector("#sim-result");
  const canvasGradesLink = document.querySelector("#course-canvas-grades");

  if (badgeEl) {
    badgeEl.textContent = currentCourse.code;
    badgeEl.className = `course-icon ${currentCourse.colorClass}`;
  }
  if (titleEl) titleEl.textContent = currentCourse.name;
  if (areaEl) areaEl.textContent = currentCourse.area;
  if (canvasGradesLink) canvasGradesLink.href = currentCourse.canvasGradesUrl;

  if (tasksListEl) {
    tasksListEl.innerHTML = "";
    for (const task of currentCourse.tasks) {
      const article = document.createElement("article");
      article.className = "task-card";
      article.innerHTML = `
        <div class="task-card-top">
          <h2>${task.title}</h2>
          <span class="eval-weight">${task.weight}</span>
        </div>
        <p class="task-due"><time datetime="${task.dueIso}">Plazo: ${task.dueText}</time></p>
        <div class="task-card-bottom">
          <span class="task-status ${task.statusClass}">${task.status}</span>
          <a class="task-link" href="${task.href}" ${task.external ? 'target="_blank" rel="noopener noreferrer"' : ""}>${task.linkText} →</a>
        </div>
      `;
      tasksListEl.append(article);
    }
  }

  if (materialsListEl) {
    materialsListEl.innerHTML = "";
    for (const mat of currentCourse.materials) {
      const link = document.createElement("a");
      link.className = "material-card";
      link.href = mat.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.innerHTML = `
        <div class="material-top">
          <span class="material-title">${mat.title}</span>
          <span class="event-tag ${currentCourse.tagClass}">${mat.type}</span>
        </div>
        <span class="material-link">Abrir en Canvas →</span>
      `;
      materialsListEl.append(link);
    }
  }

  const gradeItems = currentCourse.grades.items.map(item => ({ ...item }));
  const examWeight = currentCourse.grades.examWeight;
  const examName = currentCourse.grades.examName;

  if (simExamTitle) {
    simExamTitle.textContent = `Simulador para ${examName} (${examWeight}%)`;
  }

  function recalculateSimulation() {
    let weightedSum = 0;
    let totalWeightDone = 0;

    for (const item of gradeItems) {
      const cleanScore = Math.min(7, Math.max(1, Number(item.score) || 1));
      weightedSum += cleanScore * (item.weight / 100);
      totalWeightDone += item.weight;
    }

    const currentAvg = totalWeightDone > 0 ? weightedSum / (totalWeightDone / 100) : 0;
    if (avgBadge) {
      avgBadge.textContent = `Promedio parcial: ${currentAvg.toFixed(1)}`;
    }

    const target = simTarget ? Number(simTarget.value) : 4.0;
    const needed = (target - weightedSum) / (examWeight / 100);

    if (!simResult) return;
    simResult.classList.remove("is-good", "is-warn");

    if (needed <= 1.0) {
      simResult.textContent = `Con tus notas actuales ya alcanzas la meta de ${target.toFixed(1)} (incluso con nota mínima 1.0 en ${examName}).`;
      simResult.classList.add("is-good");
    } else if (needed <= 7.0) {
      simResult.textContent = `Necesitas al menos un ${needed.toFixed(1)} en ${examName} (${examWeight}%) para cerrar el ramo con ${target.toFixed(1)}.`;
      if (needed <= 4.5) simResult.classList.add("is-good");
    } else {
      const maxPossible = (weightedSum + 7.0 * (examWeight / 100)).toFixed(1);
      simResult.textContent = `Para llegar a ${target.toFixed(1)} necesitarías ${needed.toFixed(1)}. El promedio máximo posible con un 7.0 es ${maxPossible}.`;
      simResult.classList.add("is-warn");
    }
  }

  if (gradesTbody) {
    gradesTbody.innerHTML = "";
    gradeItems.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.name}</td>
        <td class="mono-cell">${item.weight}%</td>
        <td>
          <input
            type="number"
            class="grade-input"
            min="1.0"
            max="7.0"
            step="0.1"
            value="${item.score.toFixed(1)}"
            aria-label="Nota de ${item.name}"
            data-grade-index="${idx}"
          >
        </td>
      `;
      gradesTbody.append(tr);
    });

    gradesTbody.addEventListener("input", event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      const idx = Number(input.dataset.gradeIndex);
      if (!Number.isNaN(idx) && gradeItems[idx]) {
        gradeItems[idx].score = Number(input.value) || 1.0;
        recalculateSimulation();
      }
    });
  }

  if (simTarget) {
    simTarget.addEventListener("change", recalculateSimulation);
  }

  recalculateSimulation();
}
