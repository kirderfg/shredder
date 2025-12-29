const STORAGE_KEY = "shredder-quest-progress";
const START_DATE = new Date("2025-12-30T00:00:00");

const state = {
  selectedDay: 1,
  timerRunning: false,
  timerStart: null,
  tickInterval: null,
  progress: {}
};

const dom = {
  dayTitle: document.getElementById("dayTitle"),
  daySubtitle: document.getElementById("daySubtitle"),
  dayContent: document.getElementById("dayContent"),
  dayCards: document.getElementById("dayCards"),
  completeButton: document.getElementById("completeButton"),
  timerDisplay: document.getElementById("timerDisplay"),
  timerStart: document.getElementById("timerStart"),
  timerStop: document.getElementById("timerStop"),
  xpTotal: document.getElementById("xpTotal"),
  streakValue: document.getElementById("streakValue"),
  todayTime: document.getElementById("todayTime"),
  totalTime: document.getElementById("totalTime")
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state.progress = JSON.parse(raw);
    }
  } catch (error) {
    state.progress = {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function getDayKey(day) {
  return `day-${day}`;
}

function getDayProgress(day) {
  const key = getDayKey(day);
  if (!state.progress[key]) {
    state.progress[key] = {
      completed: false,
      seconds: 0,
      lastPracticed: null
    };
  }
  return state.progress[key];
}

function calculateXP() {
  return DAY_DATA.reduce((total, day) => {
    const progress = getDayProgress(day.day);
    const base = progress.completed ? 100 : 0;
    const timeBonus = Math.floor(progress.seconds / 60);
    return total + base + timeBonus;
  }, 0);
}

function formatMinutes(seconds) {
  return `${Math.floor(seconds / 60)} min`;
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function computeDayIndex() {
  const now = new Date();
  const diff = Math.floor((now - START_DATE) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), DAY_DATA.length);
}

function computeStreak() {
  let streak = 0;
  const todayIndex = computeDayIndex();
  for (let day = todayIndex; day >= 1; day -= 1) {
    const progress = getDayProgress(day);
    if (progress.completed) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function getTotalSeconds() {
  return DAY_DATA.reduce((total, day) => total + getDayProgress(day.day).seconds, 0);
}

function renderDayContent(dayData) {
  const container = document.createElement("div");
  let currentList = null;

  dayData.lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith("-")) {
      if (!currentList) {
        currentList = document.createElement("ul");
        container.appendChild(currentList);
      }
      const item = document.createElement("li");
      item.textContent = trimmed.replace(/^-\s*/, "");
      currentList.appendChild(item);
      return;
    }

    currentList = null;
    if (trimmed.endsWith(":")) {
      const heading = document.createElement("h4");
      heading.textContent = trimmed;
      container.appendChild(heading);
      return;
    }

    const paragraph = container.lastElementChild;
    if (paragraph && paragraph.tagName === "P") {
      paragraph.textContent = `${paragraph.textContent} ${trimmed}`;
    } else {
      const p = document.createElement("p");
      p.textContent = trimmed;
      container.appendChild(p);
    }
  });

  return container;
}

function renderSelectedDay() {
  const dayData = DAY_DATA.find((day) => day.day === state.selectedDay);
  const progress = getDayProgress(state.selectedDay);

  dom.dayTitle.textContent = `Dag ${dayData.day} – ${dayData.title}`;
  dom.daySubtitle.textContent = progress.completed
    ? "Klar! Du har låst upp dagens medalj."
    : "Fokusera på att nå dagens mål och samla XP.";

  dom.dayContent.innerHTML = "";
  dom.dayContent.appendChild(renderDayContent(dayData));

  dom.completeButton.textContent = progress.completed ? "Ångra klar" : "Markera klar";
  dom.timerDisplay.textContent = formatTimer(progress.seconds);
  updateStats();
  renderDayCards();
}

function renderDayCards() {
  dom.dayCards.innerHTML = "";
  DAY_DATA.forEach((day) => {
    const progress = getDayProgress(day.day);
    const card = document.createElement("div");
    card.className = "day-card";
    if (day.day === state.selectedDay) {
      card.classList.add("active");
    }
    const title = document.createElement("div");
    title.innerHTML = `<strong>Dag ${day.day}</strong><div>${day.title}</div>`;
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `
      <div class="badge">${progress.completed ? "✅ Klar" : "⚡ Pågår"}</div>
      <div>${formatMinutes(progress.seconds)}</div>
    `;
    card.appendChild(title);
    card.appendChild(meta);
    card.addEventListener("click", () => {
      state.selectedDay = day.day;
      renderSelectedDay();
    });
    dom.dayCards.appendChild(card);
  });
}

function updateStats() {
  dom.xpTotal.textContent = calculateXP();
  dom.streakValue.textContent = `${computeStreak()} dagar`;
  const today = computeDayIndex();
  dom.todayTime.textContent = formatMinutes(getDayProgress(today).seconds);
  dom.totalTime.textContent = formatMinutes(getTotalSeconds());
}

function toggleComplete() {
  const progress = getDayProgress(state.selectedDay);
  progress.completed = !progress.completed;
  progress.lastPracticed = new Date().toISOString();
  saveProgress();
  renderSelectedDay();
}

function startTimer() {
  if (state.timerRunning) {
    return;
  }
  state.timerRunning = true;
  state.timerStart = Date.now();
  dom.timerStart.disabled = true;
  dom.timerStop.disabled = false;
  state.tickInterval = setInterval(() => {
    const progress = getDayProgress(state.selectedDay);
    const seconds = progress.seconds + (Date.now() - state.timerStart) / 1000;
    dom.timerDisplay.textContent = formatTimer(seconds);
  }, 500);
}

function stopTimer() {
  if (!state.timerRunning) {
    return;
  }
  state.timerRunning = false;
  const elapsed = (Date.now() - state.timerStart) / 1000;
  const progress = getDayProgress(state.selectedDay);
  progress.seconds += Math.floor(elapsed);
  progress.lastPracticed = new Date().toISOString();
  state.timerStart = null;
  clearInterval(state.tickInterval);
  dom.timerStart.disabled = false;
  dom.timerStop.disabled = true;
  saveProgress();
  renderSelectedDay();
}

function initDaySelection() {
  state.selectedDay = computeDayIndex();
}

function initPixi() {
  const stage = document.getElementById("pixi-stage");
  const app = new PIXI.Application({
    resizeTo: stage,
    backgroundAlpha: 0,
    antialias: true
  });
  stage.appendChild(app.view);

  const stars = [];
  for (let i = 0; i < 60; i += 1) {
    const star = new PIXI.Graphics();
    const size = Math.random() * 2 + 1;
    star.beginFill(0x70f7ff, 0.8);
    star.drawCircle(0, 0, size);
    star.endFill();
    star.x = Math.random() * app.renderer.width;
    star.y = Math.random() * app.renderer.height;
    star.alpha = Math.random() * 0.6 + 0.2;
    app.stage.addChild(star);
    stars.push(star);
  }

  const pick = new PIXI.Graphics();
  pick.beginFill(0xff6ad5, 0.9);
  pick.drawRoundedRect(-25, -40, 50, 80, 20);
  pick.endFill();
  pick.x = app.renderer.width * 0.8;
  pick.y = app.renderer.height * 0.5;
  app.stage.addChild(pick);

  const text = new PIXI.Text("Shred Zone", {
    fill: 0xffffff,
    fontSize: 20,
    fontWeight: "bold",
    dropShadow: true,
    dropShadowBlur: 6,
    dropShadowColor: 0x70f7ff,
    dropShadowDistance: 0
  });
  text.x = 16;
  text.y = 16;
  app.stage.addChild(text);

  app.ticker.add(() => {
    stars.forEach((star) => {
      star.y += 0.3 + star.alpha;
      if (star.y > app.renderer.height) {
        star.y = -5;
        star.x = Math.random() * app.renderer.width;
      }
    });
    pick.rotation += 0.01;
  });
}

function bindEvents() {
  dom.completeButton.addEventListener("click", toggleComplete);
  dom.timerStart.addEventListener("click", startTimer);
  dom.timerStop.addEventListener("click", stopTimer);
  window.addEventListener("beforeunload", () => {
    if (state.timerRunning) {
      stopTimer();
    }
  });
}

function init() {
  loadProgress();
  initDaySelection();
  initPixi();
  bindEvents();
  renderSelectedDay();
  updateStats();
}

init();
