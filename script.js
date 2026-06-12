const items = [
  { word: "dog", icon: "fa-dog" },
  { word: "cat", icon: "fa-cat" },
  { word: "apple", icon: "fa-apple-whole" },
  { word: "ice cream", icon: "fa-ice-cream" },
  { word: "book", icon: "fa-book" },
  { word: "car", icon: "fa-car" },
  { word: "ball", icon: "fa-futbol" },
  { word: "sun", icon: "fa-sun" },
  { word: "house", icon: "fa-house" },
  { word: "fish", icon: "fa-fish" }
];

const wordList = document.getElementById("wordList");
const iconGrid = document.getElementById("iconGrid");
const scoreText = document.getElementById("scoreText");
const statusText = document.getElementById("statusText");
const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");
const speakBtn = document.getElementById("speakBtn");
const confettiLayer = document.getElementById("confettiLayer");

let matches = 0;
let muted = false;
let speechOn = true;
let selectedWord = null;
let selectedIcon = null;
let lastSpokenWord = "";

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cardBase(type, word) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `card ${type}`;
  el.draggable = true;
  el.dataset.word = word;
  el.setAttribute("aria-label", `${type} ${word}`);
  return el;
}

function setStatus(message) {
  statusText.textContent = message;
}

function setScore() {
  scoreText.textContent = `Score: ${matches} / ${items.length}`;
}

function playTone(kind) {
  if (muted) {
    return;
  }

  const AudioContextSafe = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextSafe) {
    return;
  }

  const audio = new AudioContextSafe();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = kind === "ok" ? "triangle" : "sawtooth";
  oscillator.frequency.value = kind === "ok" ? 640 : 180;

  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.2);

  oscillator.onended = () => {
    audio.close().catch(() => {});
  };
}

function speakWord(word) {
  if (!speechOn) {
    return;
  }

  if (!("speechSynthesis" in window)) {
    return;
  }

  const text = String(word || "").trim();
  if (!text) {
    return;
  }

  const key = text.toLowerCase();
  if (key === lastSpokenWord) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  lastSpokenWord = key;
}

function launchConfetti() {
  if (!confettiLayer) {
    return;
  }

  confettiLayer.innerHTML = "";
  const colors = ["#ff7a2f", "#0da8b7", "#2b9e51", "#f6c445", "#d14a4a", "#5a75c8"];
  const count = 120;

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${2.3 + Math.random() * 1.3}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.setProperty("--drift", `${-120 + Math.random() * 240}px`);
    confettiLayer.appendChild(piece);
  }

  setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 4300);
}

function clearSelections() {
  document.querySelectorAll(".card.selected").forEach((el) => el.classList.remove("selected"));
  selectedWord = null;
  selectedIcon = null;
}

function markWrong(first, second) {
  [first, second].forEach((el) => el.classList.add("wrong"));
  setTimeout(() => {
    [first, second].forEach((el) => el.classList.remove("wrong"));
  }, 320);
}

function completePair(wordCard, iconCard) {
  wordCard.classList.remove("selected");
  iconCard.classList.remove("selected");
  wordCard.classList.add("correct", "matched");
  iconCard.classList.add("correct", "matched");
  wordCard.draggable = false;
  iconCard.draggable = false;
  wordCard.disabled = true;
  iconCard.disabled = true;
  wordCard.setAttribute("aria-disabled", "true");
  iconCard.setAttribute("aria-disabled", "true");

  matches += 1;
  setScore();
  playTone("ok");

  if (matches === items.length) {
    setStatus("Godt klaret!");
    launchConfetti();
  } else {
    setStatus("Flot! Fortsæt.");
  }
}

function tryMatch(wordCard, iconCard) {
  if (!wordCard || !iconCard) {
    return;
  }

  if (wordCard.classList.contains("matched") || iconCard.classList.contains("matched")) {
    return;
  }

  const isMatch = wordCard.dataset.word === iconCard.dataset.word;
  if (isMatch) {
    completePair(wordCard, iconCard);
  } else {
    playTone("bad");
    setStatus("Prøv igen.");
    markWrong(wordCard, iconCard);
  }

  clearSelections();
}

function bindDnD(card, type) {
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({
      word: card.dataset.word,
      sourceType: type
    }));
  });

  card.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (!card.classList.contains("matched")) {
      card.classList.add("drop-hover");
    }
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("drop-hover");
  });

  card.addEventListener("drop", (event) => {
    event.preventDefault();
    card.classList.remove("drop-hover");
    const data = event.dataTransfer.getData("text/plain");
    if (!data) {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }

    if (!payload.word || payload.sourceType === type) {
      return;
    }

    const sourceSelector = `.card.${payload.sourceType}[data-word="${payload.word}"]`;
    const sourceCard = document.querySelector(sourceSelector);
    if (!sourceCard) {
      return;
    }

    const wordCard = type === "word" ? card : sourceCard;
    const iconCard = type === "icon" ? card : sourceCard;
    tryMatch(wordCard, iconCard);
  });
}

function bindSelectable(card, type) {
  const onSelect = () => {
    if (card.classList.contains("matched")) {
      return;
    }

    speakWord(card.dataset.word);

    if (type === "word") {
      if (selectedWord && selectedWord !== card) {
        selectedWord.classList.remove("selected");
      }
      selectedWord = card;
    } else {
      if (selectedIcon && selectedIcon !== card) {
        selectedIcon.classList.remove("selected");
      }
      selectedIcon = card;
    }

    card.classList.toggle("selected", true);

    if (selectedWord && selectedIcon) {
      tryMatch(selectedWord, selectedIcon);
    }
  };

  card.addEventListener("click", onSelect);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  });
}

function render() {
  matches = 0;
  selectedWord = null;
  selectedIcon = null;
  lastSpokenWord = "";
  wordList.innerHTML = "";
  iconGrid.innerHTML = "";
  if (confettiLayer) {
    confettiLayer.innerHTML = "";
  }
  setScore();
  setStatus("Match alle 10 ord.");

  shuffled(items).forEach((entry) => {
    const card = cardBase("word", entry.word);
    card.textContent = entry.word;
    bindDnD(card, "word");
    bindSelectable(card, "word");
    wordList.appendChild(card);
  });

  shuffled(items).forEach((entry) => {
    const card = cardBase("icon", entry.word);
    card.innerHTML = `<i class="fa-solid ${entry.icon}" aria-hidden="true"></i><span>${entry.word}</span>`;
    bindDnD(card, "icon");
    bindSelectable(card, "icon");
    iconGrid.appendChild(card);
  });
}

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? "Lyd: Fra" : "Lyd: Til";
  muteBtn.setAttribute("aria-pressed", String(muted));
});

speakBtn.addEventListener("click", () => {
  speechOn = !speechOn;
  speakBtn.textContent = speechOn ? "Oplæsning: Til" : "Oplæsning: Fra";
  speakBtn.setAttribute("aria-pressed", String(speechOn));

  if (!speechOn && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

resetBtn.addEventListener("click", render);

render();