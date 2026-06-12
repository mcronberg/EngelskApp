const items = [
  {
    key: "dog",
    icon: "fa-dog",
    words: { da: "hund", en: "dog", de: "Hund", es: "perro" }
  },
  {
    key: "cat",
    icon: "fa-cat",
    words: { da: "kat", en: "cat", de: "Katze", es: "gato" }
  },
  {
    key: "apple",
    icon: "fa-apple-whole",
    words: { da: "aeble", en: "apple", de: "Apfel", es: "manzana" }
  },
  {
    key: "ice-cream",
    icon: "fa-ice-cream",
    words: { da: "is", en: "ice cream", de: "Eis", es: "helado" }
  },
  {
    key: "book",
    icon: "fa-book",
    words: { da: "bog", en: "book", de: "Buch", es: "libro" }
  },
  {
    key: "car",
    icon: "fa-car",
    words: { da: "bil", en: "car", de: "Auto", es: "coche" }
  },
  {
    key: "ball",
    icon: "fa-futbol",
    words: { da: "bold", en: "ball", de: "Ball", es: "pelota" }
  },
  {
    key: "sun",
    icon: "fa-sun",
    words: { da: "sol", en: "sun", de: "Sonne", es: "sol" }
  },
  {
    key: "house",
    icon: "fa-house",
    words: { da: "hus", en: "house", de: "Haus", es: "casa" }
  },
  {
    key: "fish",
    icon: "fa-fish",
    words: { da: "fisk", en: "fish", de: "Fisch", es: "pez" }
  }
];

const locales = {
  da: {
    title: "Ord-match",
    subtitle: "Traek ord til ikoner, eller ikoner til ord.",
    wordsHeading: "Ord",
    iconsHeading: "Ikoner",
    score: "Score",
    speakOn: "Oplaesning: Til",
    speakOff: "Oplaesning: Fra",
    soundOn: "Lyd: Til",
    soundOff: "Lyd: Fra",
    reset: "Spil igen",
    matchAll: "Match alle {count} ord.",
    goodContinue: "Flot! Fortsaet.",
    goodDone: "Godt klaret!",
    tryAgain: "Proev igen.",
    speechLang: "da-DK"
  },
  en: {
    title: "Word Match",
    subtitle: "Drag words to icons, or icons to words.",
    wordsHeading: "Words",
    iconsHeading: "Icons",
    score: "Score",
    speakOn: "Speech: On",
    speakOff: "Speech: Off",
    soundOn: "Sound: On",
    soundOff: "Sound: Off",
    reset: "Play again",
    matchAll: "Match all {count} words.",
    goodContinue: "Nice! Keep going.",
    goodDone: "Great job!",
    tryAgain: "Try again.",
    speechLang: "en-US"
  },
  de: {
    title: "Wort-Match",
    subtitle: "Ziehe Woerter zu Symbolen oder Symbole zu Woertern.",
    wordsHeading: "Woerter",
    iconsHeading: "Symbole",
    score: "Punktzahl",
    speakOn: "Vorlesen: Ein",
    speakOff: "Vorlesen: Aus",
    soundOn: "Ton: Ein",
    soundOff: "Ton: Aus",
    reset: "Neu spielen",
    matchAll: "Ordne alle {count} Woerter zu.",
    goodContinue: "Gut! Weiter so.",
    goodDone: "Super gemacht!",
    tryAgain: "Versuch es noch einmal.",
    speechLang: "de-DE"
  },
  es: {
    title: "Emparejar palabras",
    subtitle: "Arrastra palabras a iconos o iconos a palabras.",
    wordsHeading: "Palabras",
    iconsHeading: "Iconos",
    score: "Puntuacion",
    speakOn: "Lectura: Si",
    speakOff: "Lectura: No",
    soundOn: "Sonido: Si",
    soundOff: "Sonido: No",
    reset: "Jugar otra vez",
    matchAll: "Empareja las {count} palabras.",
    goodContinue: "Bien! Sigue.",
    goodDone: "Muy bien!",
    tryAgain: "Intentalo de nuevo.",
    speechLang: "es-ES"
  }
};

const wordList = document.getElementById("wordList");
const iconGrid = document.getElementById("iconGrid");
const scoreText = document.getElementById("scoreText");
const statusText = document.getElementById("statusText");
const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");
const speakBtn = document.getElementById("speakBtn");
const languageSelect = document.getElementById("languageSelect");
const confettiLayer = document.getElementById("confettiLayer");
const titleEl = document.querySelector(".app-header h1");
const subtitleEl = document.querySelector(".app-header p");
const laneHeadings = document.querySelectorAll(".lane h2");

let matches = 0;
let muted = false;
let speechOn = true;
let currentLanguage = "da";
let selectedWord = null;
let selectedIcon = null;
let lastSpokenWord = "";

function localeText() {
  return locales[currentLanguage] || locales.da;
}

function format(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cardBase(type, key, label) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `card ${type}`;
  el.draggable = true;
  el.dataset.key = key;
  el.dataset.label = label;
  el.setAttribute("aria-label", `${type} ${label}`);
  return el;
}

function setStatus(message) {
  statusText.textContent = message;
}

function setScore() {
  const text = localeText();
  scoreText.textContent = `${text.score}: ${matches} / ${items.length}`;
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
  utterance.lang = localeText().speechLang;
  utterance.rate = 0.88;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  lastSpokenWord = key;
}

function refreshTexts() {
  const text = localeText();
  if (titleEl) {
    titleEl.textContent = text.title;
  }
  if (subtitleEl) {
    subtitleEl.textContent = text.subtitle;
  }
  if (laneHeadings[0]) {
    laneHeadings[0].textContent = text.wordsHeading;
  }
  if (laneHeadings[1]) {
    laneHeadings[1].textContent = text.iconsHeading;
  }
  speakBtn.textContent = speechOn ? text.speakOn : text.speakOff;
  muteBtn.textContent = muted ? text.soundOff : text.soundOn;
  resetBtn.textContent = text.reset;
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
    setStatus(localeText().goodDone);
    launchConfetti();
  } else {
    setStatus(localeText().goodContinue);
  }
}

function tryMatch(wordCard, iconCard) {
  if (!wordCard || !iconCard) {
    return;
  }

  if (wordCard.classList.contains("matched") || iconCard.classList.contains("matched")) {
    return;
  }

  const isMatch = wordCard.dataset.key === iconCard.dataset.key;
  if (isMatch) {
    completePair(wordCard, iconCard);
  } else {
    playTone("bad");
    setStatus(localeText().tryAgain);
    markWrong(wordCard, iconCard);
  }

  clearSelections();
}

function bindDnD(card, type) {
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({
      key: card.dataset.key,
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

    if (!payload.key || payload.sourceType === type) {
      return;
    }

    const sourceSelector = `.card.${payload.sourceType}[data-key="${payload.key}"]`;
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

    speakWord(card.dataset.label);

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
  refreshTexts();
  setStatus(format(localeText().matchAll, { count: items.length }));

  shuffled(items).forEach((entry) => {
    const label = entry.words[currentLanguage] || entry.words.en;
    const card = cardBase("word", entry.key, label);
    card.textContent = label;
    bindDnD(card, "word");
    bindSelectable(card, "word");
    wordList.appendChild(card);
  });

  shuffled(items).forEach((entry) => {
    const label = entry.words[currentLanguage] || entry.words.en;
    const card = cardBase("icon", entry.key, label);
    card.innerHTML = `<i class="fa-solid ${entry.icon}" aria-hidden="true"></i>`;
    bindDnD(card, "icon");
    bindSelectable(card, "icon");
    iconGrid.appendChild(card);
  });
}

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? localeText().soundOff : localeText().soundOn;
  muteBtn.setAttribute("aria-pressed", String(muted));
});

speakBtn.addEventListener("click", () => {
  speechOn = !speechOn;
  speakBtn.textContent = speechOn ? localeText().speakOn : localeText().speakOff;
  speakBtn.setAttribute("aria-pressed", String(speechOn));

  if (!speechOn && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

languageSelect.addEventListener("change", (event) => {
  const value = event.target.value;
  if (!locales[value]) {
    return;
  }
  currentLanguage = value;
  render();
});

resetBtn.addEventListener("click", render);

render();