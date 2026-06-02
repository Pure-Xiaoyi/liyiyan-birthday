const pages = Array.from(document.querySelectorAll(".page"));
const phoneFrame = document.querySelector("#phonePaper");
const pageStack = [];
const backButton = document.querySelector("#backButton");
const openButton = document.querySelector("#openButton");
const peopleStage = document.querySelector("#peopleStage");
const girlDrag = document.querySelector("#girlDrag");
const sparklerButton = document.querySelector("#sparklerButton");
const finalPage = document.querySelector(".final-page");
const finalSparksCanvas = document.querySelector("#finalSparks");
const finalSparksContext = finalSparksCanvas.getContext("2d");
const musicToggle = document.querySelector("#musicToggle");
const bgm = document.querySelector("#bgm");

let currentPage = "0";
let musicTouched = true;
let musicWanted = false;
let dragging = false;
let dragStartX = 0;
let dragStartLeft = 0;
let isPageLocked = false;
let isActionLocked = false;
let finalTimer = null;
let finalAnimationFrame = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion ? Math.min(ms, 80) : ms));

function markPageEntered(page) {
  page.classList.remove("is-leaving", "is-entering");
  page.classList.add("is-entering");
  window.setTimeout(() => page.classList.remove("is-entering"), prefersReducedMotion ? 90 : 900);
}

function setActivePage(index) {
  currentPage = String(index);
  pages.forEach((page) => {
    const isActive = page.dataset.page === currentPage;
    page.classList.toggle("is-active", isActive);
    if (!isActive) {
      page.classList.remove("is-entering", "is-leaving", "is-action-out");
    }
  });
  backButton.classList.toggle("is-visible", currentPage !== "0");
  markPageEntered(document.querySelector(`.page[data-page="${currentPage}"]`));
}

async function showPage(index, { push = true } = {}) {
  const nextPage = String(index);
  if (isPageLocked || nextPage === currentPage) return false;

  isPageLocked = true;
  phoneFrame.classList.add("is-transitioning");

  const leavingPage = document.querySelector(`.page[data-page="${currentPage}"]`);
  if (push) {
    pageStack.push(currentPage);
  }

  leavingPage?.classList.add("is-leaving");
  await wait(260);
  resetPage(nextPage);
  setActivePage(nextPage);
  await wait(520);

  phoneFrame.classList.remove("is-transitioning");
  isPageLocked = false;
  return true;
}

function resetPage(index) {
  if (String(index) === "3") {
    peopleStage.classList.remove("is-bumped", "is-success");
    girlDrag.style.left = "";
    girlDrag.style.right = "";
    girlDrag.style.transform = "";
  }

  if (String(index) === "5") {
    finalPage.classList.remove("is-sparking", "is-final-message");
    clearFinalCanvas();
    sparklerButton.removeAttribute("disabled");
    if (finalTimer) {
      window.clearTimeout(finalTimer);
      finalTimer = null;
    }
    if (finalAnimationFrame) {
      window.cancelAnimationFrame(finalAnimationFrame);
      finalAnimationFrame = null;
    }
  }
}

async function tryPlayMusic() {
  musicTouched = true;
  musicWanted = true;
  musicToggle.setAttribute("aria-pressed", "true");

  try {
    await bgm.play();
  } catch {
    musicToggle.setAttribute("aria-pressed", "false");
  }
}

openButton.addEventListener("click", async () => {
  if (isPageLocked || isActionLocked) return;
  isActionLocked = true;
  if (musicWanted && bgm.paused) {
    tryPlayMusic();
  }

  document.querySelector(".opening-stage")?.classList.add("is-opening-out");
  await wait(420);
  document.querySelector(".opening-stage")?.classList.remove("is-opening-out");
  isActionLocked = false;
  await showPage("1");
  openButton.blur();
});

async function handleNextTrigger(trigger) {
  if (!trigger || trigger === openButton || isPageLocked || isActionLocked) return;
  isActionLocked = true;

  const next = trigger.dataset.next;
  const activePage = document.querySelector(`.page[data-page="${currentPage}"]`);

  if (trigger.classList.contains("swallow-button")) {
    activePage.classList.add("is-action-out");
    trigger.classList.add("is-flying");
    await wait(1080);
    trigger.classList.remove("is-flying");
    activePage.classList.remove("is-action-out");
  }

  if (trigger.classList.contains("rainbow-button")) {
    trigger.classList.add("is-blooming");
    await wait(980);
    trigger.classList.remove("is-blooming");
  }

  if (trigger.classList.contains("qgirl-button")) {
    activePage.classList.add("is-wish-bright");
    trigger.classList.add("is-celebrating");
    await wait(940);
    trigger.classList.remove("is-celebrating");
    activePage.classList.remove("is-wish-bright");
  }

  isActionLocked = false;
  await showPage(next);
  trigger.blur();
}

document.querySelectorAll("[data-next]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    if (musicWanted && bgm.paused) {
      tryPlayMusic();
    }
    handleNextTrigger(trigger);
  });
});

document.addEventListener("click", async (event) => {
  if (musicWanted && bgm.paused) {
    tryPlayMusic();
  }

  const trigger = event.target.closest("[data-next]");
  if (!trigger) return;
  handleNextTrigger(trigger);
});

backButton.addEventListener("click", async () => {
  if (isPageLocked) return;
  const previous = pageStack.pop();
  if (previous === undefined) return;

  resetPage(currentPage);
  await showPage(previous, { push: false });
  backButton.blur();
});

function sizeFinalCanvas() {
  const rect = finalPage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  finalSparksCanvas.width = Math.round(rect.width * dpr);
  finalSparksCanvas.height = Math.round(rect.height * dpr);
  finalSparksCanvas.style.width = `${rect.width}px`;
  finalSparksCanvas.style.height = `${rect.height}px`;
  finalSparksContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  return rect;
}

function clearFinalCanvas() {
  const rect = finalSparksCanvas.getBoundingClientRect();
  finalSparksContext.clearRect(0, 0, rect.width, rect.height);
}

function getSparkOrigin(pageRect) {
  const sparklerRect = sparklerButton.getBoundingClientRect();
  return {
    x: sparklerRect.left - pageRect.left + sparklerRect.width * .5,
    y: sparklerRect.top - pageRect.top + sparklerRect.height * .22
  };
}

function runFinalSparks() {
  const pageRect = sizeFinalCanvas();
  const origin = getSparkOrigin(pageRect);
  const colors = ["#d9a66a", "#f4d99a", "#fff4d6", "#c98e4f"];
  const count = prefersReducedMotion ? 12 : 30;
  const duration = prefersReducedMotion ? 360 : 1900;
  const particles = Array.from({ length: count }, () => {
    const angle = (-165 + Math.random() * 150) * Math.PI / 180;
    const speed = 46 + Math.random() * 84;
    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 32,
      size: 2.2 + Math.random() * 4.8,
      life: .72 + Math.random() * .28,
      delay: Math.random() * 220,
      color: colors[Math.floor(Math.random() * colors.length)],
      drift: (Math.random() - .5) * 12
    };
  });

  const startedAt = performance.now();

  return new Promise((resolve) => {
    function draw(now) {
      const elapsed = now - startedAt;
      clearFinalCanvas();

      particles.forEach((particle) => {
        const local = elapsed - particle.delay;
        if (local <= 0) return;

        const t = Math.min(local / duration / particle.life, 1);
        if (t >= 1) return;

        const ease = 1 - Math.pow(1 - t, 2);
        const x = particle.x + particle.vx * ease * 1.52 + particle.drift * Math.sin(t * Math.PI);
        const y = particle.y + particle.vy * ease * 1.52 + 38 * t * t;
        const alpha = Math.sin((1 - t) * Math.PI / 2) * .92;

        finalSparksContext.save();
        finalSparksContext.globalAlpha = alpha;
        finalSparksContext.fillStyle = particle.color;
        finalSparksContext.shadowBlur = 12;
        finalSparksContext.shadowColor = "rgba(217, 166, 106, .36)";
        finalSparksContext.beginPath();
        finalSparksContext.arc(x, y, particle.size * (1 - t * .42), 0, Math.PI * 2);
        finalSparksContext.fill();
        finalSparksContext.restore();
      });

      if (elapsed < duration + 260) {
        finalAnimationFrame = window.requestAnimationFrame(draw);
      } else {
        clearFinalCanvas();
        finalAnimationFrame = null;
        resolve();
      }
    }

    finalAnimationFrame = window.requestAnimationFrame(draw);
  });
}

sparklerButton.addEventListener("click", async () => {
  if (finalPage.classList.contains("is-sparking") || finalPage.classList.contains("is-final-message")) return;

  finalPage.classList.add("is-sparking");
  sparklerButton.setAttribute("disabled", "");

  await runFinalSparks();
  finalPage.classList.remove("is-sparking");
  finalPage.classList.add("is-final-message");
  finalTimer = null;
  sparklerButton.blur();
});

function getStageLeft(el) {
  return el.getBoundingClientRect().left - peopleStage.getBoundingClientRect().left;
}

function startDrag(event) {
  if (currentPage !== "3" || peopleStage.classList.contains("is-bumped") || isPageLocked || isActionLocked) return;

  dragging = true;
  dragStartX = event.clientX;
  dragStartLeft = getStageLeft(girlDrag);
  girlDrag.style.right = "auto";
  girlDrag.setPointerCapture?.(event.pointerId);
}

function moveDrag(event) {
  if (!dragging) return;

  const stageWidth = peopleStage.clientWidth;
  const girlWidth = girlDrag.offsetWidth;
  const nextLeft = Math.max(stageWidth * .3, Math.min(stageWidth - girlWidth - 8, dragStartLeft + event.clientX - dragStartX));
  girlDrag.style.left = `${nextLeft}px`;
}

async function endDrag() {
  if (!dragging) return;
  dragging = false;

  const stageWidth = peopleStage.clientWidth;
  const girlCenter = getStageLeft(girlDrag) + girlDrag.offsetWidth / 2;
  const target = stageWidth * .52;

  if (Math.abs(girlCenter - target) < stageWidth * .26) {
    peopleStage.classList.add("is-bumped", "is-success");
    await wait(1450);
    await showPage("4");
  } else {
    girlDrag.classList.add("is-returning");
    girlDrag.style.left = "";
    girlDrag.style.right = "";
    window.setTimeout(() => girlDrag.classList.remove("is-returning"), prefersReducedMotion ? 90 : 420);
  }
}

girlDrag.addEventListener("pointerdown", startDrag);
window.addEventListener("pointermove", moveDrag, { passive: true });
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);

musicToggle.addEventListener("click", () => {
  if (!musicTouched || bgm.paused) {
    tryPlayMusic();
    return;
  }

  musicWanted = false;
  bgm.pause();
  musicToggle.setAttribute("aria-pressed", "false");
});

bgm.addEventListener("error", () => {
  musicToggle.setAttribute("aria-pressed", "false");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && musicWanted && musicTouched && bgm.paused) {
    tryPlayMusic();
  }
});

markPageEntered(document.querySelector(".page.is-active"));
tryPlayMusic();
