import { loadPassages } from "./data.js";

const wpmDisplay = document.querySelector(".js-stat-value");
const accuracyDisplay = document.querySelector(".js-stat-accuracy");
const timeDisplay = document.querySelector(".js-stat-time");
const personalBestDisplay = document.querySelector(".js-personal-best");
const passageElement = document.querySelector(".js-passage");

const restartBtn = document.querySelector(".js-restart-btn");
const easyBtn = document.querySelector(".js-easy-btn");
const mediumBtn = document.querySelector(".js-medium-btn");
const hardBtn = document.querySelector(".js-hard-btn");
const timedBtn = document.querySelector(".js-timed-btn");
const passageBtn = document.querySelector(".js-passage-btn");

const celebrationModal = document.querySelector(".js-celebration-modal");
const celebrationTitle = document.querySelector(".celebration-title");
const celebrationSubtitle = document.querySelector(".celebration-subtitle");
const celebrationBtn = document.querySelector(".js-celebration-btn");
const celebrationPBIcon = document.querySelector(".js-celebration-pb-icon");
const celebrationWPM = document.querySelector(".js-celebration-wpm");
const celebrationAccuracy = document.querySelector(".js-celebration-accuracy");

const difficultyBtns = [easyBtn, mediumBtn, hardBtn];
const modeBtns = [timedBtn, passageBtn];

let passages = {};
let currentPassage = "";
let typedCharacters = [];
let currentIndex = 0;
let startTime = null;
let timerInterval = null;
let timeLeft = 60;
let timeElapsed = 0; 
let isRunning = false;
let isFinished = false;

let difficulty = "easy";
let mode = "timed"; 

let totalErrors = 0;

function getRandomPassage() {
  const passageArray = passages[difficulty];
  if (!passageArray || passageArray.length === 0) {
    console.error(`Aucun passage trouvé pour la difficulté : ${difficulty}`);
    return null;
  }
  const randomIndex = Math.floor(Math.random() * passageArray.length);
  return passageArray[randomIndex];
}

function loadNewPassage() {
  const passage = getRandomPassage();
  if (!passage) return;
  currentPassage = passage.text;
  renderPassage();
}

async function initializeApp() {
  passages = await loadPassages();
  loadNewPassage();
  loadPersonalBest();
}

initializeApp();

function renderPassage() {
  passageElement.innerHTML = "";
  typedCharacters = [];
  currentIndex = 0;
  totalErrors = 0;

  currentPassage.split("").forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.dataset.index = i;

    if (i === 0) span.classList.add("t-cursor");
    else span.classList.add("t-untyped");

    passageElement.appendChild(span);
    typedCharacters.push({ char, status: "pending" });
  });
}

document.addEventListener("keydown", handleKeyPress);

function handleKeyPress(e) {
  if (e.ctrlKey || e.altKey || e.metaKey || e.key === "Shift" || e.key === "CapsLock") return;
  if (isFinished) return;

  if (!currentPassage || currentPassage.length === 0) return;

  if (e.key === "Backspace") {
    e.preventDefault();
    handleBackspace();
    return;
  }

  if (e.key.length !== 1) return;
  e.preventDefault();

  if (!isRunning) {
    startTest();
  }

  handleCharInput(e.key);
}

function handleCharInput(key) {
  if (currentIndex >= currentPassage.length) return;

  const spans = passageElement.querySelectorAll("span");
  const expected = currentPassage[currentIndex];

  spans[currentIndex].classList.remove("t-cursor");

  if (key === expected) {
    spans[currentIndex].classList.add("t-correct");
    typedCharacters[currentIndex].status = "correct";
  } else {
    spans[currentIndex].classList.add("t-wrong");
    typedCharacters[currentIndex].status = "incorrect";
    totalErrors++;
  }

  currentIndex++;

  if (currentIndex < spans.length) {
    spans[currentIndex].classList.remove("t-untyped");
    spans[currentIndex].classList.add("t-cursor");
  }

  updateStats();

  if (currentIndex === currentPassage.length) {
    endTest();
  }
}

function handleBackspace() {
  if (currentIndex === 0) return;

  const spans = passageElement.querySelectorAll("span");
  spans[currentIndex]?.classList.remove("t-cursor");

  currentIndex--;

  spans[currentIndex].classList.remove("t-correct", "t-wrong");
  spans[currentIndex].classList.add("t-cursor");
  typedCharacters[currentIndex].status = "pending";

  updateStats();
}

function startTest() {
  isRunning = true;
  startTime = Date.now();

  if (mode === "timed") {
    timeLeft = 60;
    timeDisplay.textContent = "1:00";

    timerInterval = setInterval(() => {
      timeLeft--;
      const mins = Math.floor(timeLeft / 60);
      const secs = String(timeLeft % 60).padStart(2, "0");
      timeDisplay.textContent = `${mins}:${secs}`;

      updateStats();

      if (timeLeft <= 0) {
        endTest();
      }
    }, 1000);
  } else {
    timeElapsed = 0;
    timeDisplay.textContent = "0:00";

    timerInterval = setInterval(() => {
      timeElapsed++;
      const mins = Math.floor(timeElapsed / 60);
      const secs = String(timeElapsed % 60).padStart(2, "0");
      timeDisplay.textContent = `${mins}:${secs}`;

      updateStats();
    }, 1000);
  }
}

function endTest() {
  isFinished = true;
  isRunning = false;
  clearInterval(timerInterval);

  updateStats();
  
  const finalWPM = calculateFinalWPM();
  const finalAcc = calculateAccuracy();

  handleScoresAndModal(finalWPM, finalAcc);
}

function calculateWPM() {
  if (!startTime) return 0;
  const correctChars = typedCharacters.filter((c) => c.status === "correct").length;
  const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;

  if (elapsedMinutes < 0.01) return 0;
  return Math.round((correctChars / 5) / elapsedMinutes);
}

function calculateFinalWPM() {
  const correctChars = typedCharacters.filter((c) => c.status === "correct").length;
  let totalSeconds = 0;
  if (mode === "timed") {
    totalSeconds = 60 - timeLeft;
  } else {
    totalSeconds = timeElapsed;
  }
  if (totalSeconds <= 0) totalSeconds = 1;
  const elapsedMinutes = totalSeconds / 60;
  return Math.round((correctChars / 5) / elapsedMinutes);
}

function calculateAccuracy() {
  const totalTypedAttempts = currentIndex + totalErrors; 
  if (currentIndex === 0) return 100;
  const correct = typedCharacters.filter((c) => c.status === "correct").length;
  return Math.round((correct / currentIndex) * 100);
}

function updateStats() {
  wpmDisplay.textContent = calculateWPM();
  const acc = calculateAccuracy();
  accuracyDisplay.textContent = `${acc}%`;

  if (acc >= 95) {
    accuracyDisplay.style.color = "#4ade80";
  } else if (acc >= 80) {
    accuracyDisplay.style.color = "#facc15";
  } else {
    accuracyDisplay.style.color = "#f87171";
  }
}

function handleScoresAndModal(wpm, accuracy) {
  const storedPB = localStorage.getItem("typingPB");
  
  celebrationWPM.textContent = wpm;
  celebrationAccuracy.textContent = `${accuracy}%`;

  if (storedPB === null) {
    localStorage.setItem("typingPB", wpm);
    personalBestDisplay.textContent = `${wpm} WPM`;
    celebrationTitle.textContent = "Baseline Established!";
    celebrationSubtitle.textContent = "Your've set the bar. Now real challenge begins--time to beat it.";
    if (celebrationPBIcon) celebrationPBIcon.style.display = "block";
  } else {
    const currentPB = parseInt(storedPB, 10);
    if (wpm > currentPB) {
      localStorage.setItem("typingPB", wpm);
      personalBestDisplay.textContent = `${wpm} WPM`;
      celebrationTitle.textContent = "High Score Smashed!";
      celebrationSubtitle.textContent = "You're getting faster. That was incredible typing.";
      if (celebrationPBIcon) celebrationPBIcon.style.display = "block";
    } else {
      personalBestDisplay.textContent = `${currentPB} WPM`;
      celebrationTitle.textContent = "Test Complete!";
      celebrationSubtitle.textContent = "Solid run.Keep pushing to beat your high score.";
      if (celebrationPBIcon) celebrationPBIcon.style.display = "none";
    }
  }

  if (celebrationModal) celebrationModal.classList.add("active");
}

function loadPersonalBest() {
  const pb = localStorage.getItem("typingPB");
  personalBestDisplay.textContent = pb ? `${pb} WPM` : "0 WPM";
}

function resetTest() {
  if (celebrationModal) celebrationModal.classList.remove("active");
  
  clearInterval(timerInterval);
  isRunning = false;
  isFinished = false;
  startTime = null;
  totalErrors = 0;
  
  if (mode === "timed") {
    timeLeft = 60;
    timeDisplay.textContent = "1:00";
  } else {
    timeElapsed = 0;
    timeDisplay.textContent = "0:00";
  }
  
  wpmDisplay.textContent = "0";
  accuracyDisplay.textContent = "100%";
  accuracyDisplay.style.color = "";

  loadPersonalBest();
  loadNewPassage();
}

restartBtn.addEventListener("click", resetTest);

easyBtn.addEventListener("click", () => changeDifficulty("easy", easyBtn));
mediumBtn.addEventListener("click", () => changeDifficulty("medium", mediumBtn));
hardBtn.addEventListener("click", () => changeDifficulty("hard", hardBtn));

function changeDifficulty(level, activeBtn) {
  difficulty = level;
  difficultyBtns.forEach((b) => b?.classList.remove("active"));
  activeBtn.classList.add("active");
  resetTest();
}

timedBtn.addEventListener("click", () => changeMode("timed", timedBtn));
passageBtn.addEventListener("click", () => changeMode("passage", passageBtn));

function changeMode(selectedMode, activeBtn) {
  mode = selectedMode;
  modeBtns.forEach((b) => b?.classList.remove("active"));
  activeBtn.classList.add("active");
  resetTest();
}

if (celebrationBtn) {
  celebrationBtn.addEventListener("click", resetTest);
}