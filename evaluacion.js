const STORAGE_KEY = "centro_academico_pasos_trabajo3";
const evaluationData = window.ACADEMIC_DATA ? window.ACADEMIC_DATA.evaluation : null;

const stepsList = document.querySelector("#steps-list");
const stepsEmpty = document.querySelector("#steps-empty");
const stepsCounter = document.querySelector("#steps-counter");
const stepsPercent = document.querySelector("#steps-percent");
const stepsBar = document.querySelector("#steps-bar");
const evalStatus = document.querySelector("#eval-status");

const saveAlert = document.querySelector("#save-alert");
const saveAlertText = document.querySelector("#save-alert-text");
const closeAlertBtn = document.querySelector("#close-alert");

const modal = document.querySelector("#step-modal");
const openModalBtn = document.querySelector("#open-step-modal");
const closeModalBtn = document.querySelector("#close-step-modal");
const cancelModalBtn = document.querySelector("#cancel-step-modal");

const stepForm = document.querySelector("#step-form");
const titleInput = document.querySelector("#step-title");
const priorityInput = document.querySelector("#step-priority");
const noteInput = document.querySelector("#step-note");
const errorText = document.querySelector("#step-error");

let alertTimeoutId = null;

function loadSteps() {
  const defaults = evaluationData ? evaluationData.defaultSteps : [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaults.map(step => ({ ...step }));
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : defaults.map(step => ({ ...step }));
  } catch {
    return defaults.map(step => ({ ...step }));
  }
}

function saveSteps(steps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
  } catch {
    // Si el navegador bloquea storage local, sigue funcionando en memoria
  }
}

let steps = loadSteps();

function priorityClass(priority) {
  if (priority === "Alta") return "tag-rose";
  if (priority === "Media") return "tag-violet";
  return "tag-blue";
}

function showAlert(message) {
  if (!saveAlert) return;
  if (saveAlertText && message) saveAlertText.textContent = message;
  saveAlert.hidden = false;

  if (alertTimeoutId) clearTimeout(alertTimeoutId);
  alertTimeoutId = setTimeout(() => {
    saveAlert.hidden = true;
  }, 4500);
}

function hideAlert() {
  if (!saveAlert) return;
  saveAlert.hidden = true;
  if (alertTimeoutId) clearTimeout(alertTimeoutId);
}

function updateSummary() {
  const total = steps.length;
  const doneCount = steps.filter(step => step.done).length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  if (stepsCounter) stepsCounter.textContent = `${doneCount} de ${total} completados`;
  if (stepsPercent) stepsPercent.textContent = `${percent}%`;
  if (stepsBar) stepsBar.style.width = `${percent}%`;
  if (stepsEmpty) stepsEmpty.hidden = total > 0;

  if (evalStatus) {
    if (total > 0 && doneCount === total) {
      evalStatus.textContent = "Lista para entregar";
      evalStatus.classList.add("is-complete");
    } else {
      evalStatus.textContent = "En progreso";
      evalStatus.classList.remove("is-complete");
    }
  }
}

function renderSteps() {
  if (!stepsList) return;
  stepsList.innerHTML = "";

  for (const step of steps) {
    const item = document.createElement("li");
    item.className = `step-item${step.done ? " is-done" : ""}`;

    const label = document.createElement("label");
    label.className = "step-check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = step.done;
    checkbox.setAttribute("aria-label", `Marcar "${step.title}" como completado`);
    checkbox.addEventListener("change", () => {
      step.done = checkbox.checked;
      saveSteps(steps);
      renderSteps();
    });

    const content = document.createElement("span");
    content.className = "step-body";

    const topLine = document.createElement("span");
    topLine.className = "step-top";

    const titleSpan = document.createElement("span");
    titleSpan.className = "step-title";
    titleSpan.textContent = step.title;

    const badge = document.createElement("span");
    badge.className = `event-tag ${priorityClass(step.priority)}`;
    badge.textContent = step.priority;

    topLine.append(titleSpan, badge);
    content.append(topLine);

    if (step.note) {
      const noteSpan = document.createElement("span");
      noteSpan.className = "step-note";
      noteSpan.textContent = step.note;
      content.append(noteSpan);
    }

    label.append(checkbox, content);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "step-remove";
    removeBtn.textContent = "Quitar";
    removeBtn.setAttribute("aria-label", `Quitar paso "${step.title}"`);
    removeBtn.addEventListener("click", () => {
      steps = steps.filter(current => current.id !== step.id);
      saveSteps(steps);
      renderSteps();
    });

    item.append(label, removeBtn);
    stepsList.append(item);
  }

  updateSummary();
}

function clearValidation() {
  if (!titleInput || !errorText) return;
  titleInput.classList.remove("is-invalid");
  titleInput.removeAttribute("aria-invalid");
  errorText.hidden = true;
  errorText.textContent = "";
}

function showValidationError(message) {
  if (!titleInput || !errorText) return;
  titleInput.classList.add("is-invalid");
  titleInput.setAttribute("aria-invalid", "true");
  errorText.textContent = message;
  errorText.hidden = false;
  titleInput.focus();
}

function openModal() {
  if (!modal) return;
  clearValidation();
  if (stepForm) stepForm.reset();
  modal.hidden = false;
  document.body.classList.add("modal-open");
  if (titleInput) titleInput.focus();
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (openModalBtn) openModalBtn.focus();
}

if (evaluationData) {
  const courseEl = document.querySelector("#eval-course");
  const weightEl = document.querySelector("#eval-weight");
  const titleEl = document.querySelector("#eval-title");
  const dueEl = document.querySelector("#eval-due");
  const summaryEl = document.querySelector("#eval-summary");
  const canvasLink = document.querySelector("#eval-canvas-link");

  if (courseEl) courseEl.textContent = evaluationData.course;
  if (weightEl) weightEl.textContent = evaluationData.weight;
  if (titleEl) titleEl.textContent = evaluationData.title;
  if (dueEl) {
    dueEl.textContent = evaluationData.dueText;
    dueEl.setAttribute("datetime", evaluationData.dueIso);
  }
  if (summaryEl) summaryEl.textContent = evaluationData.summary;
  if (canvasLink) canvasLink.href = evaluationData.canvasUrl;
}

if (openModalBtn) openModalBtn.addEventListener("click", openModal);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
if (closeAlertBtn) closeAlertBtn.addEventListener("click", hideAlert);

if (modal) {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal && !modal.hidden) {
    closeModal();
  }
});

if (titleInput) {
  titleInput.addEventListener("input", () => {
    if (titleInput.classList.contains("is-invalid")) clearValidation();
  });
}

if (stepForm) {
  stepForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = titleInput ? titleInput.value.trim() : "";
    const priority = priorityInput ? priorityInput.value : "Media";
    const note = noteInput ? noteInput.value.trim() : "";

    if (!title) {
      showValidationError("Escribe un título para el paso antes de guardar.");
      return;
    }

    if (title.length < 3) {
      showValidationError("El título debe tener al menos 3 caracteres.");
      return;
    }

    const alreadyExists = steps.some(
      step => step.title.toLocaleLowerCase("es") === title.toLocaleLowerCase("es")
    );
    if (alreadyExists) {
      showValidationError("Ya agregaste un paso con ese mismo nombre.");
      return;
    }

    steps.push({
      id: `step-${Date.now()}`,
      title,
      priority,
      note,
      done: false
    });

    saveSteps(steps);
    renderSteps();
    closeModal();
    showAlert(`"${title}" se agregó a tu lista de pasos.`);
  });
}

renderSteps();
