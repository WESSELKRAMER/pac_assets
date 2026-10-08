gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;
let isTransitioning = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const hasSplitText = typeof window.SplitText !== "undefined";
const hasObserver = typeof window.Observer !== "undefined";

if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (hasSplitText) gsap.registerPlugin(SplitText);
if (hasObserver) gsap.registerPlugin(Observer);

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
  if (has(".faq_item")) initFAQAnimation();
  if (has('[data-split="heading"]')) initMaskTextScrollReveal();
  if (has("[data-highlight-text]")) initHighlightText();
  if (has(".floating_img_wrap")) initFloatingImages();
  if (has("[data-wavy-marquee-init]")) initTeamMarquee();
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

function setupTeamDrawer(scope, onOpen, onClose) {
  const drawer = scope.querySelector("[data-team-drawer]");
  if (!drawer) return null;

  const overlay = drawer.querySelector("[data-team-drawer-overlay]");
  const panel = drawer.querySelector("[data-team-drawer-panel]");
  const closeBtn = drawer.querySelector("[data-team-drawer-close]");
  const nameEl = drawer.querySelector("[data-team-drawer-name]");
  const roleEl = drawer.querySelector("[data-team-drawer-role]");
  const bioEl = drawer.querySelector("[data-team-drawer-bio]");
  const imgEl = drawer.querySelector("[data-team-drawer-img]");

  if (!panel) return null;

  panel.setAttribute("data-lenis-prevent", "");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  let isOpen = false;
  let lastFocus = null;

  function open(item) {
    const name = item.querySelector("[data-team-name]");
    const role = item.querySelector("[data-team-role]");
    const bio = item.querySelector("[data-team-bio]");
    const img = item.querySelector("img");

    if (nameEl) nameEl.textContent = name ? name.textContent : "";
    if (roleEl) roleEl.textContent = role ? role.textContent : "";
    if (bioEl) bioEl.innerHTML = bio ? bio.innerHTML : "";

    if (imgEl && img) {
      imgEl.removeAttribute("srcset");
      imgEl.removeAttribute("sizes");
      imgEl.src = img.currentSrc || img.src;
      imgEl.alt = img.alt || (name ? name.textContent : "");
    }

    isOpen = true;
    lastFocus = document.activeElement;
    if (lenis) lenis.stop();
    onOpen();

    gsap.killTweensOf([panel, overlay, panel.children]);
    gsap.set(drawer, { display: "block", visibility: "visible" });
    panel.scrollTop = 0;

    if (overlay) {
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    }

    gsap.fromTo(panel, { xPercent: 110 }, { xPercent: 0, duration: 0.8, ease: "expo.out" });

    gsap.fromTo(panel.children,
      { y: "1rem", autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, delay: 0.15, ease: "expo.out" }
    );

    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    if (lenis) lenis.start();
    onClose();

    gsap.killTweensOf([panel, overlay, panel.children]);

    gsap.to(panel, { xPercent: 110, duration: 0.6, ease: "expo.inOut" });

    if (overlay) {
      gsap.to(overlay, { opacity: 0, duration: 0.5, delay: 0.1, ease: "power2.out" });
    }

    gsap.delayedCall(0.65, () => {
      if (!isOpen) gsap.set(drawer, { display: "none" });
    });

    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  if (overlay) overlay.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);

  function onKey(e) {
    if (e.key === "Escape" && isOpen) close();
  }

  document.addEventListener("keydown", onKey);

  addCleanup(drawer, () => {
    document.removeEventListener("keydown", onKey);
    if (isOpen && lenis) lenis.start();
  });

  return { open, close };
}

function initTeamMarquee() {
  if (!hasScrollTrigger) return;

  nextPage.querySelectorAll("[data-wavy-marquee-init]").forEach((container) => {
    if (container.dataset.wavyInitialized === "true") return;
    container.dataset.wavyInitialized = "true";

    const list = container.querySelector("[data-wavy-marquee-list]");
    if (!list) return;

    const originals = [...list.querySelectorAll("[data-wavy-marquee-item]")].map((item) => item.cloneNode(true));
    if (!originals.length) return;

    const autoSpeed = toNumber(container.dataset.wavySpeed, 60);
    const waveY = toNumber(container.dataset.wavyHeight, 0.12);
    const tilt = toNumber(container.dataset.wavyTilt, 0.6);
    const viewport = [
      [992, 1, 1],
      [768, 0.75, 1],
      [480, 0.6, 0.75],
      [0, 0.5, 0.75]
    ];
    const scrollSpeed = 0.0075;
    const dragSpeed = 0.5;
    const maxDragSpeed = 75;
    const dragEase = 0.1;
    const waveBoost = 0.01;
    const itemsPerWave = 10;
    const waveTravel = 0.25;

    const getViewport = () => viewport.find(([min]) => innerWidth >= min).slice(1);

    const baseDirection = container.dataset.wavyMarqueeDirection === "flipped" ? 1 : -1;
    const setX = gsap.quickSetter(list, "x", "px");
    const fullCircle = Math.PI * 2;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let items = [];
    let loopWidth = 0, waveLength = 0, averageWidth = 1, travel = 0, pausePadding = 0;
    let speed = 1, targetSpeed = 1, direction = baseDirection;
    let isActive = false, isDragging = false;
    let pause = 1;
    let hoverItem = null;
    let drawerOpen = false;
    let dragDistance = 0;
    let [speedScale, waveScale] = getViewport();

    const drawer = setupTeamDrawer(
      container.closest("section") || nextPage,
      () => { drawerOpen = true; },
      () => { drawerOpen = false; }
    ) || setupTeamDrawer(nextPage, () => { drawerOpen = true; }, () => { drawerOpen = false; });

    function prepareItem(item, isClone) {
      item.querySelectorAll("img").forEach((img) => img.setAttribute("draggable", "false"));

      if (isClone) {
        item.setAttribute("aria-hidden", "true");
        item.removeAttribute("tabindex");
      } else {
        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
      }
    }

    function addBatch(isClone) {
      const fragment = document.createDocumentFragment();
      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        prepareItem(clone, isClone);
        fragment.appendChild(clone);
      });
      list.appendChild(fragment);
    }

    if (reducedMotion) {
      list.innerHTML = "";
      addBatch(false);
      container.style.overflowX = "auto";
    } else {
      buildLoop();
    }

    function buildLoop() {
      list.innerHTML = "";

      addBatch(false);
      addBatch(true);

      const firstItems = [...list.querySelectorAll("[data-wavy-marquee-item]")];
      loopWidth = firstItems[originals.length].offsetLeft - firstItems[0].offsetLeft;

      for (let i = 2; i < Math.max(2, Math.ceil(container.offsetWidth / loopWidth) + 1); i++) {
        addBatch(true);
      }

      items = [...list.querySelectorAll("[data-wavy-marquee-item]")];

      const originalItems = firstItems.slice(0, originals.length);
      averageWidth = originalItems.reduce((sum, item) => sum + item.offsetWidth, 0) / originals.length;
      waveLength = Math.max(container.offsetWidth, averageWidth * itemsPerWave) * waveScale;

      let maxHeight = 0;

      for (const item of items) {
        item._x = item.offsetLeft;
        item._width = item.offsetWidth;
        item._height = item.offsetHeight;
        item._settle = 0;
        item._setY = gsap.quickSetter(item, "y", "px");
        item._setR = gsap.quickSetter(item, "rotate", "deg");
        maxHeight = Math.max(maxHeight, item._height);
      }

      pausePadding = maxHeight * (Math.abs(waveY) + 1);
      render();
    }

    function render() {
      if (!loopWidth || !waveLength) return;

      const x = gsap.utils.wrap(-loopWidth, 0, travel);
      const dynamicWaveY = waveY + (speed - 1) * waveBoost;
      const phaseTravel = travel / waveLength * fullCircle * waveTravel;
      const containerWidth = container.offsetWidth;

      setX(x);

      for (const item of items) {
        const itemX = item._x + x;
        if (itemX + item._width < 0 || itemX > containerWidth) continue;

        item._settle += ((item === hoverItem ? 1 : 0) - item._settle) * 0.1;

        const amp = item._height * dynamicWaveY;
        const phase = itemX / waveLength * fullCircle + phaseTravel;
        const y = Math.sin(phase) * amp;
        const slope = Math.cos(phase) * amp * fullCircle / waveLength;
        const rotation = Math.atan(slope) * (180 / Math.PI) * tilt;
        const free = 1 - item._settle;

        item._setY(y * free);
        item._setR(rotation * free);
      }
    }

    function tick(_, deltaTime) {
      if (!isActive || !loopWidth) return;

      const shouldPause = drawerOpen || (hoverItem && !isDragging);
      pause += ((shouldPause ? 0 : 1) - pause) * 0.08;

      speed += ((targetSpeed !== 1 ? targetSpeed : 1) - speed) * dragEase;
      if (targetSpeed !== 1) targetSpeed += (1 - targetSpeed) * dragEase;

      const dragBoost = isDragging || targetSpeed > 1.01;
      travel += autoSpeed * speedScale * speed * direction * deltaTime / 1000 * (dragBoost ? 1 : pause);
      render();
    }

    function setHover(item) {
      if (item === hoverItem) return;

      if (hoverItem) {
        const prevImg = hoverItem.querySelector("img");
        if (prevImg) gsap.to(prevImg, { scale: 1, duration: 0.6, ease: "expo.out", overwrite: "auto" });
      }

      hoverItem = item;

      if (item) {
        const img = item.querySelector("img");
        if (img) gsap.to(img, { scale: 1.06, duration: 0.6, ease: "expo.out", overwrite: "auto" });
      }
    }

    if (canHover && !reducedMotion) {
      list.addEventListener("pointerover", (e) => {
        if (isDragging) return;
        setHover(e.target.closest("[data-wavy-marquee-item]"));
      });

      list.addEventListener("pointerleave", () => setHover(null));
    }

    list.addEventListener("click", (e) => {
      const item = e.target.closest("[data-wavy-marquee-item]");
      if (!item || !drawer) return;
      if (dragDistance > 6) return;
      drawer.open(item);
    });

    list.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest("[data-wavy-marquee-item]");
      if (!item || !drawer) return;
      e.preventDefault();
      drawer.open(item);
    });

    if (reducedMotion) return;

    let observer = null;

    if (hasObserver) {
      observer = Observer.create({
        target: container,
        type: "touch,pointer",
        lockAxis: true,
        onPress: () => {
          dragDistance = 0;
        },
        onChangeX: (self) => {
          if (!isActive || !self.deltaX) return;

          dragDistance += Math.abs(self.deltaX);
          if (dragDistance < 6) return;

          isDragging = true;
          setHover(null);
          container.style.cursor = "grabbing";
          direction = self.deltaX > 0 ? 1 : -1;

          const dragAmount = Math.abs(self.deltaX) / averageWidth * 100 * dragSpeed;
          targetSpeed = Math.min(1 + dragAmount, maxDragSpeed);
        },
        onRelease: () => {
          isDragging = false;
          container.style.cursor = "grab";
        }
      });
    }

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: () => `top-=${pausePadding}px bottom`,
      end: () => `bottom+=${pausePadding}px top`,
      invalidateOnRefresh: true,
      onToggle: (self) => isActive = self.isActive,
      onUpdate: (self) => {
        if (isDragging) return;

        direction = self.direction === 1 ? -baseDirection : baseDirection;
        speed = 1 + Math.abs(self.getVelocity()) * scrollSpeed;
      }
    });

    isActive = ScrollTrigger.isInViewport(container);
    gsap.ticker.add(tick);

    const onResize = debounceOnWidthChange(() => {
      [speedScale, waveScale] = getViewport();
      hoverItem = null;
      buildLoop();
      ScrollTrigger.refresh();
    }, 150);

    window.addEventListener("resize", onResize);

    addCleanup(container, () => {
      if (observer) observer.kill();
      trigger.kill();
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", onResize);
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

      const needed = Math.ceil(wrapper.offsetWidth / setWidth) + 1;
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
