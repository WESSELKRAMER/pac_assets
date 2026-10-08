gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;
let isTransitioning = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const hasSplitText = typeof window.SplitText !== "undefined";

if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (hasSplitText) gsap.registerPlugin(SplitText);

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  initAutoRefresh();
  initNavbarHide();
  initMobileMenu();
  initLogoHover();
  initNavCurrentUnderline();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  applyNavbarPageConfig(nextPage);
  initDynamicCurrentYear();
  initUnselectableText();
  initCTAAnimation();
  if (has("[data-submit-trigger]")) initSubmitTriggers();
  if (has("[data-team-prev], [data-team-next], [data-arrow-button]")) initArrowButtons();
  if (has(".faq_item")) initFAQAnimation();
  if (has('[data-split="heading"]')) initMaskTextScrollReveal();
  if (has("[data-highlight-text]")) initHighlightText();
  if (has(".floating_img_wrap")) initFloatingImages();
  if (has("[data-team-slider]")) initTeamSlider();
  if (has(".big_logo")) initBigLogoReveal();
  if (has(".logo-marquee_track, [data-marquee-track]")) initLogoMarquee();
  if (has(".footer_link")) initFooterLinkHover();
  if (has("[data-blob-section]")) initCursorBlob();
  if (has(".stories-swiper")) initStoriesSwiper();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    }
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(current, {
    autoAlpha: 0,
    ease: "power1.in",
    duration: 0.5,
  }, 0);

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0);

  tl.fromTo(next, {
    autoAlpha: 0,
  }, {
    autoAlpha: 1,
    ease: "power1.inOut",
    duration: 0.75,
  }, "startEnter");

  tl.fromTo(next.querySelector('h1'), {
    yPercent: 25,
    autoAlpha: 0,
  }, {
    yPercent: 0,
    autoAlpha: 1,
    ease: "expo.out",
    duration: 1,
  }, "< 0.3");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}

barba.hooks.beforeEnter(data => {
  isTransitioning = true;

  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(data => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => {
      if (trigger.trigger && data.current.container.contains(trigger.trigger)) {
        trigger.kill();
      }
    });
  }

  runPageCleanups(data.current.container);
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
  initNavCurrentUnderline();
});

barba.hooks.afterOnce(data => {
  initAfterEnterFunctions(data.next.container);
});

barba.hooks.afterEnter(data => {
  isTransitioning = false;

  resetWebflow(data);

  initAfterEnterFunctions(data.next.container);

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: true,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      async once(data) {
        initOnceFunctions();
        initBeforeEnterFunctions(document);

        return runPageOnceAnimation(data.next.container);
      },

      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}

const pageCleanups = new Map();

function addCleanup(el, fn) {
  const owner = el.closest('[data-barba="container"]');
  if (!owner) return;
  if (!pageCleanups.has(owner)) pageCleanups.set(owner, []);
  pageCleanups.get(owner).push(fn);
}

function runPageCleanups(container) {
  const fns = pageCleanups.get(container);
  if (!fns) return;
  fns.forEach((fn) => {
    try { fn(); } catch (e) {}
  });
  pageCleanups.delete(container);
}

function resetWebflow(data) {
  if (!window.Webflow) return;

  const dom = new DOMParser().parseFromString(data.next.html, "text/html");
  const pageId = dom.documentElement.getAttribute("data-wf-page");
  if (pageId) document.documentElement.setAttribute("data-wf-page", pageId);

  window.Webflow.destroy();
  window.Webflow.ready();

  const ix2 = window.Webflow.require("ix2");
  if (ix2) ix2.init();
}

function toNumber(value, fallback) {
  const n = parseFloat(value);
  return isNaN(n) ? fallback : n;
}

function initAutoRefresh() {
  if (!hasScrollTrigger || typeof ResizeObserver === "undefined") return;

  let lastHeight = document.body.scrollHeight;
  let timer = null;

  const observer = new ResizeObserver(() => {
    const height = document.body.scrollHeight;
    if (height === lastHeight) return;
    lastHeight = height;

    clearTimeout(timer);
    timer = setTimeout(() => {
      if (isTransitioning) return;
      if (lenis) lenis.resize();
      ScrollTrigger.refresh();
    }, 200);
  });

  observer.observe(document.body);
}

let navbarEl = null;
let navConfig = {
  hide: true,
  offset: 10,
  threshold: 0,
  duration: 0.5,
  ease: "expo.out"
};

function applyNavbarPageConfig(scope) {
  if (!navbarEl) return;

  const container =
    scope.matches && scope.matches('[data-barba="container"]')
      ? scope
      : scope.querySelector('[data-barba="container"]');

  function read(key) {
    const fromContainer = container ? container.dataset[key] : undefined;
    return fromContainer !== undefined ? fromContainer : navbarEl.dataset[key];
  }

  navConfig = {
    hide: read("navbarHide") !== "false",
    offset: toNumber(read("navbarOffset"), 10),
    threshold: toNumber(read("navbarThreshold"), 0),
    duration: toNumber(read("navbarDuration"), 0.5),
    ease: read("navbarEase") || "expo.out"
  };
}

function initNavbarHide() {
  navbarEl = document.querySelector("[data-navbar]") || document.querySelector(".navbar");
  if (!navbarEl) return;
  if (navbarEl.dataset.navbarInitialized === "true") return;
  navbarEl.dataset.navbarInitialized = "true";

  applyNavbarPageConfig(document);

  let lastScroll = window.pageYOffset;
  let ticking = false;
  let state = lastScroll <= navConfig.offset ? "top" : "visible";

  gsap.set(navbarEl, { yPercent: 0 });
  navbarEl.setAttribute("data-navbar-state", state);

  function setState(newState) {
    if (newState === state) return;
    state = newState;
    navbarEl.setAttribute("data-navbar-state", state);

    gsap.to(navbarEl, {
      yPercent: state === "hidden" ? -100 : 0,
      duration: navConfig.duration,
      ease: navConfig.ease,
      overwrite: "auto"
    });
  }

  function handleScroll() {
    ticking = false;

    const currentScroll = window.pageYOffset;
    const delta = currentScroll - lastScroll;

    if (currentScroll <= navConfig.offset) {
      setState("top");
      lastScroll = currentScroll;
      return;
    }

    if (!navConfig.hide) {
      setState("visible");
      lastScroll = currentScroll;
      return;
    }

    if (Math.abs(delta) <= navConfig.threshold) return;

    setState(delta > 0 ? "hidden" : "visible");
    lastScroll = currentScroll;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
}

const menuMQ = window.matchMedia("(max-width: 991px)");
const MENU_RADIUS = "1.5rem";

function initMobileMenu() {
  const navInner = document.querySelector(".nav_inner");
  const toggle = document.querySelector(".hb_wrapper");
  const panel = document.querySelector(".nav_items");
  if (!navInner || !toggle || !panel) return;
  if (toggle.dataset.menuInitialized === "true") return;
  toggle.dataset.menuInitialized = "true";

  const items = panel.querySelectorAll(".nav_item");
  const lines = toggle.querySelectorAll(".hb_line");
  const firstLine = lines[0];
  const lastLine = lines[lines.length - 1];

  const reveal = { p: 0 };
  let isOpen = false;

  toggle.setAttribute("role", "button");
  toggle.setAttribute("tabindex", "0");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Menu");

  function applyClip() {
    panel.style.clipPath = `inset(0% 0% ${100 - reveal.p}% 0% round ${MENU_RADIUS})`;
  }

  function lineOffset() {
    if (lines.length < 2) return 0;
    const a = firstLine.getBoundingClientRect();
    const b = lastLine.getBoundingClientRect();
    return (b.top - a.top) / 2;
  }

  function setClosedState() {
    reveal.p = 0;
    applyClip();
    gsap.set(panel, { visibility: "hidden" });
    gsap.set(items, { y: "1.5rem", autoAlpha: 0 });
    gsap.set(lines, { y: 0, rotate: 0 });
  }

  function open() {
    if (!menuMQ.matches || isOpen) return;
    isOpen = true;

    toggle.setAttribute("aria-expanded", "true");
    navInner.setAttribute("data-menu-open", "true");
    if (lenis) lenis.stop();

    const offset = lineOffset();
    gsap.killTweensOf([reveal, items, lines]);

    gsap.set(panel, { visibility: "visible" });
    applyClip();

    gsap.to(reveal, {
      p: 100,
      duration: 0.8,
      ease: "expo.out",
      onUpdate: applyClip
    });

    gsap.to(items, {
      y: 0,
      autoAlpha: 1,
      duration: 0.7,
      stagger: 0.05,
      delay: 0.1,
      ease: "expo.out"
    });

    if (firstLine && lastLine && firstLine !== lastLine) {
      gsap.to(firstLine, { y: offset, rotate: 45, duration: 0.6, ease: "expo.out" });
      gsap.to(lastLine, { y: -offset, rotate: -45, duration: 0.6, ease: "expo.out" });
    }
  }

  function close(immediate) {
    if (!isOpen && !immediate) return;
    const wasOpen = isOpen;
    isOpen = false;

    toggle.setAttribute("aria-expanded", "false");
    navInner.setAttribute("data-menu-open", "false");
    if (wasOpen && lenis) lenis.start();

    gsap.killTweensOf([reveal, items, lines]);

    if (immediate) {
      setClosedState();
      return;
    }

    gsap.to(items, {
      autoAlpha: 0,
      duration: 0.25,
      stagger: { each: 0.02, from: "end" },
      ease: "power2.in"
    });

    gsap.to(reveal, {
      p: 0,
      duration: 0.6,
      delay: 0.1,
      ease: "expo.inOut",
      onUpdate: applyClip,
      onComplete: () => {
        gsap.set(panel, { visibility: "hidden" });
        gsap.set(items, { y: "1.5rem" });
      }
    });

    gsap.to(lines, { y: 0, rotate: 0, duration: 0.6, ease: "expo.out" });
  }

  function toggleMenu() {
    if (isOpen) close();
    else open();
  }

  toggle.addEventListener("click", toggleMenu);

  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMenu();
    }
  });

  navInner.addEventListener("click", (e) => {
    if (isOpen && e.target.closest("a")) close();
  });

  document.addEventListener("click", (e) => {
    if (isOpen && !navInner.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) close();
  });

  function applyMode() {
    if (menuMQ.matches) {
      close(true);
    } else {
      if (isOpen && lenis) lenis.start();
      isOpen = false;
      reveal.p = 0;
      toggle.setAttribute("aria-expanded", "false");
      navInner.setAttribute("data-menu-open", "false");
      gsap.killTweensOf([reveal, items, lines]);
      gsap.set(panel, { clearProps: "all" });
      gsap.set(items, { clearProps: "all" });
      gsap.set(lines, { clearProps: "all" });
    }
  }

  applyMode();
  menuMQ.addEventListener?.("change", applyMode);
  menuMQ.addListener?.(applyMode);
}

function initLogoHover() {
  document.querySelectorAll(".logo_wrapper").forEach((wrapper) => {
    const circle = wrapper.querySelector(".logo_circle");
    if (!circle) return;
    if (wrapper.dataset.logoHoverInitialized === "true") return;
    wrapper.dataset.logoHoverInitialized = "true";

    gsap.set(circle, { transformOrigin: "50% 50%" });

    wrapper.addEventListener("mouseenter", () => {
      gsap.to(circle, {
        scale: 0.92,
        duration: 0.5,
        ease: "expo.out",
        overwrite: "auto"
      });
    });

    wrapper.addEventListener("mouseleave", () => {
      gsap.to(circle, {
        scale: 1,
        duration: 0.5,
        ease: "expo.out",
        overwrite: "auto"
      });
    });
  });
}

function initNavCurrentUnderline() {
  document.querySelectorAll(".nav_item").forEach((el) => {
    if (el.dataset.underlineOriginal === undefined) {
      el.dataset.underlineOriginal = el.hasAttribute("data-underline-link")
        ? el.getAttribute("data-underline-link")
        : "__none__";
    }

    const original = el.dataset.underlineOriginal;

    if (el.classList.contains("w--current")) {
      el.setAttribute("data-underline-link", "alt");
    } else if (original === "__none__") {
      el.removeAttribute("data-underline-link");
    } else {
      el.setAttribute("data-underline-link", original);
    }
  });
}

function initDynamicCurrentYear() {
  const currentYear = new Date().getFullYear();
  nextPage.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = currentYear;
  });
}

function initUnselectableText() {
  const elements = [];
  if (nextPage === document && document.body.hasAttribute("data-no-select")) {
    elements.push(document.body);
  }
  nextPage.querySelectorAll("[data-no-select]").forEach((el) => elements.push(el));

  elements.forEach((el) => {
    if (el.dataset.noSelectInitialized === "true") return;
    el.dataset.noSelectInitialized = "true";

    el.style.userSelect = "none";
    el.style.webkitUserSelect = "none";
    el.style.msUserSelect = "none";
    el.style.webkitTouchCallout = "none";

    el.addEventListener("selectstart", (e) => e.preventDefault());
    el.addEventListener("copy", (e) => e.preventDefault());
    el.addEventListener("dragstart", (e) => e.preventDefault());
  });
}

function initCursorBlob() {
  nextPage.querySelectorAll("[data-blob-section]").forEach((section) => {
    const blob = section.querySelector(".blob");
    if (!blob) return;
    if (section.dataset.blobInitialized === "true") return;
    section.dataset.blobInitialized = "true";

    gsap.set(blob, {
      xPercent: -50,
      yPercent: -50,
      x: section.offsetWidth / 2,
      y: section.offsetHeight / 2
    });

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const xTo = gsap.quickTo(blob, "x", { duration: 2.5, ease: "power3.out" });
    const yTo = gsap.quickTo(blob, "y", { duration: 2.5, ease: "power3.out" });

    let mouseX = null;
    let mouseY = null;
    let isInside = false;

    function updateTarget() {
      if (mouseX === null) return;
      const rect = section.getBoundingClientRect();
      xTo(mouseX - rect.left);
      yTo(mouseY - rect.top);
    }

    section.addEventListener("mouseenter", () => {
      isInside = true;
    });

    section.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      updateTarget();
    });

    section.addEventListener("mouseleave", () => {
      isInside = false;
    });

    function onScroll() {
      if (isInside) updateTarget();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    addCleanup(section, () => window.removeEventListener("scroll", onScroll));
  });
}

function initCTAAnimation() {
  nextPage.querySelectorAll(".primary_cta, .grid_card_cta_wrapper").forEach((cta) => {
    const text = cta.querySelector(".cta_text, .grid_card_cta_text");
    const arrow = cta.querySelector(".cta_arrow");
    const circle = cta.querySelector(".cta_arrow_wrapper");

    if (!text || !arrow || !circle) return;
    if (text.dataset.ctaSplit === "true") return;

    const trigger = cta.closest("[data-cta-trigger], .category_card") || cta;

    const originalText = text.textContent.trim();

    text.innerHTML = originalText
      .split("")
      .map((char) => `<span class="cta_char">${char === " " ? "&nbsp;" : char}</span>`)
      .join("");

    text.dataset.ctaSplit = "true";

    const chars = text.querySelectorAll(".cta_char");

    gsap.set(text, { overflow: "hidden" });
    gsap.set(chars, { display: "inline-block" });
    gsap.set([arrow, circle], { transformOrigin: "50% 50%" });

    trigger.addEventListener("mouseenter", () => {
      gsap.killTweensOf([arrow, circle, chars]);

      gsap.to(chars, {
        yPercent: -100,
        opacity: 0,
        duration: 0.22,
        stagger: 0.018,
        ease: "power2.in",
        onComplete: () => {
          gsap.fromTo(
            chars,
            { yPercent: 100, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.38,
              stagger: 0.018,
              ease: "expo.out"
            }
          );
        }
      });

      gsap.to(circle, {
        scale: 1.08,
        duration: 0.4,
        ease: "expo.out"
      });

      gsap.to(arrow, {
        x: "0.75rem",
        y: "-0.75rem",
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => {
          gsap.fromTo(
            arrow,
            {
              x: "-0.75rem",
              y: "0.75rem",
              opacity: 0
            },
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.28,
              ease: "expo.out"
            }
          );
        }
      });
    });

    trigger.addEventListener("mouseleave", () => {
      gsap.to(circle, {
        scale: 1,
        duration: 0.35,
        ease: "expo.out"
      });

      gsap.to(arrow, {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: "expo.out"
      });
    });
  });
}

function initSubmitTriggers() {
  nextPage.querySelectorAll("[data-submit-trigger]").forEach((trigger) => {
    if (trigger.dataset.submitInitialized === "true") return;
    trigger.dataset.submitInitialized = "true";

    const wfWrapper = trigger.closest(".w-form");
    const form = trigger.closest("form") || (wfWrapper && wfWrapper.querySelector("form"));

    if (!form) {
      console.warn("[submit trigger] Geen formulier gevonden rond dit element.", trigger);
      return;
    }

    const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]:not([data-submit-trigger])');

    if (trigger.matches("button") && trigger.getAttribute("type") !== "button") {
      trigger.setAttribute("type", "button");
    }

    if (!trigger.matches("a, button")) {
      trigger.setAttribute("role", "button");
      trigger.setAttribute("tabindex", "0");
    }

    function submitForm(e) {
      e.preventDefault();

      if (trigger.getAttribute("data-submitting") === "true") return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      trigger.setAttribute("data-submitting", "true");

      if (submitBtn) {
        submitBtn.click();
      } else if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
    }

    trigger.addEventListener("click", submitForm);

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") submitForm(e);
    });

    const wrapper = form.closest(".w-form");
    if (!wrapper) return;

    const done = wrapper.querySelector(".w-form-done");
    const fail = wrapper.querySelector(".w-form-fail");
    const watched = [done, fail].filter(Boolean);
    if (!watched.length) return;

    const isVisible = (el) => el && getComputedStyle(el).display !== "none";

    const observer = new MutationObserver(() => {
      if (isVisible(done) || isVisible(fail)) {
        trigger.removeAttribute("data-submitting");
      }
    });

    watched.forEach((el) => {
      observer.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
    });

    addCleanup(trigger, () => observer.disconnect());
  });
}

function initArrowButtons() {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  nextPage.querySelectorAll("[data-team-prev], [data-team-next], [data-arrow-button]").forEach((btn) => {
    if (btn.dataset.arrowButtonInitialized === "true") return;
    btn.dataset.arrowButtonInitialized = "true";

    const arrow = btn.querySelector("[data-arrow-icon]") || btn.querySelector("svg, img");
    if (!arrow) return;

    let dir = 1;
    if (btn.hasAttribute("data-team-prev") || btn.dataset.arrowDirection === "left") dir = -1;

    let isHovering = false;

    gsap.set(btn, { overflow: "hidden", transformOrigin: "50% 50%" });

    function distance() {
      return btn.offsetWidth * 0.6;
    }

    function slideThrough() {
      if (reducedMotion) return;

      gsap.killTweensOf(arrow);

      gsap.to(arrow, {
        x: distance() * dir,
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => {
          gsap.fromTo(arrow,
            { x: -distance() * dir, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.32, ease: "expo.out" }
          );
        }
      });
    }

    if (canHover) {
      btn.addEventListener("mouseenter", () => {
        isHovering = true;
        gsap.to(btn, { scale: 1.08, duration: 0.4, ease: "expo.out", overwrite: "auto" });
        slideThrough();
      });

      btn.addEventListener("mouseleave", () => {
        isHovering = false;
        gsap.to(btn, { scale: 1, duration: 0.35, ease: "expo.out", overwrite: "auto" });
        gsap.to(arrow, { x: 0, opacity: 1, duration: 0.2, ease: "expo.out", overwrite: "auto" });
      });
    }

    btn.addEventListener("click", () => {
      if (reducedMotion) return;

      gsap.fromTo(btn,
        { scale: 0.9 },
        { scale: isHovering ? 1.08 : 1, duration: 0.5, ease: "back.out(3)", overwrite: "auto" }
      );

      slideThrough();
    });
  });
}

function initFAQAnimation() {
  const faqItems = nextPage.querySelectorAll(".faq_item");
  if (!faqItems.length) return;

  function closeItem(item) {
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon");

    if (!answer) return;

    gsap.to(answer, {
      height: 0,
      duration: 0.55,
      ease: "power2.out"
    });

    if (plusIcon) {
      gsap.to(plusIcon, {
        rotate: 0,
        duration: 0.55,
        ease: "power2.out"
      });
    }

    item.dataset.open = "false";
  }

  function openItem(item) {
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon");

    if (!answer) return;

    gsap.set(answer, { height: "auto" });
    const height = answer.offsetHeight;
    gsap.set(answer, { height: 0 });

    gsap.to(answer, {
      height,
      duration: 0.55,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(answer, { height: "auto" });
      }
    });

    if (plusIcon) {
      gsap.to(plusIcon, {
        rotate: 45,
        duration: 0.55,
        ease: "power2.out"
      });
    }

    item.dataset.open = "true";
  }

  faqItems.forEach((item, index) => {
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon");

    if (!answer) return;
    if (item.dataset.faqInitialized === "true") return;
    item.dataset.faqInitialized = "true";

    const isFirst = index === 0;

    gsap.set(answer, {
      height: isFirst ? "auto" : 0,
      overflow: "hidden"
    });

    if (plusIcon) {
      gsap.set(plusIcon, {
        rotate: isFirst ? 45 : 0
      });
    }

    item.dataset.open = isFirst ? "true" : "false";

    item.addEventListener("click", () => {
      const isOpen = item.dataset.open === "true";

      if (isOpen) {
        closeItem(item);
        return;
      }

      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.dataset.open === "true") {
          closeItem(otherItem);
        }
      });

      openItem(item);
    });
  });
}

function initMaskTextScrollReveal() {
  const headings = nextPage.querySelectorAll('[data-split="heading"]');
  if (!headings.length) return;

  if (!hasSplitText || !hasScrollTrigger) {
    gsap.set(headings, { autoAlpha: 1 });
    return;
  }

  const splitConfig = {
    lines: { duration: 0.8, stagger: 0.08 },
    words: { duration: 0.6, stagger: 0.06 },
    chars: { duration: 0.4, stagger: 0.01 }
  };

  document.fonts.ready.then(() => {
    headings.forEach((heading) => {
      if (!heading.isConnected) return;
      if (heading.dataset.splitInitialized === "true") return;
      heading.dataset.splitInitialized = "true";

      const type = ["lines", "words", "chars"].includes(heading.dataset.splitReveal)
        ? heading.dataset.splitReveal
        : "lines";

      const isImmediate = heading.dataset.splitImmediate === "true";
      const config = splitConfig[type];

      const duration = toNumber(heading.dataset.splitDuration, config.duration);
      const stagger = toNumber(heading.dataset.splitStagger, config.stagger);
      const delay = toNumber(heading.dataset.splitDelay, isImmediate ? 0.2 : 0);
      const ease = heading.dataset.splitEase || "expo.out";
      const start = heading.dataset.splitStart || "top 80%";

      const typesToSplit =
        type === "lines"
          ? ["lines"]
          : type === "words"
          ? ["lines", "words"]
          : ["lines", "words", "chars"];

      const instance = SplitText.create(heading, {
        type: typesToSplit.join(", "),
        mask: "lines",
        autoSplit: true,
        linesClass: "line",
        wordsClass: "word",
        charsClass: "letter",

        onSplit(instance) {
          const targets = instance[type];

          if (!targets || !targets.length) {
            gsap.set(heading, { autoAlpha: 1 });
            return;
          }

          const animation = {
            yPercent: 110,
            duration,
            stagger,
            delay,
            ease
          };

          const tween = isImmediate
            ? gsap.from(targets, animation)
            : gsap.from(targets, {
                ...animation,
                scrollTrigger: {
                  trigger: heading,
                  start: `clamp(${start})`,
                  once: true
                }
              });

          gsap.set(heading, { autoAlpha: 1 });

          return tween;
        }
      });

      addCleanup(heading, () => instance.revert());
    });
  });
}

function initHighlightText() {
  if (!hasSplitText || !hasScrollTrigger) return;

  nextPage.querySelectorAll("[data-highlight-text]").forEach((heading) => {
    if (heading.dataset.highlightInitialized === "true") return;
    heading.dataset.highlightInitialized = "true";

    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 90%";
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 40%";
    const fadedValue = toNumber(heading.getAttribute("data-highlight-fade"), 0.2);
    const staggerValue = toNumber(heading.getAttribute("data-highlight-stagger"), 0.1);

    const split = new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            }
          });
          tl.from(self.chars, {
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear"
          });
        });
        return ctx;
      }
    });

    addCleanup(heading, () => split.revert());
  });
}

function getLayoutCenter(el) {
  let x = 0;
  let y = 0;
  let node = el;

  while (node) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }

  return {
    x: x + el.offsetWidth / 2,
    y: y + el.offsetHeight / 2
  };
}

function initFloatingImages() {
  const wrapsInPage = nextPage.querySelectorAll(".floating_img_wrap");
  if (!wrapsInPage.length) return;

  if (!hasScrollTrigger || reducedMotion) {
    gsap.set(wrapsInPage, { visibility: "visible" });
    return;
  }

  const sections = new Set();
  wrapsInPage.forEach((wrap) => {
    sections.add(
      wrap.closest("[data-floating-images], .section_floating_images") || wrap.parentElement
    );
  });

  sections.forEach((section) => {
    if (section.dataset.floatingInitialized === "true") return;
    section.dataset.floatingInitialized = "true";

    const wraps = section.querySelectorAll(".floating_img_wrap");
    if (!wraps.length) return;

    const start = section.dataset.floatingStart || "top 70%";
    const duration = toNumber(section.dataset.floatingDuration, 1.2);
    const stagger = toNumber(section.dataset.floatingStagger, 0.15);
    const zoom = toNumber(section.dataset.floatingZoom, 1.3);
    const pull = toNumber(section.dataset.floatingPull, 0.12);

    const target =
      section.querySelector("[data-floating-target]") ||
      section.querySelector(".floating_images_inner") ||
      section;

    const items = Array.from(wraps).map((wrap) => {
      const img = wrap.querySelector("img");

      let radius = getComputedStyle(wrap).borderTopLeftRadius;
      if ((!radius || radius === "0px") && img) {
        radius = getComputedStyle(img).borderTopLeftRadius;
      }
      radius = radius || "0px";

      const reveal = { p: 0 };

      function applyClip() {
        wrap.style.clipPath = `inset(${100 - reveal.p}% 0% 0% 0% round ${radius})`;
      }

      applyClip();
      if (img) gsap.set(img, { scale: zoom, transformOrigin: "50% 50%" });

      return { wrap, img, reveal, applyClip };
    });

    gsap.set(wraps, { visibility: "visible" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: `clamp(${start})`,
        once: true
      }
    });

    items.forEach((item, i) => {
      tl.to(item.reveal, {
        p: 100,
        duration,
        ease: "expo.out",
        onUpdate: item.applyClip
      }, i * stagger);

      if (item.img) {
        tl.to(item.img, {
          scale: 1,
          duration: duration * 1.3,
          ease: "expo.out"
        }, i * stagger);
      }
    });

    addCleanup(section, () => tl.kill());

    if (pull > 0) {
      items.forEach((item) => {
        const drift = gsap.to(item.wrap, {
          x: () => (getLayoutCenter(target).x - getLayoutCenter(item.wrap).x) * pull,
          y: () => (getLayoutCenter(target).y - getLayoutCenter(item.wrap).y) * pull,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true
          }
        });

        addCleanup(section, () => drift.kill());
      });
    }
  });
}

function initTeamSlider() {
  const mod = (n, m) => ((n % m) + m) % m;

  nextPage.querySelectorAll("[data-team-slider]").forEach((slider) => {
    if (slider.dataset.teamInitialized === "true") return;
    slider.dataset.teamInitialized = "true";

    const track = slider.querySelector("[data-team-track]");
    if (!track) return;

    const templates = [...track.querySelectorAll("[data-team-item]")].map((el) => el.cloneNode(true));
    const count = templates.length;
    if (!count) return;

    const textWrap = slider.querySelector("[data-team-text]");
    const textName = slider.querySelector("[data-team-text-name]");
    const textRole = slider.querySelector("[data-team-text-role]");
    const textBio = slider.querySelector("[data-team-text-bio]");
    const textFields = [textName, textRole, textBio].filter(Boolean);
    const prevBtn = slider.querySelector("[data-team-prev]");
    const nextBtn = slider.querySelector("[data-team-next]");

    const anchorEl = slider.querySelector("[data-team-anchor-el]") || textWrap;
    const anchorAttr = slider.dataset.teamAnchor;
    const useAnchorEl = anchorAttr === undefined && !!anchorEl;
    const anchorFraction = toNumber(anchorAttr, 0.5);

    const duration = reducedMotion ? 0 : toNumber(slider.dataset.teamDuration, 1);
    const waveHeight = toNumber(slider.dataset.teamWaveHeight, 0.35);
    const waveItems = toNumber(slider.dataset.teamWaveLength, 6);
    const spacingFactor = toNumber(slider.dataset.teamSpacing, 1.5);
    const activeScale = toNumber(slider.dataset.teamActiveScale, 1.2);
    const autoplay = toNumber(slider.dataset.teamAutoplay, 0);

    const MAX_SETS = 8;

    const state = { progress: 0 };
    let targetProgress = 0;
    let active = 0;
    let items = [];
    let itemW = 0, itemH = 0, spacing = 0, total = 0, waveLength = 0, amp = 0, extra = 0;
    let anchorX = 0;
    let textTl = null;
    let textSplits = [];
    let autoplayCall = null;
    let hovering = false;

    if (textWrap) textWrap.setAttribute("aria-live", "polite");

    function getData(index) {
      const tpl = templates[index];
      const name = tpl.querySelector("[data-team-name]");
      const role = tpl.querySelector("[data-team-role]");
      const bio = tpl.querySelector("[data-team-bio]");
      return {
        name: name ? name.textContent : "",
        role: role ? role.textContent : "",
        bio: bio ? bio.innerHTML : ""
      };
    }

    function fillText(index) {
      const data = getData(index);
      if (textName) textName.textContent = data.name;
      if (textRole) textRole.textContent = data.role;
      if (textBio) textBio.innerHTML = data.bio;
    }

    function prepareItem(el, index, isClone) {
      el.dataset.teamIndex = index;
      el.querySelectorAll("img").forEach((img) => img.setAttribute("draggable", "false"));

      if (isClone) {
        el.setAttribute("aria-hidden", "true");
        el.removeAttribute("tabindex");
      } else {
        const data = getData(index);
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", data.name);
      }
    }

    function addSet(isClone) {
      const fragment = document.createDocumentFragment();
      templates.forEach((tpl, index) => {
        const el = tpl.cloneNode(true);
        prepareItem(el, index, isClone);
        fragment.appendChild(el);
      });
      track.appendChild(fragment);
    }

    function measureAnchor() {
      if (useAnchorEl) {
        anchorX = anchorEl.getBoundingClientRect().left - track.getBoundingClientRect().left;
      }
    }

    function build() {
      track.innerHTML = "";
      addSet(false);

      const first = track.firstElementChild;
      itemW = first ? first.offsetWidth : 0;
      itemH = first ? first.offsetHeight : 0;

      if (!itemW || !itemH) {
        console.warn("[team slider] Kan de grootte van de cirkels niet meten. Staat er een width op [data-team-item]?", track);
        items = [];
        gsap.set(track, { visibility: "visible" });
        return;
      }

      spacing = itemW * spacingFactor;
      extra = (activeScale - 1) * itemW;

      const reach = slider.offsetWidth * 2 + spacing * 2 + extra;
      const sets = Math.min(MAX_SETS, Math.max(1, Math.ceil(reach / (count * spacing))));
      for (let i = 1; i < sets; i++) addSet(true);

      items = [...track.children];
      total = items.length * spacing;
      waveLength = spacing * waveItems;
      amp = itemH * waveHeight;

      track.style.height = `${itemH * activeScale + amp * 2}px`;

      items.forEach((el) => {
        el.style.position = "absolute";
        el.style.left = "0";
        el.style.top = "0";
        gsap.set(el, { transformOrigin: "50% 50%" });
        el._setX = gsap.quickSetter(el, "x", "px");
        el._setY = gsap.quickSetter(el, "y", "px");
        el._setSX = gsap.quickSetter(el, "scaleX");
        el._setSY = gsap.quickSetter(el, "scaleY");
      });

      measureAnchor();
      render();
      gsap.set(track, { visibility: "visible" });
    }

    function render() {
      if (!items.length) return;

      const centerY = (track.offsetHeight - itemH) / 2;
      const half = total / 2;
      const baseCenter = useAnchorEl
        ? anchorX + itemW / 2 + extra / 2
        : track.offsetWidth * anchorFraction;

      items.forEach((el, i) => {
        const offset = gsap.utils.wrap(-half, half, (i - state.progress) * spacing);
        const t = offset / spacing;
        const push = Math.abs(t) >= 1 ? Math.sign(t) * 0.5 : t - (t * Math.abs(t)) / 2;
        const pos = offset + push * extra;

        const closeness = Math.max(0, 1 - Math.abs(t));
        const scale = 1 + (activeScale - 1) * closeness;

        el._setX(baseCenter + pos - itemW / 2);
        el._setY(centerY + Math.sin(pos / waveLength * Math.PI * 2) * amp);
        el._setSX(scale);
        el._setSY(scale);
        el.style.zIndex = closeness > 0.5 ? "2" : "1";
      });
    }

    function revertTextSplits() {
      textSplits.forEach((split) => split.revert());
      textSplits = [];
    }

    function splitTextFields() {
      textSplits = textFields.map((field) =>
        SplitText.create(field, {
          type: "lines",
          mask: "lines",
          linesClass: "line"
        })
      );
      return textSplits.flatMap((split) => split.lines);
    }

    function animateText(index, dir) {
      if (!textFields.length) return;

      if (textTl) textTl.kill();
      revertTextSplits();

      if (reducedMotion) {
        fillText(index);
        return;
      }

      if (!hasSplitText) {
        textTl = gsap.timeline();

        textTl.to(textFields, {
          y: `${-1 * dir}rem`,
          autoAlpha: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: "power2.in"
        });

        textTl.call(() => fillText(index));

        textTl.fromTo(textFields,
          { y: `${1 * dir}rem`, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: "expo.out" }
        );
        return;
      }

      const outLines = splitTextFields();

      textTl = gsap.to(outLines, {
        yPercent: -110 * dir,
        duration: 0.4,
        stagger: 0.025,
        ease: "power3.in",
        onComplete: () => {
          revertTextSplits();
          fillText(index);

          const inLines = splitTextFields();
          gsap.set(inLines, { yPercent: 110 * dir });

          textTl = gsap.to(inLines, {
            yPercent: 0,
            duration: 0.8,
            stagger: 0.06,
            ease: "expo.out",
            onComplete: revertTextSplits
          });
        }
      });
    }

    function scheduleAutoplay() {
      if (autoplayCall) autoplayCall.kill();
      autoplayCall = null;
      if (autoplay <= 0 || hovering) return;
      autoplayCall = gsap.delayedCall(autoplay, () => go(1));
    }

    function goTo(target) {
      if (target === targetProgress) return;

      const dir = target > targetProgress ? 1 : -1;
      targetProgress = target;

      gsap.to(state, {
        progress: target,
        duration,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: render
      });

      if (duration === 0) {
        state.progress = target;
        render();
      }

      const newActive = mod(target, count);
      if (newActive !== active) {
        active = newActive;
        animateText(active, dir);
      }

      scheduleAutoplay();
    }

    function go(step) {
      goTo(targetProgress + step);
    }

    function goToIndex(index) {
      let delta = mod(index - active, count);
      if (delta > count / 2) delta -= count;
      if (delta !== 0) goTo(targetProgress + delta);
    }

    if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => go(1));

    track.addEventListener("click", (e) => {
      const item = e.target.closest("[data-team-item]");
      if (!item) return;
      goToIndex(Number(item.dataset.teamIndex));
    });

    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-team-item]")) {
        e.preventDefault();
        goToIndex(Number(e.target.closest("[data-team-item]").dataset.teamIndex));
      }
    });

    let touchStartX = null;

    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      touchStartX = e.clientX;
    });

    track.addEventListener("pointerup", (e) => {
      if (touchStartX === null) return;
      const dx = e.clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    });

    if (autoplay > 0 && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      slider.addEventListener("pointerenter", () => {
        hovering = true;
        scheduleAutoplay();
      });

      slider.addEventListener("pointerleave", () => {
        hovering = false;
        scheduleAutoplay();
      });
    }

    build();
    fillText(0);
    scheduleAutoplay();

    const onResize = debounceOnWidthChange(() => {
      build();
    }, 150);

    window.addEventListener("resize", onResize);

    addCleanup(slider, () => {
      window.removeEventListener("resize", onResize);
      if (autoplayCall) autoplayCall.kill();
      if (textTl) textTl.kill();
      revertTextSplits();
      gsap.killTweensOf(state);
    });
  });
}

function initBigLogoReveal() {
  const logos = nextPage.querySelectorAll(".big_logo");
  if (!logos.length) return;

  if (!hasScrollTrigger) {
    logos.forEach((logo) => {
      logo.style.visibility = "visible";
    });
    return;
  }

  logos.forEach((logo) => {
    if (logo.dataset.logoRevealInitialized === "true") return;
    logo.dataset.logoRevealInitialized = "true";

    const paths = Array.from(logo.querySelectorAll("path")).sort((a, b) => {
      return a.getBBox().x - b.getBBox().x;
    });

    if (!paths.length) {
      gsap.set(logo, { visibility: "visible" });
      return;
    }

    gsap.set(logo, { overflow: "hidden" });
    gsap.set(paths, { yPercent: 110 });
    gsap.set(logo, { visibility: "visible" });

    gsap.to(paths, {
      yPercent: 0,
      duration: 1,
      stagger: 0.04,
      ease: "expo.out",
      scrollTrigger: {
        trigger: logo,
        start: "clamp(top 95%)",
        once: true
      }
    });
  });
}

function initLogoMarquee() {
  nextPage.querySelectorAll(".logo-marquee_track, [data-marquee-track]").forEach((track) => {
    if (track.dataset.marqueeInitialized === "true") return;
    track.dataset.marqueeInitialized = "true";

    const wrapper = track.parentElement;
    if (!wrapper) return;

    const originals = [...track.children].map((child) => child.cloneNode(true));
    if (!originals.length) return;
    if (reducedMotion) return;

    const speedPx = toNumber(track.dataset.marqueeSpeed, 60);
    const baseDirection = track.dataset.marqueeDirection === "right" ? 1 : -1;
    const pauseOnHover = track.dataset.marqueePauseHover === "true";
    const scrollBoost = track.dataset.marqueeScroll === "true";
    const scrollReverse = track.dataset.marqueeScrollReverse === "true";

    const setX = gsap.quickSetter(track, "x", "px");

    let setWidth = 0;
    let travel = 0;
    let speed = 1;
    let pause = 1;
    let hovering = false;
    let isActive = true;
    let direction = baseDirection;
    let started = false;

    function addSet(isClone) {
      const fragment = document.createDocumentFragment();

      originals.forEach((original) => {
        const clone = original.cloneNode(true);

        if (isClone) {
          clone.setAttribute("aria-hidden", "true");
          clone.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
          if (clone.matches("a, button")) clone.setAttribute("tabindex", "-1");
        }

        fragment.appendChild(clone);
      });

      track.appendChild(fragment);
    }

    function build() {
      track.innerHTML = "";
      addSet(false);
      addSet(true);

      const children = track.children;
      setWidth = children[originals.length].offsetLeft - children[0].offsetLeft;
      if (!setWidth) return;

      const needed = Math.min(20, Math.ceil(wrapper.offsetWidth / setWidth) + 1);
      for (let i = 2; i <= needed; i++) addSet(true);

      render();
    }

    function render() {
      if (!setWidth) return;
      setX(gsap.utils.wrap(-setWidth, 0, travel));
    }

    function tick(_, deltaTime) {
      if (!isActive || !setWidth) return;

      pause += ((pauseOnHover && hovering ? 0 : 1) - pause) * 0.06;
      speed += (1 - speed) * 0.05;

      travel += speedPx * speed * pause * direction * deltaTime / 1000;
      render();
    }

    function waitForImages() {
      const imgs = [...track.querySelectorAll("img")];
      imgs.forEach((img) => { img.loading = "eager"; });

      return Promise.all(imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      }));
    }

    if (pauseOnHover && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      wrapper.addEventListener("pointerenter", () => { hovering = true; });
      wrapper.addEventListener("pointerleave", () => { hovering = false; });
    }

    let trigger = null;

    if (hasScrollTrigger) {
      trigger = ScrollTrigger.create({
        trigger: wrapper,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => { isActive = self.isActive; },
        onUpdate: (self) => {
          if (scrollBoost) {
            speed = 1 + Math.abs(self.getVelocity()) * 0.004;
          }
          if (scrollReverse) {
            direction = self.direction === 1 ? baseDirection : -baseDirection;
          }
        }
      });

      isActive = ScrollTrigger.isInViewport(wrapper);
    }

    const onResize = debounceOnWidthChange(() => {
      build();
    }, 150);

    waitForImages().then(() => {
      if (!track.isConnected) return;
      build();
      gsap.ticker.add(tick);
      started = true;
      window.addEventListener("resize", onResize);
    });

    addCleanup(track, () => {
      if (trigger) trigger.kill();
      if (started) gsap.ticker.remove(tick);
      window.removeEventListener("resize", onResize);
    });
  });
}

function initFooterLinkHover() {
  const links = nextPage.querySelectorAll(".footer_link");
  if (!links.length) return;

  links.forEach((link) => {
    if (link.dataset.footerHoverInitialized === "true") return;
    link.dataset.footerHoverInitialized = "true";

    link.addEventListener("mouseenter", () => {
      links.forEach((otherLink) => {
        if (otherLink !== link) {
          gsap.to(otherLink, {
            opacity: 0.3,
            duration: 0.4,
            ease: "expo.out"
          });
        }
      });
    });

    link.addEventListener("mouseleave", () => {
      gsap.to(links, {
        opacity: 1,
        duration: 0.4,
        ease: "expo.out"
      });
    });
  });
}

function initStoriesSwiper() {
  if (typeof Swiper === "undefined") return;

  nextPage.querySelectorAll(".stories-swiper").forEach((swiperEl) => {
    if (swiperEl.swiper) {
      swiperEl.swiper.destroy(true, true);
    }

    const swiper = new Swiper(swiperEl, {
      slidesPerView: "auto",
      slidesPerGroup: 1,
      spaceBetween: 12,
      speed: 700,

      grabCursor: true,
      simulateTouch: true,
      allowTouchMove: true,
      touchStartPreventDefault: false,
      passiveListeners: true,

      threshold: 5,
      longSwipes: true,
      longSwipesRatio: 0.2,
      longSwipesMs: 250,
      followFinger: true,

      watchOverflow: false,
      observer: true,
      observeParents: true,
      resizeObserver: true,

      freeMode: {
        enabled: false
      },

      breakpoints: {
        768: {
          spaceBetween: 16,
          freeMode: {
            enabled: true,
            momentum: true,
            momentumRatio: 0.6,
            sticky: false
          }
        }
      }
    });

    addCleanup(swiperEl, () => swiper.destroy(true, true));
  });
}
