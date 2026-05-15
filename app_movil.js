const SECTION_ORDER = ["Fortaleza", "Amenaza", "Debilidad", "Oportunidad"];

const SECTION_VIDEOS = {
  Debilidad: "videos/debilidades.mp4",
  Amenaza: "videos/amenazas.mp4",
  Fortaleza: "videos/fortalezas.mp4",
  Oportunidad: "videos/oportunidades.mp4"
};

const SUMMARY_VIDEOS = {
  feedback_1: "videos/feedback-1.mp4",
  feedback_2: "videos/feedback-2.mp4",
  feedback_3: "videos/feedback-3.mp4",
  feedback_4: "videos/feedback-4.mp4",
  feedback_5: "videos/feedback-5.mp4",
  feedback_6: "videos/feedback-6.mp4",
  feedback_7: "videos/feedback-7.mp4",
  feedback_8: "videos/feedback-8.mp4",
  feedback_9: "videos/feedback-9.mp4",
  feedback_10: "videos/feedback-10.mp4",
  feedback_11: "videos/feedback-11.mp4",
  feedback_12: "videos/feedback-12.mp4",
  feedback_13: "videos/feedback-13.mp4",
  feedback_14: "videos/feedback-14.mp4",
  feedback_15: "videos/feedback-15.mp4",
  feedback_16: "videos/feedback-16.mp4"
};

let blockTransitionMessages = {};

let questions = [];
let groupedQuestions = {};
let sectionIndex = 0;
let questionIndex = 0;
let answers = [];
let currentQuestion = null;
let selectedOptionIndex = null;
let userName = "";
let currentVideoType = null;
let watchedVideoTypes = new Set();
let introAudio = null;
let introAudioStarted = false;
let introCues = [];
let introSubtitleTimer = null;
let feedbackSummaries = {};
let feedbacksData = {};
let activeVideo = null;
let activeVideoLayer = null;
let waitingForVideoStart = false;
let reflectionQuestionsData = null;
let reflectionQuestionInserted = false;
let currentShuffledOptions = [];
let transitionQuestionAudio = null;
let transitionQuestionCues = [];
let transitionQuestionSubtitleTimer = null;
let nameAudio = null;
let nameAudioPlayed = false;
let backgroundMusic = null;
let backgroundMusicStarted = false;
let backgroundMusicShouldPlay = false;
let optionsDelayTimer = null;
let introSkipEnabled = false;
let introSkipTimer = null;

const intro = document.querySelector("#intro");
const app = document.querySelector("#app");
const result = document.querySelector("#result");
const startBtn = document.querySelector("#startBtn");

const qrSmallBtn = document.querySelector("#qrSmallBtn");
const qrModal = document.querySelector("#qrModal");
const qrCloseBtn = document.querySelector("#qrCloseBtn");

const exitBtn = document.querySelector("#exitBtn");
const exitModal = document.querySelector("#exitModal");
const exitToStartBtn = document.querySelector("#exitToStartBtn");
const exitCancelBtn = document.querySelector("#exitCancelBtn");

const nameModal = document.querySelector("#nameModal");
const nameForm = document.querySelector("#nameForm");
const userNameInput = document.querySelector("#userNameInput");

const questionForm = document.querySelector("#questionForm");
const continueBtn = document.querySelector("#continueBtn");

const restartBtn = document.querySelector("#restartBtn");
const downloadPdfBtn = document.querySelector("#downloadPdfBtn");
const sharePdfBtn = document.querySelector("#sharePdfBtn");

const nameStartControls = document.querySelector("#nameStartControls");
const nameAudioNotice = document.querySelector("#nameAudioNotice");

const brandFooter = document.querySelector(".brand-footer");
const blockIntroTitle = document.querySelector("#blockIntroTitle");

bindEvents();
setScreenMode("intro");

function bindEvents() {
  startBtn.addEventListener("click", handleStartButton);

  qrSmallBtn.addEventListener("click", () => {
    qrModal.classList.remove("hidden");
  });

  qrCloseBtn.addEventListener("click", () => {
    qrModal.classList.add("hidden");
  });

  qrModal.addEventListener("click", event => {
    if (event.target === qrModal) {
      qrModal.classList.add("hidden");
    }
  });

  exitBtn.addEventListener("click", () => {
    exitModal.classList.remove("hidden");
  });

  exitCancelBtn.addEventListener("click", () => {
    exitModal.classList.add("hidden");
  });

  exitModal.addEventListener("click", event => {
    if (event.target === exitModal) {
      exitModal.classList.add("hidden");
    }
  });

  exitToStartBtn.addEventListener("click", () => {
    location.reload();
  });

  nameForm.addEventListener("submit", handleNameSubmit);

  questionForm.addEventListener("submit", event => {
    event.preventDefault();
    commitAnswerAndGoNext();
  });

  continueBtn.addEventListener("click", commitAnswerAndGoNext);

  restartBtn.addEventListener("click", () => {
    location.reload();
  });

  downloadPdfBtn.addEventListener("click", savePdf);
  sharePdfBtn.addEventListener("click", sharePdf);
  document.addEventListener("click", handleGlobalVideoStartClick);
}

function setScreenMode(mode) {
  if (mode === "intro") {
    qrSmallBtn.classList.remove("hidden");
    exitBtn.classList.add("hidden");
    qrModal.classList.add("hidden");
    exitModal.classList.add("hidden");

    if (brandFooter) {
      brandFooter.classList.remove("hidden");
    }

    return;
  }

  qrSmallBtn.classList.add("hidden");
  qrModal.classList.add("hidden");
  exitBtn.classList.remove("hidden");

  if (brandFooter) {
    brandFooter.classList.toggle("hidden", mode !== "result");
  }
}

function initBackgroundMusic() {
  if (backgroundMusic) return;

  backgroundMusic = new Audio("fondo_suave.mp3");
  backgroundMusic.loop = true;
  backgroundMusic.preload = "auto";
  backgroundMusic.volume = 0.22; // Ajusta el volumen aquí: 0.10, 0.20, 0.30...
}

async function startBackgroundMusic() {
  initBackgroundMusic();

  backgroundMusicShouldPlay = true;

  if (!backgroundMusic || backgroundMusicStarted) return;

  try {
    await backgroundMusic.play();
    backgroundMusicStarted = true;
  } catch (error) {
    console.warn("No se pudo reproducir fondo_suave.mp3.", error);
  }
}

function pauseBackgroundMusicForVideo() {
  if (!backgroundMusic) return;

  backgroundMusic.pause();
}

async function resumeBackgroundMusicAfterVideo() {
  if (!backgroundMusic || !backgroundMusicShouldPlay) return;

  try {
    await backgroundMusic.play();
    backgroundMusicStarted = true;
  } catch (error) {
    console.warn("No se pudo reanudar fondo_suave.mp3.", error);
  }
}

function stopBackgroundMusic() {
  backgroundMusicShouldPlay = false;
  backgroundMusicStarted = false;

  if (!backgroundMusic) return;

  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function playAudioWithDelay(audio, delay = 1500) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await audio.play();
        resolve();
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

async function handleStartButton() {
  // Primera pulsación: reproduce el audio de portada
  if (!introAudioStarted) {
    introAudioStarted = true;
    introSkipEnabled = false;

    introAudio = new Audio("inicio.mp3");
    introAudio.preload = "auto";

    startBtn.textContent = "Saltar ›";
    startBtn.disabled = true;

    await loadIntroSubtitles();

    try {
      introAudio.addEventListener("playing", () => {
        startIntroSubtitles();

        // El botón Saltar se activa a los 2 segundos de empezar el mp3
        if (introSkipTimer) {
          clearTimeout(introSkipTimer);
        }

        introSkipTimer = setTimeout(() => {
          introSkipEnabled = true;
          startBtn.disabled = false;
        }, 2000);
      }, { once: true });

      introAudio.addEventListener("ended", () => {
        stopIntroSubtitles();

        introSkipEnabled = true;
        startBtn.disabled = false;
        startBtn.textContent = "Entrar ›";
      }, { once: true });

      await introAudio.play();
    } catch (error) {
      console.warn("No se pudo reproducir inicio.mp3.", error);
      introSkipEnabled = true;
      startBtn.disabled = false;
      startBtn.textContent = "Entrar ›";
    }

    return;
  }

  // Si el audio está sonando y ya han pasado 2 segundos, Saltar detiene todo
  if (introAudio && !introAudio.paused && introSkipEnabled) {
    stopIntroAudioAndGoToName();
    return;
  }

  // Si el audio ya terminó, Entrar abre el modal del nombre
  if (!introAudio || introAudio.paused) {
    stopIntroAudioAndGoToName();
  }
}

function stopIntroAudioAndGoToName() {
  if (introSkipTimer) {
    clearTimeout(introSkipTimer);
    introSkipTimer = null;
  }

  stopIntroSubtitles();

  if (introAudio) {
    introAudio.pause();
    introAudio.currentTime = 0;
  }

  introSkipEnabled = false;
  startBtn.disabled = false;
  startBtn.textContent = "Entrar ›";

  openNameModalWithAudio();
}

async function openNameModalWithAudio() {
  nameModal.classList.remove("hidden");

  if (nameStartControls) {
    nameStartControls.classList.add("hidden");
  }

  if (nameAudioNotice) {
    nameAudioNotice.classList.remove("hidden");
    nameAudioNotice.textContent = "Escucha este breve mensaje antes de comenzar.";
  }

  if (nameAudio) {
    nameAudio.pause();
    nameAudio.currentTime = 0;
  }

  nameAudio = new Audio("mensaje_nombre.mp3");
  nameAudio.preload = "auto";

  nameAudio.addEventListener("ended", showNameControls, { once: true });

  try {
    await playAudioWithDelay(nameAudio, 1500);
  } catch (error) {
    console.warn("No se pudo reproducir mensaje_nombre.mp3.", error);
  
    if (nameAudioNotice) {
      nameAudioNotice.textContent = "Pulsa para continuar cuando estés preparado.";
    }
  
    showNameControls();
  }
}

function showNameControls() {
  if (nameStartControls) {
    nameStartControls.classList.remove("hidden");
  }

  if (nameAudioNotice) {
    nameAudioNotice.classList.add("hidden");
  }

  setTimeout(() => {
    if (userNameInput) {
      userNameInput.focus();
    }
  }, 80);
}

function handleNameSubmit(event) {
  event.preventDefault();

  userName = formatPersonName(userNameInput.value);
  userNameInput.value = userName;

  if (!userName) {
    alert("Escribe tu nombre para continuar.");
    return;
  }

  nameModal.classList.add("hidden");
  startApp();
}

function formatPersonName(name) {
  const lowercaseWords = ["de", "del", "la", "las", "los", "y", "e"];

  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-ES")
    .split(" ")
    .map((word, index) => {
      if (!word) return "";

      if (lowercaseWords.includes(word) && index !== 0) {
        return word;
      }

      if (word === "mª" || word === "m.") {
        return "Mª";
      }

      return word.charAt(0).toLocaleUpperCase("es-ES") + word.slice(1);
    })
    .join(" ");
}

async function loadIntroSubtitles() {
  try {
    const response = await fetch("inicio.vtt");

    if (!response.ok) {
      throw new Error("No se pudo cargar inicio.vtt");
    }

    const vttText = await response.text();
    introCues = parseVtt(vttText);
  } catch (error) {
    console.warn("No se pudieron cargar los subtítulos de inicio.", error);
    introCues = [];
  }
}

function parseVtt(vttText) {
  const cr = String.fromCharCode(13);
  const lf = String.fromCharCode(10);
  const text = String(vttText).split(cr).join("");
  const blocks = text.split(lf + lf);

  return blocks
    .map(block => block.trim())
    .filter(block => block && !block.startsWith("WEBVTT"))
    .map(block => {
      const lines = block.split(lf);
      const timeLine = lines.find(line => line.includes("-->"));

      if (!timeLine) {
        return null;
      }

      const times = timeLine.split("-->").map(time => time.trim());

      return {
        start: vttTimeToSeconds(times[0]),
        end: vttTimeToSeconds(times[1]),
        text: lines.slice(lines.indexOf(timeLine) + 1).join(" ")
      };
    })
    .filter(Boolean);
}

function vttTimeToSeconds(time) {
  const clean = String(time).split(" ")[0];
  const parts = clean.split(":");
  const secondParts = parts.pop().split(".");
  const seconds = Number(secondParts[0] || 0);
  const milliseconds = Number(secondParts[1] || 0);
  const minutes = Number(parts.pop() || 0);
  const hours = Number(parts.pop() || 0);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function startIntroSubtitles() {
  const box = document.querySelector("#introSubtitleBox");
  const subtitle = document.querySelector("#introSubtitle");
  const logo = document.querySelector("#introSubtitleLogo");

  if (!box || !subtitle || !introAudio) {
    return;
  }

  stopIntroSubtitles();
  box.classList.remove("hidden");

  introSubtitleTimer = setInterval(() => {
    const subtitleOffset = 0.4;
    const currentTime = introAudio.currentTime + subtitleOffset;
    const cue = introCues.find(item => currentTime >= item.start && currentTime <= item.end);
  
    if (!cue) {
      subtitle.textContent = "";
      box.classList.add("hidden");
      if (logo) logo.classList.add("hidden");
      return;
    }
  
    const text = cue.text || "";
    subtitle.textContent = text;
    box.classList.remove("hidden");
  
    const normalizedText = text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  
    const shouldShowLogo =
      normalizedText.includes("servicio andaluz de empleo. a tu lado, en cada paso hacia tu meta.");
  
    if (logo) {
      logo.classList.toggle("hidden", !shouldShowLogo);
    }
  }, 100);

  introAudio.addEventListener("ended", () => {
    stopIntroSubtitles();
    startBtn.textContent = "Entrar ›";
  }, { once: true });
}

function stopIntroSubtitles() {
  const box = document.querySelector("#introSubtitleBox");
  const subtitle = document.querySelector("#introSubtitle");
  const logo = document.querySelector("#introSubtitleLogo");

  if (introSubtitleTimer) {
    clearInterval(introSubtitleTimer);
    introSubtitleTimer = null;
  }

  if (subtitle) {
    subtitle.textContent = "";
  }

  if (logo) {
    logo.classList.add("hidden");
  }

  if (box) {
    box.classList.add("hidden");
  }
}

async function startApp() {
  try {
    const questionsResponse = await fetch("preguntas.json");

    if (!questionsResponse.ok) {
      throw new Error("No se pudo cargar preguntas.json");
    }

    questions = await questionsResponse.json();

    try {
      const feedbacksResponse = await fetch("feedbacks.json");
    
      if (feedbacksResponse.ok) {
        feedbacksData = await feedbacksResponse.json();
      } else {
        console.warn("No se encontró feedbacks.json. La app continuará sin textos de reflexión final.");
        feedbacksData = {};
      }
    } catch (feedbackError) {
      console.warn("feedbacks.json tiene algún problema o no se pudo cargar.", feedbackError);
      feedbacksData = {};
    }
    
    try {
      const reflectionResponse = await fetch("preguntas_reflexion.json");
    
      if (reflectionResponse.ok) {
        reflectionQuestionsData = await reflectionResponse.json();
      } else {
        console.warn("No se encontró preguntas_reflexion.json. La app continuará sin pregunta de reflexión.");
        reflectionQuestionsData = null;
      }
    } catch (reflectionError) {
      console.warn("preguntas_reflexion.json tiene algún problema o no se pudo cargar.", reflectionError);
      reflectionQuestionsData = null;
    }

    try {
      const transitionsResponse = await fetch("transiciones.json");
    
      if (transitionsResponse.ok) {
        blockTransitionMessages = await transitionsResponse.json();
      } else {
        console.warn("No se encontró transiciones.json. La app continuará sin transiciones aleatorias.");
        blockTransitionMessages = {};
      }
    } catch (transitionError) {
      console.warn("transiciones.json tiene algún problema o no se pudo cargar.", transitionError);
      blockTransitionMessages = {};
    }
    
    groupedQuestions = groupByType(questions);
    groupedQuestions = selectRandomQuestionsByType(groupedQuestions, 3, 3);
    insertReflectionQuestionIfAvailable(groupedQuestions, reflectionQuestionsData);
    insertBlockTransitionQuestions(groupedQuestions);

    intro.classList.add("hidden");
    app.classList.remove("hidden");
    result.classList.add("hidden");
    
    setScreenMode("app");
    startBackgroundMusic();
    renderCurrentStep();
  } catch (error) {
    alert("Error cargando preguntas.json. Revisa que esté en la misma carpeta que index.html y que el JSON sea válido.");
    console.error(error);
  }
}

function groupByType(items) {
  return items.reduce((acc, item) => {
    const type = item.tipo;

    if (!acc[type]) {
      acc[type] = [];
    }

    acc[type].push(item);
    return acc;
  }, {});
}

function selectRandomQuestionsByType(groupedItems, minQuestions, maxQuestions) {
  const selectedGroups = {};

  SECTION_ORDER.forEach(type => {
    const questionsOfType = groupedItems[type] || [];
    const shuffledQuestions = shuffleArray(questionsOfType);

    if (shuffledQuestions.length <= minQuestions) {
      selectedGroups[type] = shuffledQuestions;
      return;
    }

    const maxAvailable = Math.min(maxQuestions, shuffledQuestions.length);
    const numberToTake = getRandomInt(minQuestions, maxAvailable);

    selectedGroups[type] = shuffledQuestions.slice(0, numberToTake);
  });

  return selectedGroups;
}

function insertReflectionQuestionIfAvailable(groupedItems, reflectionData) {
  if (!reflectionData || reflectionQuestionInserted) return;

  const allowedBlocks = Array.isArray(reflectionData.bloques_permitidos)
    ? reflectionData.bloques_permitidos.filter(type => SECTION_ORDER.includes(type))
    : [];

  const availableBlocks = allowedBlocks.filter(type => {
    const questionsOfType = groupedItems[type] || [];
    return questionsOfType.length > 0;
  });

  if (!availableBlocks.length) return;

  const selectedBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];

  const introduction = getRandomArrayItem(reflectionData.introducciones);
  const question = getRandomArrayItem(reflectionData.preguntas);

  if (!introduction || !question) return;

  const reflectionQuestion = {
    tipo: selectedBlock,
    esReflexion: true,
    introduccion: introduction,
    pregunta: question,
    texto_boton: reflectionData.texto_boton || "Continuar",
    guardar_en_informe: reflectionData.guardar_en_informe === true
  };

  const currentBlockQuestions = groupedItems[selectedBlock] || [];

  /*
    Ahora NO quitamos ninguna pregunta normal.
    El bloque seleccionado tendrá:
    - 3 preguntas normales
    - 1 pregunta de reflexión
  */
  groupedItems[selectedBlock] = shuffleArray([
    ...currentBlockQuestions,
    reflectionQuestion
  ]);

  reflectionQuestionInserted = true;
}

function insertBlockTransitionQuestions(groupedItems) {
  SECTION_ORDER.forEach(type => {
    const transitionsOfType = blockTransitionMessages[type];

    if (!Array.isArray(transitionsOfType) || transitionsOfType.length === 0) return;
    if (!Array.isArray(groupedItems[type])) return;

    const transitionMessage = getRandomArrayItem(transitionsOfType);

    if (!transitionMessage || !transitionMessage.texto) return;

    groupedItems[type].push({
      tipo: type,
      esTransicionBloque: true,
      pregunta: transitionMessage.texto || "",
      texto_boton: transitionMessage.texto_boton || "Continuar",
      audio: transitionMessage.audio || "",
      subtitulos: transitionMessage.subtitulos || ""
    });
  });
}

function getRandomArrayItem(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  const shuffled = array.slice();

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];

    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return shuffled;
}

function renderCurrentStep() {
  const type = SECTION_ORDER[sectionIndex];
  const sectionQuestions = groupedQuestions[type] || [];
  currentQuestion = sectionQuestions[questionIndex];

  if (!currentQuestion) {
    goNext();
    return;
  }

  selectedOptionIndex = null;

  const questionText = document.querySelector("#questionText");
  const answerInput = document.querySelector("#answerInput");
  const card = document.querySelector("#questionCard");

  document.querySelector("#sectionTitle").textContent = pluralTitle(type);
  answerInput.value = "";

  const isNormalQuestion =
    !currentQuestion.esTransicionBloque &&
    !currentQuestion.esReflexion;

  if (currentQuestion.esTransicionBloque) {
    renderBlockTransitionQuestion(currentQuestion);
  } else if (currentQuestion.esReflexion) {
    renderReflectionQuestion(currentQuestion);
  } else {
    questionText.textContent = personalizeText(currentQuestion.pregunta);
    continueBtn.textContent = "Continuar";
    continueBtn.disabled = true;

    renderOptions(currentQuestion);

    // En TODAS las preguntas normales ocultamos opciones y botón al principio
    hideOptionsTemporarily();
  }

  if (currentVideoType !== type) {
    currentVideoType = type;

    if (!watchedVideoTypes.has(type)) {
      prepareVideoFocusLayout();
    }

    renderVideo("#videoContainer", SECTION_VIDEOS[type], "Ver vídeo para continuar", type);
  } else if (watchedVideoTypes.has(type)) {
    showQuestionsLayoutImmediate();

    // Si es una pregunta normal posterior dentro del mismo bloque,
    // mostramos las opciones a los 3 segundos.
    if (isNormalQuestion) {
      hideOptionsTemporarily();
      showOptionsAfterDelay(3000);
    }
  }

  if (card) {
    if (watchedVideoTypes.has(type)) {
      card.classList.remove("waiting-video");
    } else {
      card.classList.add("waiting-video");
    }
  }

  updateProgress();
}

function pluralTitle(type) {
  return {
    Fortaleza: "Lo que hoy te impulsa",
    Debilidad: "Lo que puedes reforzar",
    Amenaza: "Lo que puede frenarte",
    Oportunidad: "Lo que podrías aprovechar"
  }[type] || type;
}

function renderVideo(selector, source, buttonText, type) {
  const container = document.querySelector(selector);

  if (!source) {
    container.innerHTML = "";
    return;
  }

  if (source.includes("youtube.com") || source.includes("youtu.be") || source.includes("vimeo.com")) {
    container.innerHTML = `
      <iframe src="${source}" allowfullscreen title="Vídeo"></iframe>
      <div class="video-start-layer">
        <button class="video-start-button" type="button">${buttonText}</button>
      </div>
    `;

    const layer = container.querySelector(".video-start-layer");

    layer.addEventListener("click", () => {
      layer.remove();

      if (type) {
        watchedVideoTypes.add(type);
      }

      const card = document.querySelector("#questionCard");
      if (card) {
        card.classList.remove("waiting-video");
      }
    });

    return;
  }

  container.innerHTML = `
    <video playsinline preload="metadata" src="${source}"></video>
    <div class="video-start-layer">
      <button class="video-start-button" type="button">${buttonText}</button>
    </div>
  `;

  const video = container.querySelector("video");
  const layer = container.querySelector(".video-start-layer");
  
  activeVideo = video;
  activeVideoLayer = layer;
  waitingForVideoStart = true;
  
  layer.addEventListener("click", event => {
    event.stopPropagation();
    startActiveVideo();
  });

  video.addEventListener("ended", () => {
    finishSectionVideo(type);
  });

  video.addEventListener("pause", () => {
    if (!video.ended) {
      resumeBackgroundMusicAfterVideo();
    }
  });

  video.addEventListener("play", () => {
    pauseBackgroundMusicForVideo();
  
    waitingForVideoStart = false;
  
    const card = document.querySelector("#questionCard");
  
    if (!card) {
      return;
    }
  
    if (type && !watchedVideoTypes.has(type)) {
      card.classList.add("waiting-video");
      card.classList.add("pre-reveal");
      card.classList.remove("reveal");
    } else {
      card.classList.remove("waiting-video");
    }
  });
}

function prepareVideoFocusLayout() {
  const activityGrid = document.querySelector(".activity-grid");
  const card = document.querySelector("#questionCard");
  const blockTitle = document.querySelector("#blockIntroTitle");

  if (!activityGrid || !card) return;

  activityGrid.classList.add("video-focus");

  card.classList.add("pre-reveal");
  card.classList.remove("reveal");

  if (blockTitle) {
    const type = SECTION_ORDER[sectionIndex];

    blockTitle.textContent = pluralTitle(type);
    blockTitle.classList.remove("hidden", "hide", "fade-out");
    blockTitle.classList.add("show");
  }
}

function showBlockIntroTitle(type) {
  if (!blockIntroTitle) return;

  blockIntroTitle.textContent = pluralTitle(type);
  blockIntroTitle.classList.remove("hidden", "hide");
  blockIntroTitle.classList.add("show");
}

function hideBlockIntroTitle() {
  if (!blockIntroTitle) return;

  blockIntroTitle.classList.remove("show");
  blockIntroTitle.classList.add("hide");

  setTimeout(() => {
    blockIntroTitle.classList.add("hidden");
    blockIntroTitle.classList.remove("hide");
    blockIntroTitle.textContent = "";
  }, 480);
}

function showQuestionsLayoutImmediate() {
  const activityGrid = document.querySelector(".activity-grid");
  const card = document.querySelector("#questionCard");
  const blockTitle = document.querySelector("#blockIntroTitle");

  if (!activityGrid || !card) return;

  activityGrid.classList.remove("video-focus");

  if (blockTitle) {
    blockTitle.classList.add("hidden");
    blockTitle.classList.remove("show", "hide", "fade-in", "fade-out");
    blockTitle.textContent = "";
  }

  card.classList.remove("pre-reveal");
  card.classList.add("reveal");
}

function revealQuestionsAfterVideo() {
  const activityGrid = document.querySelector(".activity-grid");
  const card = document.querySelector("#questionCard");
  const blockTitle = document.querySelector("#blockIntroTitle");

  if (!activityGrid || !card) {
    showQuestionsLayoutImmediate();
    return;
  }

  if (blockTitle) {
    blockTitle.classList.remove("show");
    blockTitle.classList.add("hide");
  }

  setTimeout(() => {
    if (blockTitle) {
      blockTitle.classList.add("hidden");
      blockTitle.classList.remove("hide");
      blockTitle.textContent = "";
    }

    activityGrid.classList.remove("video-focus");

    card.classList.remove("pre-reveal");
    card.classList.add("reveal");

    hideOptionsTemporarily();
    showOptionsAfterDelay(3000);
  }, 420);
}

function hideOptionsTemporarily() {
  const optionsList = document.querySelector("#optionsList");
  const actions = document.querySelector("#questionForm .actions");

  if (optionsList) {
    optionsList.classList.add("options-delayed");
    optionsList.classList.remove("options-visible");
  }

  if (actions) {
    actions.classList.add("actions-delayed");
    actions.classList.remove("actions-visible");
  }
}

function showOptionsAfterDelay(delay = 3000) {
  const optionsList = document.querySelector("#optionsList");
  const actions = document.querySelector("#questionForm .actions");

  setTimeout(() => {
    if (optionsList) {
      optionsList.classList.remove("options-delayed");
      optionsList.classList.add("options-visible");
    }

    if (actions) {
      actions.classList.remove("actions-delayed");
      actions.classList.add("actions-visible");
    }
  }, delay);
}

function showOptionsImmediate() {
  const optionsList = document.querySelector("#optionsList");
  const actions = document.querySelector("#questionForm .actions");

  if (optionsList) {
    optionsList.classList.remove("options-delayed");
    optionsList.classList.add("options-visible");
  }

  if (actions) {
    actions.classList.remove("actions-delayed");
    actions.classList.add("actions-visible");
  }
}

function finishSectionVideo(type) {
  waitingForVideoStart = false;
  resumeBackgroundMusicAfterVideo();

  if (type) {
    watchedVideoTypes.add(type);
  }

  const card = document.querySelector("#questionCard");

  if (card) {
    card.classList.remove("waiting-video");
  }

  revealQuestionsAfterVideo();
}

async function handleGlobalVideoStartClick(event) {
  if (!waitingForVideoStart || !activeVideo) {
    return;
  }

  if (
    event.target.closest("button") ||
    event.target.closest("a") ||
    event.target.closest("input") ||
    event.target.closest("select") ||
    event.target.closest("textarea") ||
    event.target.closest(".modal")
  ) {
    return;
  }

  await startActiveVideo();
}

function renderOptions(question) {
  const optionsList = document.querySelector("#optionsList");
  optionsList.innerHTML = "";

  const options = Array.isArray(question.opciones) ? question.opciones : [];

  if (options.length === 0) {
    currentShuffledOptions = [];
    optionsList.innerHTML = `<p class="help-text">No hay opciones definidas para esta pregunta.</p>`;
    return;
  }

  currentShuffledOptions = shuffleArray(
    options.map((optionText, originalIndex) => ({
      text: optionText,
      originalIndex
    }))
  );

  currentShuffledOptions.forEach((option, displayedIndex) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "option-button";
    button.innerHTML = `
      <span class="option-number">${displayedIndex + 1}</span>
      <span>${escapeHtml(personalizeText(option.text))}</span>
    `;

    button.addEventListener("click", () => selectOption(displayedIndex));
    optionsList.appendChild(button);
  });
}

function renderReflectionQuestion(question) {
  const optionsList = document.querySelector("#optionsList");
  const questionText = document.querySelector("#questionText");

  selectedOptionIndex = null;
  currentShuffledOptions = [];

  questionText.innerHTML = `
    <span class="reflection-intro">${escapeHtml(personalizeText(question.introduccion || ""))}</span>
    <span class="reflection-question">${escapeHtml(personalizeText(question.pregunta || ""))}</span>
  `;

  optionsList.innerHTML = "";

  continueBtn.textContent = question.texto_boton || "Continuar";
  continueBtn.disabled = false;
  showOptionsImmediate();
}

async function renderBlockTransitionQuestion(question) {
  const optionsList = document.querySelector("#optionsList");
  const questionText = document.querySelector("#questionText");

  selectedOptionIndex = null;
  currentShuffledOptions = [];

  optionsList.innerHTML = "";
  continueBtn.textContent = question.texto_boton || "Continuar";
  continueBtn.disabled = false;
  showOptionsImmediate();

  stopTransitionQuestionAudio();

  // Mostramos TODO el texto desde el principio
  questionText.innerHTML = `
    <span class="reflection-question">${escapeHtml(personalizeText(question.pregunta || ""))}</span>
  `;

  // Reproducimos el audio, pero ya no usamos subtítulos progresivos
  if (!question.audio) {
    return;
  }

  transitionQuestionAudio = new Audio(question.audio);
  transitionQuestionAudio.preload = "auto";

  try {
    await playAudioWithDelay(transitionQuestionAudio, 1500);
  } catch (error) {
    console.warn("No se pudo reproducir el audio de transición.", error);
  }
}

function startTransitionQuestionSubtitles(question) {
  const questionText = document.querySelector("#questionText");

  if (!transitionQuestionAudio || !questionText) return;

  if (!transitionQuestionCues.length) {
    questionText.innerHTML = `
      <span class="reflection-question">${escapeHtml(personalizeText(question.pregunta || ""))}</span>
    `;
    return;
  }

  transitionQuestionSubtitleTimer = setInterval(() => {
    const currentTime = transitionQuestionAudio.currentTime;
    const cue = transitionQuestionCues.find(item => currentTime >= item.start && currentTime <= item.end);

    questionText.innerHTML = `
      <span class="reflection-question">${
        cue
          ? escapeHtml(personalizeText(cue.text))
          : ""
      }</span>
    `;
  }, 100);

  transitionQuestionAudio.addEventListener("ended", () => {
    stopTransitionQuestionSubtitlesOnly();

    questionText.innerHTML = `
      <span class="reflection-question">${escapeHtml(personalizeText(question.pregunta || ""))}</span>
    `;
  }, { once: true });
}

function stopTransitionQuestionSubtitlesOnly() {
  if (transitionQuestionSubtitleTimer) {
    clearInterval(transitionQuestionSubtitleTimer);
    transitionQuestionSubtitleTimer = null;
  }
}

function stopTransitionQuestionAudio() {
  stopTransitionQuestionSubtitlesOnly();

  if (transitionQuestionAudio) {
    transitionQuestionAudio.pause();
    transitionQuestionAudio.currentTime = 0;
    transitionQuestionAudio = null;
  }
}

async function startActiveVideo() {
  if (!activeVideo) {
    return;
  }

  waitingForVideoStart = false;

  if (activeVideoLayer) {
    activeVideoLayer.remove();
    activeVideoLayer = null;
  }

  activeVideo.setAttribute("controls", "controls");

  try {
    await activeVideo.play();
  } catch (error) {
    console.warn("El navegador no permitió reproducir el vídeo.", error);
  }
}

function selectOption(index) {
  selectedOptionIndex = index;
  document.querySelector("#answerInput").value = String(index);
  continueBtn.disabled = false;

  document.querySelectorAll(".option-button").forEach((button, buttonIndex) => {
    button.classList.toggle("selected", buttonIndex === index);
  });
}

function commitAnswerAndGoNext() {
  if (currentQuestion && currentQuestion.esTransicionBloque) {
    stopTransitionQuestionAudio();
    goNext();
    return;
  }  
  if (currentQuestion && currentQuestion.esReflexion) {
    if (currentQuestion.guardar_en_informe === true) {
      answers.push({
        tipo: currentQuestion.tipo,
        esReflexion: true,
        pregunta: personalizeText(currentQuestion.pregunta),
        respuestaUsuario: "",
        respuestaUsuarioIndice: null,
        respuestaAdecuada: "",
        respuestaAdecuadaIndice: null,
        correcta: true,
        feedback: personalizeText(currentQuestion.pregunta)
      });
    }

    goNext();
    return;
  }

  if (selectedOptionIndex === null) {
    alert("Elige una opción para continuar.");
    return;
  }

  answers.push(buildAnswerFromCurrentSelection());
  goNext();
}

function buildAnswerFromCurrentSelection() {
  const options = Array.isArray(currentQuestion.opciones) ? currentQuestion.opciones : [];
  const selectedOption = currentShuffledOptions[selectedOptionIndex];

  if (!selectedOption) {
    return {
      tipo: currentQuestion.tipo,
      pregunta: personalizeText(currentQuestion.pregunta),
      respuestaUsuario: "",
      respuestaUsuarioIndice: null,
      respuestaAdecuada: personalizeText(options[Number(currentQuestion.respuesta_adecuada)] || ""),
      respuestaAdecuadaIndice: Number(currentQuestion.respuesta_adecuada),
      correcta: false,
      feedback: "No se ha podido registrar correctamente la respuesta.",
      pdfItems: []
    };
  }

  const originalIndex = selectedOption.originalIndex;
  const adequate = Number(originalIndex) === Number(currentQuestion.respuesta_adecuada);

  return {
    tipo: currentQuestion.tipo,
    pregunta: personalizeText(currentQuestion.pregunta),
    respuestaUsuario: personalizeText(selectedOption.text),
    respuestaUsuarioIndice: originalIndex,
    respuestaAdecuada: personalizeText(options[Number(currentQuestion.respuesta_adecuada)] || ""),
    respuestaAdecuadaIndice: Number(currentQuestion.respuesta_adecuada),
    correcta: adequate,
    feedback: getFeedbackForSelectedOption(currentQuestion, originalIndex),

    // Nuevo sistema para DAFO de empleabilidad
    pdfItems: getPdfItemsForSelectedOption(currentQuestion, originalIndex)
  };
}

function getPdfTextForSelectedOption(question, selectedIndex) {
  if (Array.isArray(question.pdf)) {
    return personalizeText(question.pdf[selectedIndex] || "");
  }

  return "";
}

function getFeedbackForSelectedOption(question, selectedIndex) {
  if (Array.isArray(question.feedback)) {
    return personalizeText(question.feedback[selectedIndex] || "Revisa este apartado con más profundidad.");
  }

  return personalizeText(question.feedback || "Revisa este apartado con más profundidad.");
}

function getPdfItemsForSelectedOption(question, selectedIndex) {
  if (!Array.isArray(question.pdf)) {
    return [];
  }

  const selectedPrefix = String(selectedIndex).trim();

  return question.pdf
    .map(item => String(item || "").trim())
    .filter(Boolean)
    .map(item => {
      /*
        Formato esperado:
        0.F. Texto
        0.D. Texto
        0.O. Texto
        0.A. Texto

        También tolera:
        0. F. Texto
        0. D. Texto
      */
      const match = item.match(/^(\d+)\s*\.\s*([FDOA])\s*\.\s*(.+)$/i);

      if (!match) {
        return null;
      }

      const optionIndex = match[1];
      const dafoCode = match[2].toUpperCase();
      const text = match[3].trim();

      if (optionIndex !== selectedPrefix) {
        return null;
      }

      const typeMap = {
        F: "Fortaleza",
        D: "Debilidad",
        O: "Oportunidad",
        A: "Amenaza"
      };

      return {
        tipo: typeMap[dafoCode],
        texto: personalizeText(text)
      };
    })
    .filter(Boolean);
}

function goNext() {
  stopTransitionQuestionAudio();

  questionIndex++;

  const currentType = SECTION_ORDER[sectionIndex];
  const currentSectionQuestions = groupedQuestions[currentType] || [];
  const hasFinishedCurrentBlock = questionIndex >= currentSectionQuestions.length;

  if (!hasFinishedCurrentBlock) {
    renderCurrentStep();
    return;
  }

  const nextSectionIndex = sectionIndex + 1;

  if (nextSectionIndex >= SECTION_ORDER.length) {
    showResult();
    return;
  }

  sectionIndex = nextSectionIndex;
  questionIndex = 0;
  renderCurrentStep();
}

function updateProgress() {
  const allQuestions = SECTION_ORDER.flatMap(type => groupedQuestions[type] || []);
  const progressQuestions = allQuestions.filter(question => !question.esTransicionBloque);

  const completed = answers.length;
  const totalQuestions = progressQuestions.length;
  const percent = totalQuestions ? Math.round((completed / totalQuestions) * 100) : 0;

  document.querySelector("#progressBar").style.width = `${percent}%`;
  document.querySelector("#progressPercent").textContent = `${percent}%`;
}

function isBlockPassed(type) {
  const blockAnswers = answers.filter(answer => answer.tipo === type);

  if (blockAnswers.length === 0) {
    return true;
  }

  return blockAnswers.every(answer => answer.correcta);
}

function chooseSummaryVideoKey() {
  let feedbackNumber = 1;

  if (!isBlockPassed("Fortaleza")) {
    feedbackNumber += 8;
  }

  if (!isBlockPassed("Debilidad")) {
    feedbackNumber += 4;
  }

  if (!isBlockPassed("Amenaza")) {
    feedbackNumber += 2;
  }

  if (!isBlockPassed("Oportunidad")) {
    feedbackNumber += 1;
  }

  return `feedback_${feedbackNumber}`;
}

function showResult() {
  app.classList.add("hidden");
  result.classList.remove("hidden");

  setScreenMode("result");

  const key = chooseSummaryVideoKey();

  renderVideo("#summaryVideoContainer", SUMMARY_VIDEOS[key], "Ver resumen", null);

  const finalTitle = document.querySelector("#finalReflectionTitle");

  if (finalTitle) {
    finalTitle.textContent = userName
      ? `${userName}, aquí puedes descargar tu reflexión personalizada.`
      : "Aquí puedes descargar tu reflexión personalizada.";
  }
}

function renderDafoMatrix() {
  const map = {
    Debilidad: "#dafoDebilidades",
    Amenaza: "#dafoAmenazas",
    Fortaleza: "#dafoFortalezas",
    Oportunidad: "#dafoOportunidades"
  };

  Object.entries(map).forEach(([tipo, selector]) => {
    const container = document.querySelector(selector);
    if (!container) return;

    const blockAnswers = answers.filter(answer => answer.tipo === tipo);

    if (blockAnswers.length === 0) {
      container.innerHTML = "<li>Sin reflexiones registradas.</li>";
      return;
    }

    container.innerHTML = blockAnswers
      .map(answer => `<li>${escapeHtml(answer.feedback)}</li>`)
      .join("");
  });
}

function personalizeText(text) {
  let result = String(text || "");

  result = result.split("{{nombre}}").join(userName);
  result = result.split("{nombre}").join(userName);
  result = result.split("[nombre]").join(userName);
  result = result.split("NOMBRE").join(userName);

  return result;
}

function escapeHtml(text) {
  let result = String(text || "");

  result = result.split("&").join("&amp;");
  result = result.split("<").join("&lt;");
  result = result.split(">").join("&gt;");
  result = result.split('"').join("&quot;");
  result = result.split("'").join("&#39;");

  return result;
}

async function createPdfDocument() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const projectLogo = await loadImageAsDataUrl("imagenes/logo_DAFO.png");
  const saeLogo = await loadImageAsDataUrl("imagenes/SAE_Junta_de_Andalucia_Documentacion.png");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 14;
  const usableWidth = pageWidth - margin * 2;

  const key = chooseSummaryVideoKey();
  const feedbackInfo = feedbacksData[key] || {};

  const colors = {
    webBlue: [7, 151, 162],
    webBlueDark: [3, 109, 120],
    webBlueSoft: [232, 248, 249],
  
    green: [36, 133, 92],
    greenSoft: [232, 246, 239],
  
    orange: [211, 132, 37],
    orangeSoft: [255, 244, 229],
  
    blue: [49, 119, 186],
    blueSoft: [232, 242, 252],
  
    red: [181, 65, 65],
    redSoft: [252, 234, 234],
  
    ink: [35, 45, 48],
    muted: [90, 105, 108]
  };

  /*
    PÁGINA 1
    Resumen + matriz DAFO
  */
  drawPdfHeader(
  doc,
  projectLogo,
  saeLogo,
  userName ? `${userName}, tu reflexión sugiere...` : "Tu reflexión sugiere...",
  "",
  colors
);

let y = 43;

y = drawLongIntroTitlePdf(
  doc,
  "Valoración personalizada de tus ventajas y desafíos para seguir avanzando profesionalmente.",
  margin,
  y,
  usableWidth,
  colors.webBlue
);

y += 2;

y = drawSummaryBoxPdf(
  doc,
  margin,
  y,
  usableWidth,
  feedbackInfo,
  colors
);

y += 6;

// Matriz DAFO directamente a continuación del resumen
y = drawDafoMatrixPdf(doc, margin, y, usableWidth);

  drawCenteredSaeClaim(doc, pageWidth, pageHeight, colors.webBlue);

  /*
    PÁGINA 2
    Preguntas y respuestas
  */
  doc.addPage();

  drawPdfHeader(
    doc,
    projectLogo,
    saeLogo,
    "Tus respuestas",
    "",
    colors
  );

  y = 42;

  y = drawAnswersPagePdf(doc, margin, y, usableWidth, pageHeight, colors);

  /*
    PÁGINA 3
    DAFO de empleabilidad
  */
  doc.addPage();

  drawPdfHeader(
    doc,
    projectLogo,
    saeLogo,
    "DAFO de empleabilidad",
    "Síntesis final a partir de tus respuestas.",
    colors
  );

  y = 42;

  y = drawEmployabilityDafoPdf(doc, margin, y, usableWidth, pageHeight);

  addPdfFooter(doc);

  return doc;
}

function drawPdfHeader(doc, projectLogo, saeLogo, title, subtitle, colors) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(colors.webBlue[0], colors.webBlue[1], colors.webBlue[2]);
  doc.rect(0, 0, pageWidth, 34, "F");

  if (projectLogo) {
    addImageKeepingRatio(doc, projectLogo, 14, 6, 18, 18);
  }

  if (saeLogo) {
    addImageKeepingRatio(doc, saeLogo, pageWidth - 14 - 46, 7, 46, 17);
  }

  const titleX = 38;
  const titleWidth = pageWidth - titleX - 66;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(255, 255, 255);

  let y = addWrappedText(doc, title, titleX, 13, titleWidth, 5.8);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(240, 250, 246);
    addWrappedText(doc, subtitle, titleX, y, titleWidth, 4);
  }
}

function drawSectionTitlePdf(doc, title, x, y, color) {
  const finalColor = color || [7, 151, 162];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(finalColor[0], finalColor[1], finalColor[2]);
  doc.text(title, x, y);

  doc.setDrawColor(finalColor[0], finalColor[1], finalColor[2]);
  doc.setLineWidth(0.8);
  doc.line(x, y + 3, x + 44, y + 3);

  return y + 8;
}

function drawSummaryBoxPdf(doc, x, y, width, feedbackInfo, colors) {
  const startY = y;
  const innerX = x + 6;
  const innerWidth = width - 12;
  let innerY = y + 7;

  const title = personalizeText(feedbackInfo.titulo || "Tu reflexión final");
  const resumen = personalizeText(
    feedbackInfo.resumen || "Aquí aparecerá la valoración asociada a tu resultado final."
  );
  const reflexion = personalizeText(
    feedbackInfo.reflexion || feedbackInfo.recomendacion || ""
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.2);
  const titleLines = doc.splitTextToSize(title, innerWidth);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const resumenLines = doc.splitTextToSize(resumen, innerWidth);

  const reflexionLines = reflexion
    ? doc.splitTextToSize(reflexion, innerWidth)
    : [];

  const boxHeight =
    7 +
    titleLines.length * 5.2 +
    3 +
    resumenLines.length * 4.5 +
    4 +
    (reflexionLines.length ? 5 + reflexionLines.length * 4.5 : 0) +
    6;

  doc.setFillColor(colors.webBlueSoft[0], colors.webBlueSoft[1], colors.webBlueSoft[2]);
  doc.setDrawColor(colors.webBlue[0], colors.webBlue[1], colors.webBlue[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, startY, width, boxHeight, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.2);
  doc.setTextColor(colors.webBlue[0], colors.webBlue[1], colors.webBlue[2]);
  doc.text(titleLines, innerX, innerY);
  innerY += titleLines.length * 5.2 + 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(colors.ink[0], colors.ink[1], colors.ink[2]);
  doc.text(resumenLines, innerX, innerY);
  innerY += resumenLines.length * 4.5 + 4;

  if (reflexionLines.length) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.webBlue[0], colors.webBlue[1], colors.webBlue[2]);
    doc.text("A tener en cuenta:", innerX, innerY);
    innerY += 5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.ink[0], colors.ink[1], colors.ink[2]);
    doc.text(reflexionLines, innerX, innerY);
  }

  return startY + boxHeight + 2;
}

function drawCenteredSaeClaim(doc, pageWidth, pageHeight, color) {
  const text = "Servicio Andaluz de Empleo. Contigo, creciendo profesionalmente.";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);

  const textWidth = doc.getTextWidth(text);
  doc.text(text, (pageWidth - textWidth) / 2, pageHeight - 25);
}

function drawAnswersPagePdf(doc, x, y, width, pageHeight, colors) {
  const bottomLimit = pageHeight - 22;

  /*
    Preparamos una lista plana:
    - Título de bloque
    - Preguntas/respuestas del bloque
  */
  const rows = [];

  SECTION_ORDER.forEach(type => {
    const typeAnswers = answers.filter(answer => answer.tipo === type);

    if (!typeAnswers.length) return;

    rows.push({
      kind: "section",
      type,
      title: pluralTitle(type)
    });

    typeAnswers.forEach((answer, index) => {
      rows.push({
        kind: "answer",
        type,
        index: index + 1,
        question: answer.pregunta || "",
        response: answer.respuestaUsuario || "Reflexión realizada."
      });
    });
  });

  /*
    Tamaños base.
    Ajustados para que entren todas las preguntas,
    pero con el texto mejor centrado dentro de cada recuadro.
  */
  let titleFontSize = 10.6;
  let questionFontSize = 7.4;
  let responseFontSize = 7.1;

  let lineHeightQuestion = 3.15;
  let lineHeightResponse = 3.05;

  let sectionGapTop = 4.8;
  let sectionGapBottom = 4.8;
  let boxGap = 2.1;

  /*
    Estos son los valores importantes:
    - Más margen arriba.
    - Menos margen abajo.
    - Menos separación entre pregunta y respuesta.
    Así el bloque se ve más centrado y no queda tanto hueco inferior.
  */
  let topPadding = 4.1;
  let bottomPadding = 1.6;
  let innerGap = 0.8;

  function calculateTotalHeight() {
    let total = 0;

    rows.forEach(row => {
      if (row.kind === "section") {
        total += sectionGapTop + 4.6 + sectionGapBottom;
        return;
      }

      const questionText = `${row.index}. ${row.question}`;
      const responseText = `Tu respuesta: ${row.response}`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(questionFontSize);
      const questionLines = doc.splitTextToSize(questionText, width - 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(responseFontSize);
      const responseLines = doc.splitTextToSize(responseText, width - 8);

      const boxHeight =
        topPadding +
        questionLines.length * lineHeightQuestion +
        innerGap +
        responseLines.length * lineHeightResponse +
        bottomPadding;

      total += boxHeight + boxGap;
    });

    return total;
  }

  /*
    Ajuste si no cabe.
    Bajamos ligeramente fuente y espaciados hasta que quepa,
    pero protegemos los márgenes para que no vuelva a quedar mal centrado.
  */
  const availableHeight = bottomLimit - y;
  let totalHeight = calculateTotalHeight();

  while (totalHeight > availableHeight && questionFontSize > 6.2) {
    titleFontSize -= 0.25;
    questionFontSize -= 0.18;
    responseFontSize -= 0.18;

    lineHeightQuestion -= 0.08;
    lineHeightResponse -= 0.08;

    sectionGapTop = Math.max(3.4, sectionGapTop - 0.12);
    sectionGapBottom = Math.max(3.4, sectionGapBottom - 0.12);
    boxGap = Math.max(1.4, boxGap - 0.08);

    /*
      No reducimos demasiado estos márgenes.
      Si bajan mucho, el texto vuelve a pegarse arriba.
    */
    topPadding = Math.max(3.6, topPadding - 0.04);
    bottomPadding = Math.max(1.2, bottomPadding - 0.04);
    innerGap = Math.max(0.6, innerGap - 0.03);

    totalHeight = calculateTotalHeight();
  }

  rows.forEach(row => {
    const blockColor = getDafoPdfColor(row.type);

    if (row.kind === "section") {
      y += sectionGapTop;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(titleFontSize);
      doc.setTextColor(blockColor.color[0], blockColor.color[1], blockColor.color[2]);
      doc.text(row.title, x, y);

      y += sectionGapBottom;
      return;
    }

    const questionText = `${row.index}. ${row.question}`;
    const responseText = `Tu respuesta: ${row.response}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(questionFontSize);
    const questionLines = doc.splitTextToSize(questionText, width - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(responseFontSize);
    const responseLines = doc.splitTextToSize(responseText, width - 8);

    const questionHeight = questionLines.length * lineHeightQuestion;
    const responseHeight = responseLines.length * lineHeightResponse;

    const boxHeight =
      topPadding +
      questionHeight +
      innerGap +
      responseHeight +
      bottomPadding;

    doc.setFillColor(blockColor.bg[0], blockColor.bg[1], blockColor.bg[2]);
    doc.setDrawColor(blockColor.color[0], blockColor.color[1], blockColor.color[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, width, boxHeight, 2.4, 2.4, "FD");

    /*
      Aquí estaba el detalle visual.
      Antes era: let innerY = y + topPadding;
      Ahora se baja un poco el texto para que no parezca pegado arriba.
    */
    let innerY = y + topPadding + 1.2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(questionFontSize);
    doc.setTextColor(35, 45, 48);
    doc.text(questionLines, x + 4, innerY);

    innerY += questionHeight + innerGap;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(responseFontSize);
    doc.setTextColor(60, 70, 74);
    doc.text(responseLines, x + 4, innerY);

    y += boxHeight + boxGap;
  });

  return y;
}

function ensureSpaceFixedPage(doc, y, needed, pageHeight) {
  const bottomLimit = pageHeight - 22;

  if (y + needed > bottomLimit) {
    /*
      Como quieres 3 páginas fijas, no añadimos página nueva aquí.
      Reducimos un poco la altura visual continuando cerca del margen.
      Si algún día metes muchas más preguntas, habría que bajar fuente o pasar a 4 páginas.
    */
    return y;
  }

  return y;
}

function getDafoPdfColor(type) {
  const map = {
    Fortaleza: {
      color: [36, 133, 92],
      bg: [232, 246, 239]
    },
    Debilidad: {
      color: [211, 132, 37],
      bg: [255, 244, 229]
    },
    Oportunidad: {
      color: [49, 119, 186],
      bg: [232, 242, 252]
    },
    Amenaza: {
      color: [181, 65, 65],
      bg: [252, 234, 234]
    }
  };

  return map[type] || {
    color: [36, 133, 92],
    bg: [232, 246, 239]
  };
}

function loadImageAsDataUrl(src) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        console.warn(`No se pudo convertir la imagen ${src}.`, error);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn(`No se pudo cargar la imagen ${src}. Revisa la ruta.`);
      resolve(null);
    };

    img.src = src;
  });
}

function addImageKeepingRatio(doc, imageDataUrl, x, y, maxWidth, maxHeight) {
  const properties = doc.getImageProperties(imageDataUrl);
  const ratio = properties.width / properties.height;

  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  doc.addImage(imageDataUrl, "PNG", x, y, width, height);
}

function drawSectionTitle(doc, title, x, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(7, 108, 116);
  doc.text(title, x, y);

  doc.setDrawColor(183, 216, 61);
  doc.setLineWidth(1.2);
  doc.line(x, y + 3, x + 48, y + 3);

  return y + 8;
}

function drawSoftBox(doc, x, y, width, contentCallback) {
  const startY = y;
  const finalY = contentCallback();

  const height = finalY - startY;

  doc.setFillColor(238, 248, 248);
  doc.setDrawColor(210, 232, 232);
  doc.roundedRect(x, startY, width, height, 4, 4, "FD");

  // Reescribe el contenido por encima de la caja
  contentCallback();

  return finalY + 2;
}

function drawDafoMatrixPdf(doc, x, y, width) {
  const gap = 6;
  const boxWidth = (width - gap) / 2;

  const boxes = [
    {
      type: "Fortaleza",
      title: "LO QUE HOY TE IMPULSA"
    },
    {
      type: "Debilidad",
      title: "LO QUE PUEDES REFORZAR"
    },
    {
      type: "Oportunidad",
      title: "LO QUE PODRÍAS APROVECHAR"
    },
    {
      type: "Amenaza",
      title: "LO QUE PUEDE FRENARTE"
    }
  ];

  const boxData = boxes.map(box => {
    const items = answers
      .filter(answer => answer.tipo === box.type)
      .map(answer => answer.feedback)
      .filter(Boolean);

    const colors = getDafoPdfColor(box.type);
    const height = calculateDafoBoxHeightPdf(doc, boxWidth, items);

    return {
      ...box,
      items,
      color: colors.color,
      bg: colors.bg,
      height
    };
  });

  const row1Height = Math.max(boxData[0].height, boxData[1].height);
  const row2Height = Math.max(boxData[2].height, boxData[3].height);

  drawDafoBoxPdf(
    doc,
    x,
    y,
    boxWidth,
    row1Height,
    boxData[0].title,
    boxData[0].items,
    boxData[0].color,
    boxData[0].bg
  );

  drawDafoBoxPdf(
    doc,
    x + boxWidth + gap,
    y,
    boxWidth,
    row1Height,
    boxData[1].title,
    boxData[1].items,
    boxData[1].color,
    boxData[1].bg
  );

  drawDafoBoxPdf(
    doc,
    x,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[2].title,
    boxData[2].items,
    boxData[2].color,
    boxData[2].bg
  );

  drawDafoBoxPdf(
    doc,
    x + boxWidth + gap,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[3].title,
    boxData[3].items,
    boxData[3].color,
    boxData[3].bg
  );

  return y + row1Height + row2Height + gap + 8;
}

function calculateDafoBoxHeightPdf(doc, width, items) {
  const visibleItems = items.length ? items : ["Sin reflexiones registradas."];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);

  let textHeight = 0;

  visibleItems.slice(0, 3).forEach(item => {
    const lines = doc.splitTextToSize(`• ${item}`, width - 12);
    const availableLines = lines.slice(0, 4);
    textHeight += availableLines.length * 3.8 + 2.2;
  });

  const titleArea = 18;
  const bottomPadding = 6;
  const minHeight = 40;

  return Math.max(minHeight, titleArea + textHeight + bottomPadding);
}

function drawDafoBoxPdf(doc, x, y, width, height, title, items, color, bg) {
  const titleHeight = 14;

  // Fondo general oscuro
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, height, 4, 4, "FD");

  // Cabecera clara
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.roundedRect(x, y, width, titleHeight, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, x + 5, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);

  const visibleItems = items.length ? items : ["Sin reflexiones registradas."];
  let itemY = y + titleHeight + 8;
  const maxY = y + height - 5;

  visibleItems.slice(0, 3).forEach(item => {
    if (itemY >= maxY) return;

    const lines = doc.splitTextToSize(`• ${item}`, width - 12);
    const availableLines = lines.slice(0, 4);

    doc.text(availableLines, x + 5, itemY);
    itemY += availableLines.length * 3.8 + 2.2;
  });
}

function drawPdfColumnDafoMatrix(doc, x, y, width, pageHeight) {
  const gap = 6;
  const boxWidth = (width - gap) / 2;

  const boxes = [
    {
      type: "Fortaleza",
      title: "FORTALEZAS",
      color: [244, 196, 0]
    },
    {
      type: "Debilidad",
      title: "DEBILIDADES",
      color: [87, 211, 0]
    },
    {
      type: "Oportunidad",
      title: "OPORTUNIDADES",
      color: [176, 122, 230]
    },
    {
      type: "Amenaza",
      title: "AMENAZAS",
      color: [66, 161, 242]
    }
  ];

  const boxData = boxes.map(box => {
    const items = answers
      .filter(answer => answer.tipo === box.type)
      .map(answer => answer.pdf || answer.feedback || "")
      .filter(Boolean);

    const height = calculatePdfDafoBoxHeight(doc, boxWidth, items);

    return {
      ...box,
      items,
      height
    };
  });

  const row1Height = Math.max(boxData[0].height, boxData[1].height);
  const row2Height = Math.max(boxData[2].height, boxData[3].height);

  const neededHeight = row1Height + row2Height + gap + 10;

  if (y + neededHeight > pageHeight - 22) {
    doc.addPage();
    y = 18;
    y = drawSectionTitle(doc, "DAFO de empleabilidad", x, y);
    y += 4;
  }

  drawPdfDafoBox(
    doc,
    x,
    y,
    boxWidth,
    row1Height,
    boxData[0].title,
    boxData[0].items,
    boxData[0].color
  );

  drawPdfDafoBox(
    doc,
    x + boxWidth + gap,
    y,
    boxWidth,
    row1Height,
    boxData[1].title,
    boxData[1].items,
    boxData[1].color
  );

  drawPdfDafoBox(
    doc,
    x,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[2].title,
    boxData[2].items,
    boxData[2].color
  );

  drawPdfDafoBox(
    doc,
    x + boxWidth + gap,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[3].title,
    boxData[3].items,
    boxData[3].color
  );

  return y + row1Height + row2Height + gap + 10;
}

function calculatePdfDafoBoxHeight(doc, width, items) {
  const visibleItems = items.length ? items : ["Sin información registrada."];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);

  let textHeight = 0;

  visibleItems.slice(0, 3).forEach(item => {
    const lines = doc.splitTextToSize(`• ${item}`, width - 10);
    textHeight += lines.length * 3.6 + 2;
  });

  const titleArea = 18;
  const bottomPadding = 7;
  const minHeight = 42;

  return Math.max(minHeight, titleArea + textHeight + bottomPadding);
}

function drawPdfDafoBox(doc, x, y, width, height, title, items, color) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, width, height, 5, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + 5, y + 8.5);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.7);
  doc.line(x + 5, y + 11.5, x + width - 5, y + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(20, 35, 38);

  const visibleItems = items.length ? items : ["Sin información registrada."];
  let itemY = y + 18;

  visibleItems.slice(0, 3).forEach(item => {
    const lines = doc.splitTextToSize(`• ${item}`, width - 10);
    doc.text(lines, x + 5, itemY);
    itemY += lines.length * 3.6 + 2;
  });
}

function drawEmployabilityDafoPdf(doc, x, y, width, pageHeight) {
  const gap = 6;
  const boxWidth = (width - gap) / 2;

  const boxes = [
    {
      type: "Fortaleza",
      title: "FORTALEZAS",
      color: [36, 133, 92],
      bg: [232, 246, 239]
    },
    {
      type: "Debilidad",
      title: "DEBILIDADES",
      color: [211, 132, 37],
      bg: [255, 244, 229]
    },
    {
      type: "Oportunidad",
      title: "OPORTUNIDADES",
      color: [49, 119, 186],
      bg: [232, 242, 252]
    },
    {
      type: "Amenaza",
      title: "AMENAZAS",
      color: [181, 65, 65],
      bg: [252, 234, 234]
    }
  ];

  /*
    Recoge todos los elementos DAFO generados desde las respuestas.
    Cada answer puede traer varios pdfItems, por ejemplo:
    [
      { tipo: "Fortaleza", texto: "Alto autoconocimiento profesional." },
      { tipo: "Oportunidad", texto: "Capacidad de diferenciación." }
    ]
  */
  const allPdfItems = answers
    .flatMap(answer => {
      if (Array.isArray(answer.pdfItems)) {
        return answer.pdfItems;
      }

      return [];
    })
    .filter(item => item && item.tipo && item.texto);

  const boxData = boxes.map(box => {
    const items = allPdfItems
      .filter(item => item.tipo === box.type)
      .map(item => item.texto)
      .filter(Boolean);

    const height = calculateEmployabilityDafoBoxHeightPdf(doc, boxWidth, items);

    return {
      ...box,
      items,
      height
    };
  });

  /*
    Distribución 2x2:
    FORTALEZAS      DEBILIDADES
    OPORTUNIDADES   AMENAZAS
  */
  let row1Height = Math.max(boxData[0].height, boxData[1].height);
  let row2Height = Math.max(boxData[2].height, boxData[3].height);

  /*
    Como quieres una página 3 fija, evitamos que el DAFO se salga por abajo.
    Si hay muchos textos, reducimos proporcionalmente la altura visual.
  */
  const bottomLimit = pageHeight - 24;
  const availableHeight = bottomLimit - y;
  const totalHeight = row1Height + row2Height + gap;

  if (totalHeight > availableHeight) {
    const scale = availableHeight / totalHeight;

    row1Height = Math.max(48, row1Height * scale);
    row2Height = Math.max(48, row2Height * scale);
  }

  // FORTALEZAS
  drawEmployabilityDafoBoxPdf(
    doc,
    x,
    y,
    boxWidth,
    row1Height,
    boxData[0].title,
    boxData[0].items,
    boxData[0].color,
    boxData[0].bg
  );

  // DEBILIDADES
  drawEmployabilityDafoBoxPdf(
    doc,
    x + boxWidth + gap,
    y,
    boxWidth,
    row1Height,
    boxData[1].title,
    boxData[1].items,
    boxData[1].color,
    boxData[1].bg
  );

  // OPORTUNIDADES
  drawEmployabilityDafoBoxPdf(
    doc,
    x,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[2].title,
    boxData[2].items,
    boxData[2].color,
    boxData[2].bg
  );

  // AMENAZAS
  drawEmployabilityDafoBoxPdf(
    doc,
    x + boxWidth + gap,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[3].title,
    boxData[3].items,
    boxData[3].color,
    boxData[3].bg
  );

  return y + row1Height + row2Height + gap + 10;
}

function clearOptionsDelayTimer() {
  if (optionsDelayTimer) {
    clearTimeout(optionsDelayTimer);
    optionsDelayTimer = null;
  }
}

function hideOptionsTemporarily() {
  clearOptionsDelayTimer();

  const optionsList = document.querySelector("#optionsList");
  const actions = document.querySelector("#questionForm .actions");

  if (optionsList) {
    optionsList.classList.add("options-delayed");
    optionsList.classList.remove("options-visible");
  }

  if (actions) {
    actions.classList.add("actions-delayed");
    actions.classList.remove("actions-visible");
  }
}

function showOptionsAfterDelay(delay = 3000) {
  clearOptionsDelayTimer();

  const optionsList = document.querySelector("#optionsList");
  const actions = document.querySelector("#questionForm .actions");

  optionsDelayTimer = setTimeout(() => {
    if (optionsList) {
      optionsList.classList.remove("options-delayed");
      optionsList.classList.add("options-visible");
    }

    if (actions) {
      actions.classList.remove("actions-delayed");
      actions.classList.add("actions-visible");
    }

    optionsDelayTimer = null;
  }, delay);
}

function showOptionsImmediate() {
  clearOptionsDelayTimer();

  const optionsList = document.querySelector("#optionsList");
  const actions = document.querySelector("#questionForm .actions");

  if (optionsList) {
    optionsList.classList.remove("options-delayed");
    optionsList.classList.add("options-visible");
  }

  if (actions) {
    actions.classList.remove("actions-delayed");
    actions.classList.add("actions-visible");
  }
}

function calculateEmployabilityDafoBoxHeightPdf(doc, width, items) {
  const visibleItems = items.length ? items : ["Sin información registrada."];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);

  let textHeight = 0;

  visibleItems.forEach(item => {
    const lines = doc.splitTextToSize(`• ${item}`, width - 12);
    textHeight += lines.length * 3.7 + 1.8;
  });

  const titleArea = 15;
  const bottomPadding = 6;
  const minHeight = 50;

  return Math.max(minHeight, titleArea + textHeight + bottomPadding);
}

function drawEmployabilityDafoBoxPdf(doc, x, y, width, height, title, items, color, bg) {
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, width, height, 4, 4, "FD");

  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, width, 13, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + 5, y + 8.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(35, 45, 48);
  
  const visibleItems = items.length ? items : ["Sin información registrada."];
  let itemY = y + 20;
  const maxY = y + height - 5;
  
  visibleItems.forEach(item => {
    if (itemY >= maxY) return;
  
    const lines = doc.splitTextToSize(`• ${item}`, width - 12);
  
    const availableLines = lines.filter((line, index) => {
      return itemY + index * 3.7 < maxY;
    });
  
    if (!availableLines.length) return;
  
    doc.text(availableLines, x + 5, itemY);
    itemY += availableLines.length * 3.7 + 1.8;
  });
}

function addPdfFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setDrawColor(36, 133, 92);
    doc.setLineWidth(0.45);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 105, 108);

    doc.text(
      "Explora tu potencial: conócete y avanza · Servicio Andaluz de Empleo",
      14,
      pageHeight - 8
    );

    doc.text(
      `Página ${page} de ${pageCount}`,
      pageWidth - 38,
      pageHeight - 8
    );
  }
}

async function savePdf() {
  const doc = await createPdfDocument();
  doc.save("informe-explora-tu-potencial.pdf");
}

async function sharePdf() {
  const doc = await createPdfDocument();
  const blob = doc.output("blob");
  const file = new File([blob], "informe-explora-tu-potencial.pdf", { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Informe Explora tu potencial: conócete y avanza",
        text: "Te envío el informe de Explora tu potencial: conócete y avanza.",
        files: [file]
      });
      return;
    } catch (error) {
      console.warn("No se completó la acción de compartir.", error);
    }
  }

  doc.save("informe-explora-tu-potencial.pdf");
  alert("Tu navegador no permite compartir el PDF directamente. Se ha descargado para que puedas enviarlo manualmente.");
}

function addWrappedText(doc, text, x, y, width, lineHeight = 6) {
  const lines = doc.splitTextToSize(String(text || ""), width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensureSpace(doc, y, needed, pageHeight, margin) {
  if (y + needed > pageHeight - margin) {
    doc.addPage();
    return margin;
  }

  return y;
}
function ensureMinimumTotalQuestions(groupedItems, allQuestions, minimumTotal) {
  let total = getTotalSelectedQuestions(groupedItems);

  if (total >= minimumTotal) {
    return;
  }

  const allGrouped = groupByType(allQuestions);

  while (total < minimumTotal) {
    const expandableTypes = SECTION_ORDER.filter(type => {
      const selected = groupedItems[type] || [];
      const available = allGrouped[type] || [];
      return selected.length < 3 && selected.length < available.length;
    });

    if (expandableTypes.length === 0) {
      break;
    }

    const randomType = expandableTypes[Math.floor(Math.random() * expandableTypes.length)];
    const selected = groupedItems[randomType] || [];
    const available = allGrouped[randomType] || [];

    const remainingQuestions = available.filter(question => !selected.includes(question));
    const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];

    groupedItems[randomType].push(randomQuestion);
    groupedItems[randomType] = shuffleArray(groupedItems[randomType]);

    total = getTotalSelectedQuestions(groupedItems);
  }
}

function getTotalSelectedQuestions(groupedItems) {
  return SECTION_ORDER.reduce((sum, type) => {
    return sum + (groupedItems[type] || []).length;
  }, 0);
}

function drawLongIntroTitlePdf(doc, text, x, y, width, color) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.2);
  doc.setTextColor(color[0], color[1], color[2]);

  const lines = doc.splitTextToSize(String(text || ""), width);

  // Forzamos como máximo dos líneas para que no se corte ni invada demasiado espacio.
  const visibleLines = lines.slice(0, 2);

  visibleLines.forEach((line, index) => {
    if (index === visibleLines.length - 1) {
      doc.text(line, x, y + index * 6);
    } else {
      drawJustifiedLinePdf(doc, line, x, y + index * 6, width);
    }
  });

  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.8);
  doc.line(x, y + visibleLines.length * 6 + 1.5, x + 48, y + visibleLines.length * 6 + 1.5);

  return y + visibleLines.length * 6 + 7;
}

function drawJustifiedLinePdf(doc, text, x, y, width) {
  const words = String(text || "").trim().split(/\s+/);

  if (words.length <= 1) {
    doc.text(text, x, y);
    return;
  }

  const wordsWidth = words.reduce((sum, word) => sum + doc.getTextWidth(word), 0);
  const spaceWidth = (width - wordsWidth) / (words.length - 1);

  let cursorX = x;

  words.forEach((word, index) => {
    doc.text(word, cursorX, y);
    cursorX += doc.getTextWidth(word);

    if (index < words.length - 1) {
      cursorX += spaceWidth;
    }
  });
}
