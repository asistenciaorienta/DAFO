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

  nameModal.classList.remove("hidden");
  setTimeout(() => userNameInput.focus(), 50);
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
  const box = document.querySelector("#introSubtitle");

  if (!box || !introAudio) {
    return;
  }

  stopIntroSubtitles();
  box.classList.remove("hidden");

  introSubtitleTimer = setInterval(() => {
    const subtitleOffset = 0.4;
    const currentTime = introAudio.currentTime + subtitleOffset;
    const cue = introCues.find(item => currentTime >= item.start && currentTime <= item.end);

    box.textContent = cue ? cue.text : "";
    box.classList.toggle("hidden", !cue);
  }, 100);

  introAudio.addEventListener("ended", () => {
    stopIntroSubtitles();
    startBtn.textContent = "Entrar ›";
  }, { once: true });
}

function stopIntroSubtitles() {
  const box = document.querySelector("#introSubtitle");

  if (introSubtitleTimer) {
    clearInterval(introSubtitleTimer);
    introSubtitleTimer = null;
  }

  if (box) {
    box.textContent = "";
    box.classList.add("hidden");
  }
}

async function startApp() {
  try {
    const response = await fetch("preguntas.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar preguntas.json");
    }

    questions = await response.json();
    groupedQuestions = groupByType(questions);
    groupedQuestions = selectRandomQuestionsByType(groupedQuestions, 2, 3);
    ensureMinimumTotalQuestions(groupedQuestions, questions, 10);

    intro.classList.add("hidden");
    app.classList.remove("hidden");
    result.classList.add("hidden");

    setScreenMode("app");
    renderCurrentStep();
  } catch (error) {
    alert("Error cargando preguntas.json. Revisa que esté en la misma carpeta que index.html.");
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

  document.querySelector("#sectionPill").textContent = `Bloque ${sectionIndex + 1} de 4`;
  document.querySelector("#sectionTitle").textContent = pluralTitle(type);
  document.querySelector("#questionText").textContent = personalizeText(currentQuestion.pregunta);
  document.querySelector("#answerInput").value = "";

  continueBtn.disabled = true;

  renderOptions(currentQuestion.opciones || []);

  if (currentVideoType !== type) {
    currentVideoType = type;
    renderVideo("#videoContainer", SECTION_VIDEOS[type], "Ver vídeo para contituar", type);
  }

  const card = document.querySelector("#questionCard");

  if (watchedVideoTypes.has(type)) {
    card.classList.remove("waiting-video");
  } else {
    card.classList.add("waiting-video");
  }

  updateProgress();
}

function pluralTitle(type) {
  return {
    Debilidad: "Debilidades",
    Amenaza: "Amenazas",
    Fortaleza: "Fortalezas",
    Oportunidad: "Oportunidades"
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

  layer.addEventListener("click", async () => {
    layer.remove();
    video.setAttribute("controls", "controls");

    try {
      await video.play();
    } catch (error) {
      console.warn("El navegador no permitió reproducir el vídeo.", error);
    }
  });

  video.addEventListener("ended", () => {
    if (type) {
      watchedVideoTypes.add(type);
    }

    const card = document.querySelector("#questionCard");

    if (card) {
      card.classList.remove("waiting-video");
    }
  });

  video.addEventListener("play", () => {
    const card = document.querySelector("#questionCard");

    if (!card) {
      return;
    }

    if (type && !watchedVideoTypes.has(type)) {
      card.classList.add("waiting-video");
    } else {
      card.classList.remove("waiting-video");
    }
  });
}

function renderOptions(options) {
  const optionsList = document.querySelector("#optionsList");
  optionsList.innerHTML = "";

  if (!Array.isArray(options) || options.length === 0) {
    optionsList.innerHTML = `<p class="help-text">No hay opciones definidas para esta pregunta.</p>`;
    return;
  }

  options.forEach((optionText, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "option-button";
    button.innerHTML = `
      <span class="option-number">${index + 1}</span>
      <span>${escapeHtml(personalizeText(optionText))}</span>
    `;

    button.addEventListener("click", () => selectOption(index));
    optionsList.appendChild(button);
  });
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
  if (selectedOptionIndex === null) {
    alert("Elige una opción para continuar.");
    return;
  }

  answers.push(buildAnswerFromCurrentSelection());
  goNext();
}

function buildAnswerFromCurrentSelection() {
  const options = Array.isArray(currentQuestion.opciones) ? currentQuestion.opciones : [];
  const adequate = Number(selectedOptionIndex) === Number(currentQuestion.respuesta_adecuada);

  return {
    tipo: currentQuestion.tipo,
    pregunta: personalizeText(currentQuestion.pregunta),
    respuestaUsuario: personalizeText(options[selectedOptionIndex] || ""),
    respuestaUsuarioIndice: selectedOptionIndex,
    respuestaAdecuada: personalizeText(options[Number(currentQuestion.respuesta_adecuada)] || ""),
    respuestaAdecuadaIndice: Number(currentQuestion.respuesta_adecuada),
    correcta: adequate,
    feedback: getFeedbackForSelectedOption(currentQuestion, selectedOptionIndex)
  };
}

function getFeedbackForSelectedOption(question, selectedIndex) {
  if (Array.isArray(question.feedback)) {
    return personalizeText(question.feedback[selectedIndex] || "Revisa este apartado con más profundidad.");
  }

  return personalizeText(question.feedback || "Revisa este apartado con más profundidad.");
}

function goNext() {
  questionIndex++;

  const type = SECTION_ORDER[sectionIndex];
  const sectionQuestions = groupedQuestions[type] || [];

  if (questionIndex >= sectionQuestions.length) {
    sectionIndex++;
    questionIndex = 0;
  }

  if (sectionIndex >= SECTION_ORDER.length) {
    showResult();
  } else {
    renderCurrentStep();
  }
}

function updateProgress() {
  const totalQuestions = SECTION_ORDER.reduce((sum, type) => {
    return sum + (groupedQuestions[type] || []).length;
  }, 0);

  const completed = answers.length;
  const percent = totalQuestions ? Math.round((completed / totalQuestions) * 100) : 0;

  document.querySelector("#progressBar").style.width = `${percent}%`;
  document.querySelector("#progressPercent").textContent = `${percent}%`;
  document.querySelector("#progressText").textContent = `Pregunta ${Math.min(completed + 1, totalQuestions)} de ${totalQuestions}`;
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
  const number = Number(String(key).split("feedback_").join(""));

  renderVideo("#summaryVideoContainer", SUMMARY_VIDEOS[key], "Ver resumen", null);

  document.querySelector("#resultUserName").textContent = userName ? `Informe de ${userName}` : "";
  document.querySelector("#resultText").textContent =
    `Has terminado la ruta. Ahora verás un vídeo de resumen adaptado a tus respuestas. Vídeo de feedback ${number}.`;

  document.querySelector("#answersList").innerHTML = answers.map(answer => `
    <article class="answer-item">
      <strong>${escapeHtml(answer.tipo)}</strong>
      <p><b>Pregunta:</b> ${escapeHtml(answer.pregunta)}</p>
      <p><b>Tu respuesta:</b> ${escapeHtml(answer.respuestaUsuario)}</p>
    </article>
  `).join("");
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

function createPdfDocument() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;

  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Informe Ruta DAFO", margin, y);
  y += 10;

  if (userName) {
    doc.setFontSize(13);
    doc.text(`Nombre: ${userName}`, margin, y);
    y += 9;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = addWrappedText(
    doc,
    "Este informe recoge tus respuestas y recomendaciones para seguir trabajando tu objetivo profesional.",
    margin,
    y,
    usableWidth
  ) + 8;

  SECTION_ORDER.forEach(type => {
    y = ensureSpace(doc, y, 30, pageHeight, margin);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(pluralTitle(type), margin, y);
    y += 8;

    answers
      .filter(answer => answer.tipo === type)
      .forEach((answer, index) => {
        y = ensureSpace(doc, y, 50, pageHeight, margin);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        y = addWrappedText(doc, `${index + 1}. ${answer.pregunta}`, margin, y, usableWidth);

        doc.setFont("helvetica", "normal");
        y = addWrappedText(doc, `Tu respuesta: ${answer.respuestaUsuario}`, margin, y + 2, usableWidth);
        y = addWrappedText(doc, `Recomendación: ${answer.feedback}`, margin, y + 2, usableWidth);
        y += 6;
      });
  });

  return doc;
}

function savePdf() {
  const doc = createPdfDocument();
  doc.save("informe-ruta-dafo.pdf");
}

async function sharePdf() {
  const doc = createPdfDocument();
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

function addWrappedText(doc, text, x, y, width) {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * 6;
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
