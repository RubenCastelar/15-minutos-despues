const concepts = [
  "Neuroplasticidad",
  "Ley de atraccion",
  "Sincronicidad",
  "Efecto mariposa",
  "Inconsciente colectivo",
  "Resonancia morfica",
  "Estado de flujo",
  "Teoria del caos",
  "Memoria ancestral",
  "Sombras del ego",
  "Atencion plena",
  "Realidad subjetiva",
  "Entropia creativa",
  "Sesgo de confirmacion",
  "Percepcion expandida",
  "Visualizacion mental",
  "Claridad mental",
  "Mente subconsciente",
  "Anclaje emocional",
  "Reprogramacion mental",
  "Potencial humano",
  "Coherencia mental",
  "Consciencia expandida",
  "Conexion mente cuerpo",
  "Intencion consciente",
  "Meditacion activa",
  "Intuicion entrenada",
  "Arquitectura mental",
  "Campos sutiles",
  "Alquimia interior",
  "Geometria sagrada",
  "Tiempo subjetivo",
  "Memoria celular",
  "Destino simbolico",
  "Energia residual",
  "Liminalidad",
  "Resonancia interna",
  "Presencia expandida",
  "Eter consciente",
  "Patrones invisibles",
  "Coincidencia significativa",
  "Vibracion personal",
  "Transmutacion emocional",
  "Percepcion simbolica",
  "Silencio mental",
  "Umbral intuitivo",
  "Magnetismo interno",
  "Conciencia testigo",
  "Eco del pensamiento",
  "Frecuencia emocional",
  "Unidad interior",
  "Conexion sutil",
  "Misterio consciente",
  "Puente invisible",
  "Destino intuitivo",
  "Codigo interno",
  "Convergencia mental",
  "Sexto sentido",
];

const bufferItems = 2;
const windowElement = document.getElementById("roulette-window");
const buttonElement = document.getElementById("spin-button");
const resultElement = document.getElementById("result-text");
const resultPanelElement = document.querySelector(".result-panel");
const appShellElement = document.querySelector(".app-shell");
const heroElement = document.querySelector(".hero");
const rouletteCardElement = document.querySelector(".roulette-card");
const socialFooterElement = document.querySelector(".social-footer");
const sessionPanelElement = document.getElementById("session-panel");
const backButtonElement = document.getElementById("back-button");
const sessionConceptElement = document.getElementById("session-concept");
const sessionButtonElement = document.getElementById("session-button");
const timerOrbElement = document.getElementById("timer-orb");
const timerStageElement = document.getElementById("timer-stage");
const timerValueElement = document.getElementById("timer-value");

const TIMER_STAGES = [
  {
    key: "focus",
    label: "15 minutos de investigación",
    buttonLabel: "Empezar 15 min",
    durationSeconds: 15 * 60,
  },
  {
    key: "cooldown",
    label: "Presentación",
    buttonLabel: "Empezar 1 min",
    durationSeconds: 60,
  },
];

let audioContext;
let isSpinning = false;
let currentIndex = 0;
let travelOffset = 0;
let timerIntervalId;
let timerDeadline = 0;
let currentWinner = "";
let currentMode = "idle";
let currentTimerStageIndex = 0;

function modulo(value, length) {
  return ((value % length) + length) % length;
}

function getUiMetrics() {
  const styles = getComputedStyle(document.documentElement);
  const visibleItems = Number.parseInt(
    styles.getPropertyValue("--visible-items"),
    10,
  );
  const itemHeight = Number.parseInt(styles.getPropertyValue("--item-height"), 10);

  return {
    visibleItems,
    itemHeight,
    focusIndex: Math.floor(visibleItems / 2),
    renderCount: visibleItems + bufferItems * 2,
  };
}

function getDisplayedWord(slotIndex) {
  const { focusIndex } = getUiMetrics();
  const conceptIndex = modulo(
    currentIndex + (slotIndex - focusIndex - bufferItems),
    concepts.length,
  );

  return concepts[conceptIndex];
}

function renderRoulette(winner = null) {
  const { focusIndex, itemHeight, renderCount } = getUiMetrics();

  windowElement.innerHTML = "";
  windowElement.style.transform = `translateY(${travelOffset - bufferItems * itemHeight}px)`;

  for (let slotIndex = 0; slotIndex < renderCount; slotIndex += 1) {
    const word = getDisplayedWord(slotIndex);
    const item = document.createElement("div");
    item.className = "roulette-item";
    item.textContent = word;

    if (slotIndex === focusIndex + bufferItems) {
      item.classList.add("is-focused");
    }

    if (winner && slotIndex === focusIndex + bufferItems && word === winner) {
      item.classList.add("is-winning");
    }

    windowElement.appendChild(item);
  }
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTick(intensity = 1) {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const clamped = Math.max(0.32, Math.min(intensity, 1));

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(920 - 280 * (1 - clamped), now);
  oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.038);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.05 * clamped, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.05);
}

function playWinTone() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(440, now);
  oscillator.frequency.linearRampToValueAtTime(660, now + 0.12);
  oscillator.frequency.linearRampToValueAtTime(880, now + 0.28);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.48);
}

function updateResult(text) {
  resultElement.textContent = text;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimerDisplay(totalSeconds) {
  timerValueElement.textContent = formatTime(totalSeconds);
}

function getCurrentTimerStage() {
  return TIMER_STAGES[currentTimerStageIndex];
}

function syncTimerStageUi() {
  const stage = getCurrentTimerStage();
  if (!stage) {
    return;
  }

  timerStageElement.textContent = stage.label;
  sessionButtonElement.textContent = stage.buttonLabel;
  updateTimerDisplay(stage.durationSeconds);
  updateTimerProgress(1);
}

function stopTimer() {
  if (timerIntervalId) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = undefined;
  }
}

function setSessionMode(mode) {
  currentMode = mode;
  const sessionVisible = mode !== "idle";
  appShellElement.classList.toggle("is-idle", mode === "idle");
  appShellElement.classList.toggle("is-session", mode !== "idle");

  heroElement.hidden = sessionVisible;
  rouletteCardElement.hidden = sessionVisible;
  socialFooterElement.hidden = sessionVisible;
  sessionPanelElement.hidden = !sessionVisible;
  sessionPanelElement.setAttribute("aria-hidden", String(!sessionVisible));

  if (!sessionVisible) {
    sessionPanelElement.classList.remove("is-visible");
    return;
  }

  requestAnimationFrame(() => {
    sessionPanelElement.classList.add("is-visible");
  });
}

function updateTimerProgress(progress) {
  timerOrbElement.style.setProperty("--timer-progress", String(progress));
}

function enterSessionMode(winner) {
  currentWinner = winner;
  currentTimerStageIndex = 0;
  sessionConceptElement.textContent = winner;
  timerOrbElement.classList.remove("is-running", "is-finished");
  sessionButtonElement.hidden = false;
  sessionButtonElement.disabled = false;
  syncTimerStageUi();
  setSessionMode("ready");
}

function startTimer() {
  const stage = getCurrentTimerStage();
  if (!stage) {
    return;
  }

  const durationSeconds = stage.durationSeconds;
  stopTimer();
  timerDeadline = Date.now() + durationSeconds * 1000;
  updateTimerDisplay(durationSeconds);
  updateTimerProgress(1);
  timerOrbElement.classList.remove("is-finished");
  timerOrbElement.classList.add("is-running");
  sessionButtonElement.hidden = true;
  setSessionMode("running");

  timerIntervalId = window.setInterval(() => {
    const remainingSeconds = Math.max(
      0,
      Math.ceil((timerDeadline - Date.now()) / 1000),
    );
    const progress = remainingSeconds / durationSeconds;

    updateTimerDisplay(remainingSeconds);
    updateTimerProgress(progress);

    if (remainingSeconds > 0) {
      return;
    }

    stopTimer();
    timerOrbElement.classList.remove("is-running");
    sessionButtonElement.hidden = false;
    sessionButtonElement.disabled = false;

    if (currentTimerStageIndex < TIMER_STAGES.length - 1) {
      currentTimerStageIndex += 1;
      syncTimerStageUi();
      setSessionMode("ready");
      return;
    }

    timerOrbElement.classList.add("is-finished");
    timerStageElement.textContent = "Sesión completada";
    sessionButtonElement.textContent = "Finalizar";
    setSessionMode("finished");
  }, 250);
}

function resetToInitialState() {
  stopTimer();
  currentWinner = "";
  travelOffset = 0;
  timerDeadline = 0;
  currentTimerStageIndex = 0;
  updateResult("Esperando activación");
  timerOrbElement.classList.remove("is-running", "is-finished");
  sessionButtonElement.hidden = false;
  sessionButtonElement.disabled = false;
  syncTimerStageUi();
  buttonElement.disabled = false;
  buttonElement.textContent = "Iniciar búsqueda";
  sessionPanelElement.classList.remove("is-visible");
  setSessionMode("idle");
  renderRoulette();
}

function advanceSteps(stepCount, progressRatio) {
  for (let step = 0; step < stepCount; step += 1) {
    currentIndex = modulo(currentIndex - 1, concepts.length);
    playTick(1 - progressRatio * 0.45);
  }
}

function finishSpin(winnerIndex) {
  currentIndex = winnerIndex;
  travelOffset = 0;

  const winner = concepts[winnerIndex];

  renderRoulette(winner);
  updateResult(winner);
  resultPanelElement.classList.remove("is-winning");
  void resultPanelElement.offsetWidth;
  resultPanelElement.classList.add("is-winning");

  playWinTone();
  enterSessionMode(winner);
  buttonElement.disabled = false;
  buttonElement.textContent = "Volver a buscar";
  isSpinning = false;
}

function spin() {
  if (isSpinning) {
    return;
  }

  ensureAudio();
  isSpinning = true;
  buttonElement.disabled = true;
  buttonElement.textContent = "Procesando...";
  updateResult("Explorando posibilidades...");

  const { itemHeight } = getUiMetrics();
  const winnerIndex = Math.floor(Math.random() * concepts.length);
  const startIndex = currentIndex;
  const downwardDistance = modulo(startIndex - winnerIndex, concepts.length);
  const totalSteps = concepts.length * 3 + downwardDistance;
  const totalDistance = totalSteps * itemHeight;
  const duration = 4600;
  const start = performance.now();
  let completedSteps = 0;

  function animate(frame) {
    const progress = Math.min((frame - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const traveledDistance = eased * totalDistance;
    const nextCompletedSteps = Math.floor(traveledDistance / itemHeight);

    if (nextCompletedSteps > completedSteps) {
      advanceSteps(nextCompletedSteps - completedSteps, progress);
      completedSteps = nextCompletedSteps;
    }

    travelOffset = traveledDistance - completedSteps * itemHeight;
    renderRoulette();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    finishSpin(winnerIndex);
  }

  requestAnimationFrame(animate);
}

function shouldIgnoreSpaceTrigger(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const interactiveSelector = [
    "button",
    "input",
    "textarea",
    "select",
    "a",
    '[role="button"]',
    '[contenteditable="true"]',
  ].join(", ");

  return Boolean(target.closest(interactiveSelector));
}

window.addEventListener("resize", () => {
  if (!isSpinning) {
    travelOffset = 0;
    renderRoulette();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || shouldIgnoreSpaceTrigger(event.target)) {
    return;
  }

  event.preventDefault();
  if (currentMode === "ready") {
    startTimer();
    return;
  }

  if (currentMode === "finished") {
    resetToInitialState();
    return;
  }

  if (currentMode === "idle") {
    spin();
  }
});

sessionButtonElement.addEventListener("click", () => {
  if (currentMode === "ready") {
    startTimer();
    return;
  }

  if (currentMode === "finished") {
    resetToInitialState();
  }
});

backButtonElement.addEventListener("click", resetToInitialState);

renderRoulette();
syncTimerStageUi();
setSessionMode("idle");
buttonElement.addEventListener("click", spin);
