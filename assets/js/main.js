"use strict";

const select = (selector) => document.querySelector(selector);
const selectAll = (selector) => [...document.querySelectorAll(selector)];

function setupNavigation() {
  const toggle = select(".nav-toggle");
  const dialog = select("#navigatie-mobila");
  const desktop = matchMedia("(min-width: 850px)");
  if (typeof dialog.showModal !== "function") return;

  toggle.hidden = false;
  toggle.addEventListener("click", () => dialog.showModal());
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

function setupMenu() {
  const list = select(".menu-tabs");
  if (!list) return;
  const tabs = selectAll(".menu-tab");
  const panels = selectAll(".menu-panel");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  list.hidden = false;

  function show(tab, { focus = false, animate = true } = {}) {
    const id = tab.dataset.category;
    for (const other of tabs) {
      const active = other === tab;
      other.setAttribute("aria-selected", String(active));
      other.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.id !== "meniu-" + id;
    if (focus) tab.focus();
    if (!animate || calm.matches) return;
    // Preparatele intră pe rând, ca și cum ar fi puse pe masă.
    select("#meniu-" + id).querySelectorAll(".dish-card").forEach((dish, index) => {
      dish.animate(
        [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
        { duration: 520, delay: index * 60, easing: "cubic-bezier(.23, 1, .32, 1)", fill: "backwards" }
      );
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => show(tab));
    tab.addEventListener("keydown", (event) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next;
      if (event.key in keys) next = tabs[(index + keys[event.key] + tabs.length) % tabs.length];
      else if (event.key === "Home") next = tabs[0];
      else if (event.key === "End") next = tabs.at(-1);
      if (!next) return;
      event.preventDefault();
      show(next, { focus: true });
    });
  });
  show(tabs[0], { animate: false });
}

function setupChoices(controls, keyframes, duration) {
  if (!controls) return false;
  const buttons = [...controls.querySelectorAll("button[aria-controls]")];
  const panels = buttons.map((button) => document.getElementById(button.getAttribute("aria-controls")));
  if (!buttons.length || panels.some((panel) => !panel)) return false;

  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  let active = -1;
  let transition;

  function selectPanel(index, animate) {
    if (index === active) return;
    transition?.cancel();
    active = index;
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      buttons[i].setAttribute("aria-pressed", String(i === index));
    });
    if (animate && !calm.matches) {
      transition = panels[index].animate(keyframes, {
        duration, easing: "cubic-bezier(.23, 1, .32, 1)"
      });
    }
  }

  buttons.forEach((button, index) => button.addEventListener("click", () => selectPanel(index, true)));
  selectPanel(0, false);
  controls.hidden = buttons.length < 2;
  return true;
}

function setupBoard() {
  const board = select(".chalkboard");
  if (!board) return;
  setupChoices(board.querySelector(".board-filters"), [
    { opacity: .35, transform: "translateY(10px)" },
    { opacity: 1, transform: "translateY(0)" }
  ], 340);

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
  const enabled = setupChoices(gallery.querySelector(".gallery-controls"), [
    { clipPath: "inset(0 14% 0 14%)", opacity: .45 },
    { clipPath: "inset(0 0 0 0)", opacity: 1 }
  ], 540);
  if (enabled) gallery.classList.add("is-interactive");
}

function setupReviews() {
  const track = select(".reviews-track");
  const nav = select(".reviews-nav");
  if (!track || !nav) return;
  const prev = select(".reviews-prev");
  const next = select(".reviews-next");
  const step = () => track.querySelector(".review-card").getBoundingClientRect().width + 20;
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    nav.hidden = max <= 0;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };
  prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
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
  const update = () => header.classList.toggle("is-scrolled", scrollY > 28);
  update();
  addEventListener("scroll", update, { passive: true });
}

// Titlul de sus: rândurile apar pe rând, încet, apoi cuvintele-cheie se fac aurii.
function setupSteamTitle() {
  const title = select(".hero h1");
  if (!title) return;
  const keys = (title.dataset.keys || "").toLowerCase().split(",").filter(Boolean);
  title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());
  const words = [];
  const split = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== 3) { split(child); continue; }
      const frag = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (!part.trim()) { frag.append(part); continue; }
        const word = document.createElement("span");
        word.className = "sw";
        word.setAttribute("aria-hidden", "true");
        const bare = part.toLowerCase().replace(/[^\p{L}]/gu, "");
        if (keys.includes(bare)) word.classList.add("is-key");
        word.textContent = part;
        words.push(word);
        frag.append(word);
      }
      child.replaceWith(frag);
    }
  };
  split(title);
  // Fiecare cuvânt află pe ce rând a căzut, ca rândurile să apară pe rând.
  const tops = [...new Set(words.map((w) => w.offsetTop))].sort((a, b) => a - b);
  words.forEach((w) => w.style.setProperty("--line", tops.indexOf(w.offsetTop)));
  title.style.setProperty("--lines", tops.length);
  title.classList.add("is-steam");
}

setupSteamTitle();
setupNavigation();
setupHours();
setupMenu();
setupBoard();
setupGallery();
setupHeader();
setupReviews();
loadMotion();
