const concepts = [
  "Neuroplasticidad",
  "Ley de atraccion",
  "Sincronicidad",
  "Efecto mariposa",
  "Paradoja de Fermi",
  "Inconsciente colectivo",
  "Inteligencia emocional",
  "Pensamiento lateral",
  "Resonancia morfica",
  "Estado de flujo",
  "Teoria del caos",
  "Minimalismo mental",
  "Memoria ancestral",
  "Sombras del ego",
  "Atencion plena",
  "Realidad subjetiva",
  "Entropia creativa",
  "Dopamina social",
  "Sesgo de confirmacion",
  "Percepcion expandida",
];

const bufferItems = 2;
const windowElement = document.getElementById("roulette-window");
const buttonElement = document.getElementById("spin-button");
const resultElement = document.getElementById("result-text");
const resultPanelElement = document.querySelector(".result-panel");

let audioContext;
let isSpinning = false;
let currentIndex = 0;
let travelOffset = 0;

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
  spin();
});

renderRoulette();
buttonElement.addEventListener("click", spin);
