import { createRoot } from "react-dom/client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import AnimatedContent from "./AnimatedContent.jsx";

gsap.registerPlugin(ScrollTrigger);

// Mișcare discretă: totul apare cu fade și 12px, pe o curbă care se așază lin.
const EASE = "power3.out";
const RISE = 12;

const preferences = gsap.matchMedia();
preferences.add("(prefers-reduced-motion: no-preference)", () => {
  const roots = [];

  // 2. La derulare, coperta rămâne puțin în urmă.
  gsap.to(".hero-media", {
    yPercent: 12, ease: "none",
    scrollTrigger: { trigger: ".hero-main", start: "top top", end: "bottom top", scrub: true }
  });

  // 3. Titlurile secțiunilor, cu Animated Content de la React Bits (fade + 12px).
  document.querySelectorAll("main h2").forEach((title) => {
    const html = title.innerHTML;
    const root = createRoot(title);
    root.render(
      <AnimatedContent as="span" style={{ display: "block" }} distance={RISE} duration={.9}
        ease={EASE} initialOpacity={0} threshold={.12}>
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </AnimatedContent>
    );
    roots.push({ root, title, html });
  });

  // 4. Restul conținutului apare în grupuri, la fel de discret.
  const groups = [
    ".section-intro > p:not(.eyebrow)", ".review-card",
    ".location-card", ".footer-grid > *"
  ];
  groups.forEach((selector) => {
    ScrollTrigger.batch(selector, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => gsap.fromTo(batch, { y: RISE, opacity: 0 }, {
        y: 0, opacity: 1, duration: .9, ease: EASE, stagger: .08, clearProps: "transform,opacity"
      })
    });
  });

  // 6. Derulare lină cu Lenis, doar pe dispozitivele cu mouse.
  const desktop = gsap.matchMedia();
  desktop.add("(pointer: fine) and (hover: hover)", () => {
    const lenis = new Lenis({ lerp: .12, smoothWheel: true, autoRaf: false, stopInertiaOnNavigate: true, anchors: { offset: -80 } });
    const tick = (time) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  });

  addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

  return () => {
    desktop.revert();
    for (const { root, title, html } of roots) {
      root.unmount();
      title.innerHTML = html;
    }
    gsap.set(".hero-media, .hero-media img, .hero-copy > *", { clearProps: "all" });
  };
});

// Fotografia interiorului se deschide odată cu intrarea secțiunii în ecran.
gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
  const story = document.querySelector(".story");
  const frame = story?.querySelector(".story-image");
  if (!frame?.querySelector("img")) return;

  gsap.timeline({
    defaults: { ease: EASE },
    scrollTrigger: { trigger: story, start: "top 76%", once: true }
  })
    .from(frame, { clipPath: "inset(13% 7% 13% 7%)", duration: .85, clearProps: "clipPath" })
    .from(frame.querySelector("img"), { scale: 1.07, duration: .95, clearProps: "transform" }, "<")
    .from(story.querySelector(".story-text"), { y: 22, opacity: .65, duration: .65, clearProps: "transform,opacity" }, "<.16");
});
