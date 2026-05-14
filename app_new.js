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

const BLOCK_TRANSITION_MESSAGES = {
  Fortaleza: {
    texto: "Reconocer lo que haces bien también forma parte de prepararte mejor. Ayuda a legitimar el autorreconocimiento sin arrogancia.",
    audio: "transiciones/fortaleza.mp3",
    subtitulos: "transiciones/fortaleza.vtt"
  },
  Amenaza: {
    texto: "Identificar obstáculos te permite diseñar una respuesta más sólida y realista para tu objetivo profesional. Anticipar lo que puede frenarte te ayuda a prepararte mejor.",
    audio: "transiciones/amenaza.mp3",
    subtitulos: "transiciones/amenaza.vtt"
  },
  Debilidad: {
    texto: "Detectar un área de mejora es el primer paso para poder cambiarla. Muy importante porque evita sensación de juicio.",
    audio: "transiciones/debilidad.mp3",
    subtitulos: "transiciones/debilidad.vtt"
  }
};

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
    return;
  }

  qrSmallBtn.classList.add("hidden");
  qrModal.classList.add("hidden");
  exitBtn.classList.remove("hidden");
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

async function handleStartButton() {
  if (!introAudioStarted) {
    introAudioStarted = true;
    introAudio = new Audio("inicio.mp3");
    introAudio.preload = "auto";
    startBtn.textContent = "Entrar ›";

    await loadIntroSubtitles();

    try {
      introAudio.addEventListener("playing", startIntroSubtitles, { once: true });
      await introAudio.play();
    } catch (error) {
      console.warn("No se pudo reproducir inicio.mp3.", error);
    }

    return;
  }

  stopIntroSubtitles();

  if (introAudio) {
    introAudio.pause();
    introAudio.currentTime = 0;
  }

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
    await nameAudio.play();
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
    Queremos que sigan siendo 3 elementos en el bloque:
    - Quitamos una pregunta normal.
    - Añadimos la reflexión.
    - Mezclamos el orden.
  */
  const normalQuestions = currentBlockQuestions.filter(item => !item.esReflexion);

  if (normalQuestions.length >= 3) {
    normalQuestions.pop();
  }

  groupedItems[selectedBlock] = shuffleArray([...normalQuestions, reflectionQuestion]);
  reflectionQuestionInserted = true;
}

function insertBlockTransitionQuestions(groupedItems) {
  SECTION_ORDER.forEach(type => {
    const transitionMessage = BLOCK_TRANSITION_MESSAGES[type];

    if (!transitionMessage) return;
    if (!Array.isArray(groupedItems[type])) return;

    groupedItems[type].push({
      tipo: type,
      esTransicionBloque: true,
      pregunta: transitionMessage.texto || "",
      texto_boton: "Continuar",
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

  document.querySelector("#sectionTitle").textContent = pluralTitle(type);
  document.querySelector("#answerInput").value = "";
  
  if (currentQuestion.esTransicionBloque) {
    renderBlockTransitionQuestion(currentQuestion);
  } else if (currentQuestion.esReflexion) {
    renderReflectionQuestion(currentQuestion);
  } else {
    document.querySelector("#questionText").textContent = personalizeText(currentQuestion.pregunta);
    continueBtn.textContent = "Continuar";
    continueBtn.disabled = true;
    
    renderOptions(currentQuestion);
    
    // Oculta siempre las opciones en preguntas normales
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
  }

  const card = document.querySelector("#questionCard");

  if (watchedVideoTypes.has(type)) {
    card.classList.remove("waiting-video");
  } else {
    card.classList.add("waiting-video");
  }

  updateProgress();
  if (watchedVideoTypes.has(type)) {
    showOptionsImmediate();
  }
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

  if (!activityGrid || !card) return;

  activityGrid.classList.add("video-focus");
  card.classList.add("pre-reveal");
  card.classList.remove("reveal");
}

function showQuestionsLayoutImmediate() {
  const activityGrid = document.querySelector(".activity-grid");
  const card = document.querySelector("#questionCard");

  if (!activityGrid || !card) return;

  activityGrid.classList.remove("video-focus");
  card.classList.remove("pre-reveal");
  card.classList.add("reveal");

  showOptionsImmediate();
}

function revealQuestionsAfterVideo() {
  const activityGrid = document.querySelector(".activity-grid");
  const videoPanel = document.querySelector("#videoContainer");
  const card = document.querySelector("#questionCard");

  if (!activityGrid || !videoPanel || !card) {
    showQuestionsLayoutImmediate();
    return;
  }

  const firstRect = videoPanel.getBoundingClientRect();

  activityGrid.classList.remove("video-focus");

  const lastRect = videoPanel.getBoundingClientRect();

  const deltaX = firstRect.left - lastRect.left;
  const deltaY = firstRect.top - lastRect.top;
  const scaleX = firstRect.width / lastRect.width;
  const scaleY = firstRect.height / lastRect.height;

  videoPanel.style.transformOrigin = "top left";
  videoPanel.style.transition = "none";
  videoPanel.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;

  card.classList.add("pre-reveal");
  card.classList.remove("reveal");

  requestAnimationFrame(() => {
    videoPanel.style.transition = "transform .78s cubic-bezier(.22, 1, .36, 1)";
    videoPanel.style.transform = "translate(0, 0) scale(1)";

    setTimeout(() => {
      card.classList.remove("pre-reveal");
      card.classList.add("reveal");
    
      hideOptionsTemporarily();
      showOptionsAfterDelay(3000);
    }, 260);
  });

  videoPanel.addEventListener("transitionend", () => {
    videoPanel.style.transition = "";
    videoPanel.style.transform = "";
    videoPanel.style.transformOrigin = "";
  }, { once: true });
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
    await transitionQuestionAudio.play();
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
      pdfFeedback: "No se ha podido registrar correctamente la valoración para el informe."
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
    pdfFeedback: getPdfFeedbackForSelectedOption(currentQuestion, originalIndex)
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

function getPdfFeedbackForSelectedOption(question, selectedIndex) {
  if (Array.isArray(question.pdf)) {
    return personalizeText(question.pdf[selectedIndex] || "");
  }

  return "";
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

  const title = userName
    ? `${userName}, esta es tu valoración DAFO`
    : "Esta es tu valoración DAFO";

  let y = 16;

  // Fondo suave superior
  // Cabecera
  doc.setFillColor(7, 131, 138);
  doc.rect(0, 0, pageWidth, 48, "F");
  
  // Logo proyecto
  if (projectLogo) {
    addImageKeepingRatio(doc, projectLogo, margin, 8, 22, 22);
  }
  
  // Logo SAE / Junta
  if (saeLogo) {
    addImageKeepingRatio(doc, saeLogo, pageWidth - margin - 52, 10, 52, 22);
  }
  
  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  
  const titleX = margin + 28;
  const titleWidth = pageWidth - titleX - margin - 54;
  
  y = addWrappedText(doc, title, titleX, 15, titleWidth, 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  
  y = addWrappedText(
    doc,
    "Valoración personalizada de la Ruta DAFO para seguir avanzando profesionalmente.",
    titleX,
    y + 1,
    titleWidth,
    5
  );

  y = 55; /*60*/

  // Bloque reflexión
  y = drawSectionTitle(doc, "Una reflexión para seguir avanzando", margin, y);
  y += 2;

  y = drawSoftBox(doc, margin, y, usableWidth, () => {
    let innerY = y + 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 56, 61);
    innerY = addWrappedText(
      doc,
      personalizeText(feedbackInfo.titulo || "Tu reflexión final"),
      margin + 6,
      innerY,
      usableWidth - 12,
      6
    );

    innerY += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(45, 62, 66);
    innerY = addWrappedText(
      doc,
      personalizeText(feedbackInfo.resumen || "Aquí aparecerá la valoración asociada a tu resultado final."),
      margin + 6,
      innerY,
      usableWidth - 12,
      5
    );

    innerY += 3;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 56, 61);
    doc.text("A tener en cuenta:", margin + 6, innerY);
    innerY += 5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 62, 66);
    innerY = addWrappedText(
      doc,
      personalizeText(feedbackInfo.reflexion || feedbackInfo.recomendacion || ""),
      margin + 6,
      innerY,
      usableWidth - 12,
      5
    );

    return innerY + 4;
  });

  y += 7;

  // Matriz DAFO
  y = ensureSpace(doc, y, 90, pageHeight, margin);
  y = drawSectionTitle(doc, "Sobre tu matriz DAFO", margin, y);
  y += 4;

  y = drawDafoMatrixPdf(doc, margin, y, usableWidth);
  
  y = ensureSpace(doc, y, 18, pageHeight, margin);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(7, 108, 116);
  doc.text("Servicio Andaluz de Empleo. Contigo, creciendo profesionalmente.", margin, y);
  
  y += 14;

  // Detalle de respuestas
  y = ensureSpace(doc, y, 50, pageHeight, margin);
  y = drawSectionTitle(doc, "Tus respuestas", margin, y);
  y += 4;

  SECTION_ORDER.forEach(type => {
    const typeAnswers = answers.filter(answer => answer.tipo === type);

    if (!typeAnswers.length) return;

    y = ensureSpace(doc, y, 22, pageHeight, margin);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(7, 108, 116);
    doc.text(pluralTitle(type), margin, y);
    y += 7;

    typeAnswers.forEach((answer, index) => {
      y = ensureSpace(doc, y, 46, pageHeight, margin);

      doc.setFillColor(245, 248, 248);
      doc.roundedRect(margin, y - 4, usableWidth, 38, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(20, 56, 61);
      y = addWrappedText(
        doc,
        `${index + 1}. ${answer.pregunta}`,
        margin + 5,
        y + 2,
        usableWidth - 10,
        5
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(45, 62, 66);

      y = addWrappedText(
        doc,
        `Tu respuesta: ${answer.respuestaUsuario}`,
        margin + 5,
        y + 1,
        usableWidth - 10,
        5
      );

      y += 8;
    });
  });

  // DAFO de empleabilidad
  y = ensureSpace(doc, y, 80, pageHeight, margin);
  y = drawSectionTitle(doc, "DAFO de empleabilidad", margin, y);
  y += 4;
  
  y = drawEmployabilityDafoPdf(doc, margin, y, usableWidth, pageHeight);
  
  // Pie
  addPdfFooter(doc);
  
  return doc;
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
      type: "Debilidad",
      title: "LO QUE PUEDES REFORZAR",
      color: [87, 211, 0]
    },
    {
      type: "Amenaza",
      title: "LO QUE PUEDE FRENARTE",
      color: [66, 161, 242]
    },
    {
      type: "Fortaleza",
      title: "LO QUE HOY TE IMPULSA",
      color: [244, 196, 0]
    },
    {
      type: "Oportunidad",
      title: "LO QUE PODRÍAS APROVECHAR",
      color: [176, 122, 230]
    }
  ];

  const boxData = boxes.map(box => {
    const items = answers
      .filter(answer => answer.tipo === box.type)
      .map(answer => answer.feedback);

    const height = calculateDafoBoxHeightPdf(doc, boxWidth, items);

    return {
      ...box,
      items,
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
    boxData[0].color
  );

  drawDafoBoxPdf(
    doc,
    x + boxWidth + gap,
    y,
    boxWidth,
    row1Height,
    boxData[1].title,
    boxData[1].items,
    boxData[1].color
  );

  drawDafoBoxPdf(
    doc,
    x,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[2].title,
    boxData[2].items,
    boxData[2].color
  );

  drawDafoBoxPdf(
    doc,
    x + boxWidth + gap,
    y + row1Height + gap,
    boxWidth,
    row2Height,
    boxData[3].title,
    boxData[3].items,
    boxData[3].color
  );

  return y + row1Height + row2Height + gap + 8;
}

function calculateDafoBoxHeightPdf(doc, width, items) {
  const visibleItems = items.length ? items : ["Sin reflexiones registradas."];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);

  let textHeight = 0;

  visibleItems.slice(0, 3).forEach(item => {
    const lines = doc.splitTextToSize(`• ${item}`, width - 10);
    const availableLines = lines.slice(0, 4);
    textHeight += availableLines.length * 3.7 + 2;
  });

  const titleArea = 19;
  const bottomPadding = 6;
  const minHeight = 44;

  return Math.max(minHeight, titleArea + textHeight + bottomPadding);
}

function drawDafoBoxPdf(doc, x, y, width, height, title, items, color) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, width, height, 5, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + 5, y + 8.5);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  doc.line(x + 5, y + 11.5, x + width - 5, y + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(20, 35, 38);

  const visibleItems = items.length ? items : ["Sin reflexiones registradas."];
  let itemY = y + 18;
  const maxY = y + height - 5;

  visibleItems.slice(0, 3).forEach(item => {
    if (itemY >= maxY) return;

    const lines = doc.splitTextToSize(`• ${item}`, width - 10);
    const availableLines = lines.slice(0, 4);

    doc.text(availableLines, x + 5, itemY);
    itemY += availableLines.length * 3.7 + 2;
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

  const boxData = boxes.map(box => {
    const items = answers
      .filter(answer => answer.tipo === box.type)
      .map(answer => answer.pdfFeedback || "")
      .filter(Boolean);

    const height = calculateEmployabilityDafoBoxHeightPdf(doc, boxWidth, items);

    return {
      ...box,
      items,
      height
    };
  });

  const row1Height = Math.max(boxData[0].height, boxData[1].height);
  const row2Height = Math.max(boxData[2].height, boxData[3].height);

  y = ensureSpace(doc, y, row1Height + row2Height + gap + 12, pageHeight, 14);

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
  doc.setFontSize(7.4);

  let textHeight = 0;

  visibleItems.slice(0, 3).forEach(item => {
    const lines = doc.splitTextToSize(`• ${item}`, width - 12);
    textHeight += lines.length * 3.6 + 2;
  });

  const titleArea = 15;
  const bottomPadding = 7;
  const minHeight = 48;

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
  doc.setFontSize(9.4);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + 5, y + 8.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(35, 45, 48);

  const visibleItems = items.length ? items : ["Sin información registrada."];
  let itemY = y + 20;
  const maxY = y + height - 5;

  visibleItems.slice(0, 3).forEach(item => {
    if (itemY >= maxY) return;

    const lines = doc.splitTextToSize(`• ${item}`, width - 12);
    doc.text(lines, x + 5, itemY);
    itemY += lines.length * 3.6 + 2;
  });
}

function addPdfFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setDrawColor(7, 131, 138);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 105, 108);
    doc.text("Ruta DAFO: conócete y avanza · Servicio Andaluz de Empleo", 14, pageHeight - 8);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - 38, pageHeight - 8);
  }
}

async function savePdf() {
  const doc = await createPdfDocument();
  doc.save("informe-ruta-dafo.pdf");
}

async function sharePdf() {
  const doc = await createPdfDocument();
  const blob = doc.output("blob");
  const file = new File([blob], "informe-ruta-dafo.pdf", { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Informe Ruta DAFO",
        text: "Te envío mi informe de Ruta DAFO.",
        files: [file]
      });
      return;
    } catch (error) {
      console.warn("No se completó la acción de compartir.", error);
    }
  }

  doc.save("informe-ruta-dafo.pdf");
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
