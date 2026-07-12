const pages = Array.from(document.querySelectorAll(".editorial-page"));
const letterFrame = document.querySelector("#letterFrame");
const backButton = document.querySelector("#backButton");
const openButton = document.querySelector("#openButton");
const swallowAction = document.querySelector("#swallowAction");
const colorAction = document.querySelector("#colorAction");
const rainbowImage = colorAction.querySelector(":scope > img");
const rainbowGlows = Array.from(colorAction.querySelectorAll(".rainbow-glow"));
const relationshipScene = document.querySelector("#relationshipScene");
const girlDrag = document.querySelector("#girlDrag");
const blessingField = document.querySelector("#blessingField");
const blessingWords = Array.from(document.querySelectorAll(".blessing-word"));
const qgirlReceiver = document.querySelector("#qgirlReceiver");
const finalPage = document.querySelector(".final-page");
const finaleTrigger = document.querySelector("#finaleTrigger");
const finaleCanvas = document.querySelector("#finaleCanvas");
const finaleContext = finaleCanvas.getContext("2d");
const musicToggle = document.querySelector("#musicToggle");
const bgm = document.querySelector("#bgm");
const {
  createBlessingScatter,
  createHeartLayout,
} = window.BirthdayGeometry;

const pageStack = [];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion ? Math.min(ms, 80) : ms));

let currentPage = 0;
let transitionLocked = false;
let dragging = false;
let pointerMoved = false;
let dragStartX = 0;
let dragStartLeft = 0;
let currentDragProgress = 0;
let musicTouched = false;
let musicWanted = false;
let audioFadeToken = 0;
let finaleFrame = null;

function markPageEntered(page) {
  page.classList.remove("is-entering", "is-leaving");
  page.classList.add("is-entering");
  window.setTimeout(() => page.classList.remove("is-entering"), prefersReducedMotion ? 90 : 1500);
}

function resetPage(index) {
  if (index === 2) {
    pages[2].classList.remove("is-bloomed");
    gsap.killTweensOf([rainbowImage, ...rainbowGlows]);
    gsap.set(rainbowImage, { clearProps: "transform,filter" });
    gsap.set(rainbowGlows, { opacity: 0, scale: 0.55, clearProps: "filter" });
  }

  if (index === 3) {
    relationshipScene.classList.remove("is-dragging", "is-bumped");
    girlDrag.classList.remove("is-returning");
    girlDrag.style.left = "";
    girlDrag.style.right = "";
    setDragProgress(0);
  }

  if (index === 4) {
    pages[4].classList.remove("is-receiving");
    blessingField.classList.remove("is-bursting", "is-scattered", "is-converging", "is-heart");
    blessingWords.forEach((word) => word.style.transitionDelay = "");
    qgirlReceiver.removeAttribute("disabled");
  }

  if (index === 5) {
    finalPage.classList.remove("is-ignited", "is-final-message");
    finaleTrigger.removeAttribute("disabled");
    if (finaleFrame) {
      window.cancelAnimationFrame(finaleFrame);
      finaleFrame = null;
    }
    clearFinaleCanvas();
  }
}

async function setPage(index, { push = true, initial = false } = {}) {
  const nextIndex = Number(index);
  if (transitionLocked || (!initial && nextIndex === currentPage)) return false;

  const leavingPage = pages[currentPage];
  if (!initial) {
    transitionLocked = true;
    letterFrame.classList.add("is-transitioning");
    if (push) pageStack.push(currentPage);
    leavingPage.classList.add("is-leaving");
    await wait(360);
  }

  if (!initial) resetPage(nextIndex);
  currentPage = nextIndex;
  letterFrame.dataset.scene = String(nextIndex);
  document.body.dataset.scene = String(nextIndex);

  pages.forEach((page, pageIndex) => {
    const isActive = pageIndex === nextIndex;
    page.classList.toggle("is-active", isActive);
    page.setAttribute("aria-hidden", String(!isActive));
    page.inert = !isActive;
    if (!isActive) page.classList.remove("is-entering", "is-leaving");
  });

  backButton.classList.toggle("is-visible", nextIndex !== 0);
  markPageEntered(pages[nextIndex]);
  if (nextIndex === 4) {
    prepareBlessingBurst();
    window.requestAnimationFrame(() => runBlessingBurst());
  }

  if (!initial) {
    await wait(520);
    letterFrame.classList.remove("is-transitioning");
    transitionLocked = false;
  }
  return true;
}

function fadeAudio(target, duration = 850) {
  const token = ++audioFadeToken;
  const startVolume = bgm.volume;
  const safeTarget = Math.max(0, Math.min(1, target));
  const startedAt = performance.now();

  return new Promise((resolve) => {
    if (prefersReducedMotion || duration <= 0) {
      bgm.volume = safeTarget;
      resolve(true);
      return;
    }

    function step(now) {
      if (token !== audioFadeToken) {
        resolve(false);
        return;
      }
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      bgm.volume = startVolume + (safeTarget - startVolume) * eased;
      if (progress < 1) window.requestAnimationFrame(step);
      else resolve(true);
    }
    window.requestAnimationFrame(step);
  });
}

async function tryPlayMusic({ automatic = false } = {}) {
  if (!automatic) musicTouched = true;
  musicWanted = true;
  musicToggle.setAttribute("aria-pressed", "true");
  try {
    if (bgm.paused) bgm.volume = 0;
    await bgm.play();
    musicTouched = true;
    musicToggle.classList.remove("is-unavailable");
    musicToggle.setAttribute("aria-label", "音乐开关");
    await fadeAudio(.32, 1200);
    return true;
  } catch {
    if (automatic) {
      musicTouched = false;
      musicWanted = true;
      musicToggle.classList.remove("is-unavailable");
      musicToggle.setAttribute("aria-pressed", "false");
      return false;
    }
    musicWanted = false;
    musicToggle.classList.add("is-unavailable");
    musicToggle.setAttribute("aria-label", "音乐暂不可用");
    musicToggle.setAttribute("aria-pressed", "false");
    return false;
  }
}

function ensureMusicAfterInteraction() {
  if (!musicTouched || (musicWanted && bgm.paused)) tryPlayMusic();
}

openButton.addEventListener("click", async () => {
  if (transitionLocked) return;
  ensureMusicAfterInteraction();
  pages[0].classList.add("is-opening");
  await wait(760);
  pages[0].classList.remove("is-opening");
  await setPage(1);
});

swallowAction.addEventListener("click", async () => {
  if (transitionLocked) return;
  ensureMusicAfterInteraction();
  pages[1].classList.add("is-flying");
  await wait(840);
  pages[1].classList.remove("is-flying");
  await setPage(2);
});

function runRainbowBloom() {
  return new Promise((resolve) => {
    const speed = prefersReducedMotion ? 0.18 : 1;
    const [ambient, prism, core] = rainbowGlows;
    gsap.set(rainbowGlows, { opacity: 0, scale: 0.55, transformOrigin: "50% 58%" });
    gsap.set(rainbowImage, { scale: 1, filter: "none", transformOrigin: "50% 72%" });

    const timeline = gsap.timeline({ onComplete: resolve });
    timeline
      .to(rainbowImage, {
        duration: 0.34 * speed,
        scale: 1.03,
        filter: "brightness(1.08) saturate(1.12) drop-shadow(0 0 10px rgba(255,230,185,.58))",
        ease: "power2.out",
      }, 0)
      .to(ambient, { duration: 0.62 * speed, opacity: 0.42, scale: 1.28, ease: "sine.out" }, 0)
      .to(prism, { duration: 0.56 * speed, opacity: 0.58, scale: 1.12, ease: "power2.out" }, 0.08 * speed)
      .to(core, { duration: 0.42 * speed, opacity: 0.88, scale: 0.96, ease: "power2.out" }, 0.14 * speed)
      .to({}, { duration: 0.38 * speed })
      .to(rainbowGlows, { duration: 0.5 * speed, opacity: 0, scale: "+=.16", ease: "sine.inOut" })
      .to(rainbowImage, { duration: 0.4 * speed, scale: 1, filter: "none", ease: "sine.inOut" }, "<");
  });
}

colorAction.addEventListener("click", async () => {
  if (transitionLocked) return;
  transitionLocked = true;
  colorAction.blur();
  ensureMusicAfterInteraction();
  pages[2].classList.add("is-bloomed");
  await runRainbowBloom();
  transitionLocked = false;
  await setPage(3);
});

backButton.addEventListener("click", async () => {
  if (transitionLocked) return;
  const previous = pageStack.pop();
  if (previous === undefined) return;
  resetPage(currentPage);
  await setPage(previous, { push: false });
});

function setDragProgress(progress) {
  currentDragProgress = Math.max(0, Math.min(1, progress));
  relationshipScene.style.setProperty("--drag-progress", currentDragProgress.toFixed(3));
}

function getStageLeft(element) {
  return element.getBoundingClientRect().left - relationshipScene.getBoundingClientRect().left;
}

function startDrag(event) {
  if (currentPage !== 3 || transitionLocked || relationshipScene.classList.contains("is-bumped")) return;
  ensureMusicAfterInteraction();
  dragging = true;
  pointerMoved = false;
  dragStartX = event.clientX;
  dragStartLeft = getStageLeft(girlDrag);
  girlDrag.style.right = "auto";
  relationshipScene.classList.add("is-dragging");
  girlDrag.setPointerCapture?.(event.pointerId);
}

function moveDrag(event) {
  if (!dragging) return;
  const stageWidth = relationshipScene.clientWidth;
  const girlWidth = girlDrag.offsetWidth;
  const targetLeft = stageWidth * .43;
  const nextLeft = Math.max(targetLeft, Math.min(stageWidth - girlWidth, dragStartLeft + event.clientX - dragStartX));
  pointerMoved ||= Math.abs(event.clientX - dragStartX) > 4;
  girlDrag.style.left = `${nextLeft}px`;
  const travel = Math.max(1, dragStartLeft - targetLeft);
  setDragProgress((dragStartLeft - nextLeft) / travel);
}

async function completeRelationship() {
  if (transitionLocked || relationshipScene.classList.contains("is-bumped")) return;
  transitionLocked = true;
  girlDrag.blur();
  setDragProgress(1);
  relationshipScene.classList.add("is-bumped");
  await wait(1750);
  transitionLocked = false;
  await setPage(4);
}

async function endDrag() {
  if (!dragging) return;
  dragging = false;
  relationshipScene.classList.remove("is-dragging");

  if (currentDragProgress >= .62) {
    await completeRelationship();
    return;
  }

  girlDrag.classList.add("is-returning");
  girlDrag.style.left = "";
  girlDrag.style.right = "";
  setDragProgress(0);
  window.setTimeout(() => girlDrag.classList.remove("is-returning"), prefersReducedMotion ? 90 : 480);
}

girlDrag.addEventListener("pointerdown", startDrag);
window.addEventListener("pointermove", moveDrag, { passive: true });
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
girlDrag.addEventListener("click", () => {
  if (!pointerMoved && currentPage === 3) completeRelationship();
});
girlDrag.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && currentPage === 3) {
    event.preventDefault();
    completeRelationship();
  }
});

function prepareBlessingBurst() {
  const rect = blessingField.getBoundingClientRect();
  const styles = window.getComputedStyle(blessingField);
  const safeTop = Number.parseFloat(styles.getPropertyValue("--scatter-safe-top")) || -210;
  const safeBottom = Number.parseFloat(styles.getPropertyValue("--scatter-safe-bottom")) || 80;
  const scatter = createBlessingScatter({
    count: blessingWords.length,
    width: rect.width,
    height: rect.height,
    safeTop,
    safeBottom,
  });
  const heart = createHeartLayout({ count: blessingWords.length, width: rect.width, height: rect.height });
  blessingField.classList.remove("is-bursting", "is-scattered", "is-converging", "is-heart");
  qgirlReceiver.setAttribute("disabled", "");

  blessingWords.forEach((word, index) => {
    const scatterPoint = scatter[index];
    const heartPoint = heart[index];
    const distance = Math.hypot(scatterPoint.x - heartPoint.x, scatterPoint.y - heartPoint.y);
    word.style.setProperty("--scatter-x", `${scatterPoint.x}px`);
    word.style.setProperty("--scatter-y", `${scatterPoint.y}px`);
    word.style.setProperty("--burst-curve", `${scatterPoint.curve}px`);
    word.style.setProperty("--burst-delay", `${scatterPoint.delay}ms`);
    word.style.setProperty("--heart-x", `${heartPoint.x}px`);
    word.style.setProperty("--heart-y", `${heartPoint.y}px`);
    word.style.setProperty("--heart-delay", `${Math.round(Math.min(distance * 1.15, 360))}ms`);
    word.style.transitionDelay = "var(--burst-delay)";
  });
}

function runBlessingBurst() {
  blessingField.classList.add("is-bursting");
  window.requestAnimationFrame(() => {
    blessingField.classList.add("is-scattered");
    window.setTimeout(() => qgirlReceiver.removeAttribute("disabled"), prefersReducedMotion ? 80 : 1350);
  });
}

async function convergeBlessings() {
  if (transitionLocked || blessingField.classList.contains("is-converging") || !blessingField.classList.contains("is-scattered")) return;
  transitionLocked = true;
  ensureMusicAfterInteraction();
  qgirlReceiver.setAttribute("disabled", "");
  blessingWords.forEach((word) => {
    word.style.transitionDelay = "var(--heart-delay)";
  });
  pages[4].classList.add("is-receiving");
  blessingField.classList.add("is-converging");
  blessingField.classList.add("is-heart");
  await wait(2400);
  transitionLocked = false;
  await setPage(5);
}

qgirlReceiver.addEventListener("click", convergeBlessings);

function sizeFinaleCanvas() {
  const rect = finalPage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  finaleCanvas.width = Math.round(rect.width * dpr);
  finaleCanvas.height = Math.round(rect.height * dpr);
  finaleCanvas.style.width = `${rect.width}px`;
  finaleCanvas.style.height = `${rect.height}px`;
  finaleContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  return rect;
}

function clearFinaleCanvas() {
  const rect = finaleCanvas.getBoundingClientRect();
  finaleContext.clearRect(0, 0, rect.width, rect.height);
}

function runFinale() {
  const rect = sizeFinaleCanvas();
  const triggerRect = finaleTrigger.getBoundingClientRect();
  const origin = {
    x: triggerRect.left - rect.left + triggerRect.width * .5,
    y: triggerRect.top - rect.top + triggerRect.height * .37,
  };
  const colors = ["#fff7d6", "#ffd36b", "#ff9f3f", "#f5c47a"];
  const duration = prefersReducedMotion ? 600 : 3200;
  const sparks = [];
  const startedAt = performance.now();
  let previousAt = startedAt;

  function emitSpark(now, index) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 95 + Math.random() * 235;
    const life = 320 + Math.random() * 740;
    sparks.push({
      born: now,
      x: origin.x + (Math.random() - .5) * 7,
      y: origin.y + (Math.random() - .5) * 7,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 34,
      life,
      width: .65 + Math.random() * 1.55,
      color: colors[index % colors.length],
    });
  }

  return new Promise((resolve) => {
    function draw(now) {
      const elapsed = now - startedAt;
      const delta = Math.min((now - previousAt) / 1000, .032);
      previousAt = now;
      clearFinaleCanvas();

      if (elapsed < duration) {
        const amount = prefersReducedMotion ? 2 : 7;
        for (let index = 0; index < amount; index += 1) emitSpark(now, index);
      }

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        const age = now - spark.born;
        if (age >= spark.life) {
          sparks.splice(index, 1);
          continue;
        }

        const alpha = 1 - age / spark.life;
        const previousX = spark.x;
        const previousY = spark.y;
        spark.vy += 260 * delta;
        spark.vx *= .992;
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;

        finaleContext.save();
        finaleContext.globalCompositeOperation = "lighter";
        finaleContext.globalAlpha = alpha;
        finaleContext.strokeStyle = spark.color;
        finaleContext.lineWidth = spark.width;
        finaleContext.lineCap = "round";
        finaleContext.shadowBlur = 9;
        finaleContext.shadowColor = spark.color;
        finaleContext.beginPath();
        finaleContext.moveTo(previousX, previousY);
        finaleContext.lineTo(spark.x, spark.y);
        finaleContext.stroke();
        finaleContext.restore();
      }

      if (elapsed < duration || sparks.length) finaleFrame = window.requestAnimationFrame(draw);
      else {
        finaleFrame = null;
        clearFinaleCanvas();
        resolve();
      }
    }
    finaleFrame = window.requestAnimationFrame(draw);
  });
}

finaleTrigger.addEventListener("click", async () => {
  if (transitionLocked || finalPage.classList.contains("is-final-message")) return;
  transitionLocked = true;
  ensureMusicAfterInteraction();
  finaleTrigger.setAttribute("disabled", "");
  finalPage.classList.add("is-ignited");
  await runFinale();
  finalPage.classList.add("is-final-message");
  transitionLocked = false;
});

musicToggle.addEventListener("click", async () => {
  if (!musicTouched || bgm.paused) {
    await tryPlayMusic();
    return;
  }
  musicWanted = false;
  await fadeAudio(0, 260);
  bgm.pause();
  musicToggle.setAttribute("aria-pressed", "false");
});

bgm.addEventListener("error", () => {
  musicToggle.classList.add("is-unavailable");
  musicToggle.setAttribute("aria-label", "音乐暂不可用");
  musicToggle.setAttribute("aria-pressed", "false");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && !bgm.paused) {
    fadeAudio(0, 160).then(() => bgm.pause());
  } else if (!document.hidden && musicWanted && bgm.paused) {
    tryPlayMusic({ automatic: !musicTouched });
  }
});

setPage(0, { push: false, initial: true });
tryPlayMusic({ automatic: true });
