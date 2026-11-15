"use strict";

const select = (selector) => document.querySelector(selector);
const selectAll = (selector) => [...document.querySelectorAll(selector)];

function setupNavigation() {
  const toggle = select(".nav-toggle");
  const dialog = select("#navigatie-mobila");
  const desktop = matchMedia("(min-width: 850px)");
  if (typeof dialog.showModal !== "function") return;

  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    dialog.showModal();
    toggle.setAttribute("aria-expanded", "true");
  });
  dialog.addEventListener("close", () => toggle.setAttribute("aria-expanded", "false"));
  dialog.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const section = document.getElementById(link.hash.slice(1));
    dialog.close();
    if (section) {
      section.tabIndex = -1;
      section.focus({ preventScroll: true });
    }
  });
  desktop.addEventListener("change", () => {
    if (desktop.matches && dialog.open) dialog.close();
  });
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const bucharest = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Bucharest", weekday: "long", hour: "2-digit", minute: "2-digit", year: "numeric", hourCycle: "h23"
});

function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function businessHours(schedule) {
  const byDay = new Map(days.map((day) => [day, []]));
  const clock = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  for (const { zile, deschide, inchide } of schedule) {
    if (!clock.test(deschide) || (!clock.test(inchide) && inchide !== "24:00") || deschide === inchide) continue;
    for (const day of zile) {
      byDay.get(day)?.push({
        label: deschide + "–" + inchide,
        start: toMinutes(deschide),
        end: toMinutes(inchide)
      });
    }
  }
  for (const intervals of byDay.values()) intervals.sort((a, b) => a.start - b.start);
  return byDay;
}

function setupHours() {
  const schedule = JSON.parse(select("#program-dorohoi").textContent);
  const byDay = businessHours(schedule);
  const status = select("#open-status");
  const dot = select("#status-dot");
  const hours = select("#today-hours");
  const copyrightYear = select("#year");

  function updateHours() {
    const { weekday, hour, minute, year } = Object.fromEntries(
      bucharest.formatToParts(new Date()).map(({ type, value }) => [type, value])
    );
    const today = byDay.get(weekday);
    const yesterday = byDay.get(days[(days.indexOf(weekday) + 6) % 7]);
    const now = Number(hour) * 60 + Number(minute);
    // Un interval care se termină după miezul nopții aparține zilei de pornire.
    const open = today.some(({ start, end }) => now >= start && (end < start || now < end))
      || yesterday.some(({ start, end }) => end < start && now < end);
    const state = open ? "Deschis acum" : "Închis acum";
    if (status && status.textContent !== state) status.textContent = state;
    if (dot) dot.dataset.state = open ? "open" : "closed";
    if (hours) hours.textContent = today.length ? "Azi " + today.map(({ label }) => label).join(" / ") : "";
    if (copyrightYear.textContent !== year) copyrightYear.textContent = year;
  }

  updateHours();
  setInterval(updateHours, 15_000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateHours();
  });
}

function setupBoard() {
  const board = select(".chalkboard");
  if (!board) return;
  new IntersectionObserver((entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      board.classList.add("is-drawn");
      observer.disconnect();
    }
  }, { threshold: .25 }).observe(board);
}

function setupGallery() {
  const gallery = select(".gallery");
  if (!gallery) return;
  const track = gallery.querySelector(".gallery-track");
  const frames = [...track.children];
  if (frames.length < 2) return;

  const controls = gallery.querySelector(".gallery-controls");
  const progress = controls.querySelector(".gallery-progress span");
  const status = controls.querySelector(".gallery-status");
  const [prev, next] = controls.querySelectorAll("button");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const last = frames.length - 1;
  let active = -1;
  let target = null;
  let drag;
  let wheelTimer;
  let wheelDistance = 0;
  let wheelHandled = false;

  function offset(index) {
    return Math.min(frames[index].offsetLeft, track.scrollWidth - track.clientWidth);
  }

  function nearest() {
    let index = 0;
    for (let i = 1; i <= last; i++) {
      if (Math.abs(track.scrollLeft - offset(i)) < Math.abs(track.scrollLeft - offset(index))) index = i;
    }
    return index;
  }

  function update(index) {
    if (index === active) return;
    active = index;
    const description = frames[index].querySelector("img").alt;
    progress.style.transform = `translateX(${index * 100}%)`;
    status.textContent = `Fotografia ${index + 1} din ${frames.length}. ${description}`;
    prev.setAttribute("aria-disabled", String(index === 0));
    next.setAttribute("aria-disabled", String(index === last));
  }

  function sync() {
    if (target !== null && Math.abs(track.scrollLeft - offset(target)) > 2) return;
    target = null;
    update(nearest());
  }

  function show(index, animate = true) {
    if (index < 0 || index > last) return;
    target = index;
    update(index);
    track.scrollTo({ left: offset(index), behavior: animate && !reducedMotion.matches ? "smooth" : "auto" });
  }

  prev.addEventListener("click", (event) => show(active - 1, event.detail > 0));
  next.addEventListener("click", (event) => show(active + 1, event.detail > 0));
  track.addEventListener("scroll", sync, { passive: true });
  track.addEventListener("keydown", (event) => {
    const steps = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: last };
    const index = steps[event.key];
    if (typeof index !== "number") return;
    event.preventDefault();
    show(index, false);
  });

  track.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    target = null;
    if (event.pointerType === "touch") return; // Native swipe and vertical scrolling.
    track.classList.add("is-dragging");
    track.scrollTo({ left: track.scrollLeft, behavior: "auto" });
    drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, index: nearest() };
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    track.scrollLeft = drag.left - (event.clientX - drag.x);
  });

  function release(event) {
    if (drag?.id !== event.pointerId) return;
    const distance = drag.x - event.clientX;
    let index = nearest();
    if (event.type === "pointerup" && index === drag.index && Math.abs(distance) >= 32) {
      index = Math.max(0, Math.min(last, index + Math.sign(distance)));
    }
    drag = undefined;
    track.classList.remove("is-dragging");
    show(index);
  }

  track.addEventListener("pointerup", release);
  track.addEventListener("pointercancel", release);
  track.addEventListener("lostpointercapture", release);

  track.addEventListener("wheel", (event) => {
    if (event.ctrlKey || drag) return;
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.shiftKey) {
      target = null;
      return;
    }
    if (!event.cancelable) return;

    // One photo per wheel gesture. At either end, the next gesture scrolls the page normally.
    const nextIndex = active + Math.sign(event.deltaY);
    if (!wheelHandled && (nextIndex < 0 || nextIndex > last)) return;
    event.preventDefault();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelDistance = 0;
      wheelHandled = false;
    }, 160);
    if (wheelHandled) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientHeight : 1;
    wheelDistance += event.deltaY * unit;
    if (Math.abs(wheelDistance) < 24) return;
    wheelHandled = true;
    show(nextIndex);
  }, { passive: false });

  if ("IntersectionObserver" in window) {
    gallery.classList.add("has-gallery-intro");
    new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      gallery.classList.add("is-gallery-visible");
      observer.disconnect();
    }, { threshold: .12 }).observe(track);
  }

  track.classList.add("is-interactive");
  controls.style.setProperty("--gallery-count", frames.length);
  controls.hidden = false;
  sync();
  new ResizeObserver(() => {
    target = null;
    sync();
  }).observe(track);
}

function setupReviews() {
  const track = select(".reviews-track");
  const nav = select(".reviews-nav");
  if (!track || !nav) return;
  const prev = select(".reviews-prev");
  const next = select(".reviews-next");
  const cards = [...track.querySelectorAll(".review-card")];
  if (cards.length < 2) return;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const limit = () => track.scrollWidth - track.clientWidth;
  const update = () => {
    const max = limit();
    nav.hidden = max <= 2;
    prev.setAttribute("aria-disabled", String(track.scrollLeft <= 2));
    next.setAttribute("aria-disabled", String(track.scrollLeft >= max - 2));
  };

  function move(direction, event) {
    if (event.currentTarget.getAttribute("aria-disabled") === "true") return;
    const origin = cards[0].offsetLeft;
    const max = limit();
    const positions = cards.map((card) => Math.min(max, card.offsetLeft - origin));
    const left = direction > 0
      ? positions.find((position) => position > track.scrollLeft + 2)
      : positions.findLast((position) => position < track.scrollLeft - 2);
    if (left === undefined) return;
    const animate = event.detail > 0 && !reducedMotion.matches;
    track.scrollTo({ left, behavior: animate ? "smooth" : "auto" });
  }

  prev.addEventListener("click", (event) => move(-1, event));
  next.addEventListener("click", (event) => move(1, event));
  track.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}

function loadMotion() {
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  function enableMotion() {
    // Se încarcă mereu: efectele de derulare merg și cu animațiile reduse; restul verifică singur preferința.
    if (select("[data-motion-script]")) return;
    const script = document.createElement("script");
    script.src = select("script[data-motion]")?.dataset.motion || "assets/js/motion.js";
    script.dataset.motionScript = "";
    document.head.append(script);
  }

  // Animațiile nu sunt necesare pentru prima afișare: se încarcă după pagină, când browserul e liber.
  const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 200));
  if (document.readyState === "complete") idle(enableMotion);
  else addEventListener("load", () => idle(enableMotion), { once: true });
  motion.addEventListener("change", enableMotion);
}

function setupHeader() {
  const header = select(".site-header");
  const links = selectAll('.desktop-nav a[href^="#"], .mobile-nav nav a[href^="#"]');
  const sections = [...new Set(links.map((link) => link.hash))]
    .map((hash) => document.getElementById(hash.slice(1))).filter(Boolean);
  let current = "";
  let frame = 0;

  function update() {
    frame = 0;
    header.classList.toggle("is-scrolled", scrollY > 28);
    const marker = Math.max(header.offsetHeight + 12, Math.min(innerHeight * .28, 220));
    const section = sections.find((entry) => {
      const bounds = entry.getBoundingClientRect();
      return bounds.top <= marker && bounds.bottom > marker;
    });
    const hash = section ? "#" + section.id : "";
    if (hash === current) return;
    current = hash;
    for (const link of links) {
      if (link.hash === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  update();
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
}

// Titlul păstrează spațiul fiecărei litere înainte de apariția ei.
function setupTypeTitle() {
  const title = select(".hero h1");
  if (!title || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const keys = (title.dataset.keys || "").toLowerCase().split(",").filter(Boolean);
  title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());
  const letters = [];

  function split(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== Node.TEXT_NODE) {
        split(child);
        continue;
      }
      const fragment = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part.trim()) {
          fragment.append(part);
          continue;
        }
        const word = document.createElement("span");
        word.className = "sw";
        word.setAttribute("aria-hidden", "true");
        const key = keys.includes(part.toLowerCase().replace(/[^\p{L}]/gu, ""));
        for (const char of part) {
          const letter = document.createElement("span");
          letter.className = "tl";
          letter.textContent = char;
          letters.push({ letter, word, key });
          word.append(letter);
        }
        fragment.append(word);
      }
      child.replaceWith(fragment);
    }
  }

  split(title);
  if (!letters.length) return;
  title.classList.add("is-typing");
  const cursor = document.createElement("span");
  cursor.className = "type-cursor";
  letters[0].letter.before(cursor);
  let timing = 150;
  for (const { letter, word, key } of letters) {
    const lastInWord = !letter.nextSibling;
    setTimeout(() => {
      letter.classList.add("is-on");
      letter.after(cursor);
      if (key && lastInWord) word.classList.add("is-gold");
    }, timing);
    timing += 56 + (lastInWord ? 76 : 0);
  }
  setTimeout(() => cursor.classList.add("is-done"), timing + 500);
}

setupTypeTitle();
setupNavigation();
setupHours();
setupBoard();
setupGallery();
setupHeader();
setupReviews();
loadMotion();
