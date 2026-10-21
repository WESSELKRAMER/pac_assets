window.PAC_BUNDLE = "2026-10-21 13:15";
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
  initNavbarSub();
  initMobileMenu();
  initLogoHover();
  initNavCurrentUnderline();
  initDynamicTextCursor();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  applyNavbarPageConfig(nextPage);
  initRichTextClasses();
  if (has("[data-gradient]")) initGradientColors();
  initDynamicCurrentYear();
  initUnselectableText();
  if (has(".home_grid_card, [data-load-fade]")) initLoadFade();
  if (has("[data-animate-line]")) initAnimateLines();
  initCTAAnimation();
  if (has("[data-submit-trigger]")) initSubmitTriggers();
  if (has("[data-team-prev], [data-team-next], [data-arrow-button]")) initArrowButtons();
  if (has(".faq_item")) initFAQAnimation();
  if (has('[data-split="heading"]')) initMaskTextScrollReveal();
  if (has("[data-highlight-text]")) initHighlightText();
  if (has(".floating_img_wrap")) initFloatingImages();
  if (has("[data-image-reveal]")) initImageReveal();
  if (has("[data-wipe-reveal]")) initWipeReveal();
  if (has("[data-open-video]")) initVideoPopup();
  if (has("[data-team-slider]")) initTeamSlider();
  if (has("[data-gallery]")) initGalleries();
  if (has("[data-agenda]")) initAgendaMonths();
  if (has("[data-social-share]")) initSocialShare();
  if (has("[data-filter-link]")) initFilterLinks();
  if (has("[data-breadcrumbs], [data-scroll-row]")) initBreadcrumbs();
  if (has("[data-hover-reveal]")) initHoverReveal();
  if (has("[data-filter]")) initListFilters();
  if (has("[data-domains], .domains_module")) initDomainTabs();
  if (has("[data-stack]")) initStackCards();
  if (has(".big_logo")) initBigLogoReveal();
  if (has(".logo-marquee_track, [data-marquee-track]")) initLogoMarquee();
  if (has(".footer_link")) initFooterLinkHover();
  if (has("[data-blob-section]")) initCursorBlob();
  if (has("[data-slider], .stories-swiper")) initSliders();
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

function markFirstLoadHeadings(container) {
  (container || document).querySelectorAll("h1").forEach((h1) => {
    if (h1.hasAttribute("data-split") || h1.hasAttribute("data-no-split")) return;
    h1.setAttribute("data-split", "heading");
    h1.setAttribute("data-split-immediate", "true");
    h1.setAttribute("data-split-auto", "true");
  });
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
  resetDynamicTextCursor();

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
  debug: false,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      async once(data) {
        initOnceFunctions();
        markFirstLoadHeadings(data.next.container);
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

  const cfg = document.body.dataset;

  lenis = new Lenis({
    lerp: toNumber(cfg.lenisLerp, 0.08),
    wheelMultiplier: toNumber(cfg.lenisWheel, 0.9),
    touchMultiplier: toNumber(cfg.lenisTouch, 1),
    smoothWheel: true,
    syncTouch: false
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
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
  } else {
    window.scrollTo(0, 0);
  }
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
    const tryRefresh = () => {
      if (isTransitioning) return;
      if (lenis && lenis.isScrolling) {
        timer = setTimeout(tryRefresh, 150);
        return;
      }
      if (lenis) lenis.resize();
      ScrollTrigger.refresh();
    };

    timer = setTimeout(tryRefresh, 200);
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

function initNavbarSub() {
  const nav = document.querySelector("[data-navbar]") || document.querySelector(".navbar");
  if (!nav) return;
  const sub = nav.querySelector("[data-navbar-sub], .subfooter_inner");
  if (!sub || sub.dataset.navbarSubInitialized === "true") return;
  sub.dataset.navbarSubInitialized = "true";

  const threshold = toNumber(sub.dataset.navbarSubOffset, 10);
  const duration = reducedMotion ? 0 : toNumber(sub.dataset.navbarSubDuration, 0.6);
  const ease = sub.dataset.navbarSubEase || "power3.inOut";
  const content = Array.from(sub.children);
  let visible = true;
  let tl = null;

  sub.style.overflow = "clip";

  const run = (open) => {
    if (tl) tl.kill();
    const from = sub.offsetHeight;
    gsap.set(sub, { height: "auto" });
    const full = sub.offsetHeight;
    gsap.set(sub, { height: from });

    tl = gsap.timeline({
      onComplete: () => {
        if (open) gsap.set(sub, { clearProps: "height" });
        tl = null;
      }
    });
    tl.to(sub, { height: open ? full : 0, duration, ease }, 0);
    if (content.length) {
      tl.to(
        content,
        open
          ? { opacity: 1, y: 0, duration: duration * 0.7, ease: "power2.out", delay: duration * 0.25 }
          : { opacity: 0, y: -6, duration: duration * 0.4, ease: "power2.in" },
        0
      );
    }
  };

  const show = () => {
    if (visible) return;
    visible = true;
    sub.removeAttribute("inert");
    sub.setAttribute("aria-hidden", "false");
    run(true);
  };

  const hide = () => {
    if (!visible) return;
    visible = false;
    sub.setAttribute("inert", "");
    sub.setAttribute("aria-hidden", "true");
    run(false);
  };

  const check = () => {
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (y > threshold) hide();
    else if (y <= Math.max(1, threshold / 3)) show();
  };

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        check();
      });
    },
    { passive: true }
  );

  check();
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

let cursorEl = null;

function initDynamicTextCursor() {
  const cursor = document.querySelector("[data-cursor]");
  const cursorTextTarget = document.querySelector("[data-cursor-text-target]");

  if (!cursor || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (cursor.dataset.cursorInitialized === "true") return;
  cursor.dataset.cursorInitialized = "true";
  cursorEl = cursor;

  let mouseX = 0;
  let mouseY = 0;
  let hasMouseMoved = false;

  const xTo = gsap.quickTo(cursor, "x", { duration: 0.4, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.4, ease: "power3.out" });

  function updateCursor() {
    const hoverItem = document.elementFromPoint(mouseX, mouseY)?.closest("[data-cursor-hover]");
    const rect = cursor.getBoundingClientRect();

    const isHovering = !!hoverItem;
    const isEdge = rect.right >= window.innerWidth;

    cursor.setAttribute("data-cursor", isHovering ? (isEdge ? "active-edge" : "active") : "");

    if (hoverItem && cursorTextTarget) {
      const text = hoverItem.getAttribute("data-cursor-text");
      if (text) cursorTextTarget.textContent = text;
    }
  }

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    hasMouseMoved = true;

    xTo(mouseX);
    yTo(mouseY);

    requestAnimationFrame(updateCursor);
  });

  window.addEventListener("scroll", () => {
    if (!hasMouseMoved) return;
    requestAnimationFrame(updateCursor);
  }, { passive: true });
}

function resetDynamicTextCursor() {
  if (cursorEl) cursorEl.setAttribute("data-cursor", "");
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

function initRichTextClasses() {
  const BR = "(?:\\s|&nbsp;|<br\\s*\\/?>)*";
  const OPEN = /^[\s ]*(?:<br\s*\/?>[\s ]*)*(?:<(?:em|i)>)?[\s ]*[“"„‘'«][\s ]*(?:<br\s*\/?>[\s ]*)*/i;
  const CLOSE = /[\s ]*(?:<br\s*\/?>[\s ]*)*[”"’'»][\s ]*(?:<\/(?:em|i)>)?[\s ]*(?:<br\s*\/?>[\s ]*)*$/i;
  const SOURCE = new RegExp("(?:(?:<br\\s*\\/?>[\\s\u00a0]*)+|[”\"’'][\\s\u00a0]*)(?:<(?:em|i)>)?[\\s\u00a0]*[—–-][\\s\u00a0]*([^<>—–]{2,80}?)[\\s\u00a0]*(?:<\\/(?:em|i)>)?" + BR + "$", "i");
  const SOURCE_EM = new RegExp("(?:<br\\s*\\/?>[\\s\u00a0]*)+<(em|i)>[\\s\u00a0]*([^<>]{2,80}?)[\\s\u00a0]*<\\/\\1>" + BR + "$", "i");

  const cleanQuote = (html) => {
    let q = html.trim();
    q = q.replace(OPEN, "").replace(CLOSE, "");
    q = q.replace(new RegExp("^" + BR), "").replace(new RegExp(BR + "$"), "");
    const wrapped = q.match(/^<(em|i)>([\s\S]*)<\/\1>$/i);
    if (wrapped && !/<(em|i)>/i.test(wrapped[2])) q = wrapped[2];
    return q.replace(OPEN, "").replace(CLOSE, "").trim();
  };

  nextPage.querySelectorAll(".rich-text, .w-richtext").forEach((rt) => {
    const quoteClass = (rt.dataset.rtQuoteClass ?? "display_text_medium").trim();

    rt.querySelectorAll("blockquote").forEach((bq) => {
      if (bq.dataset.rtQuoteDone === "true") return;
      bq.dataset.rtQuoteDone = "true";

      if (quoteClass) quoteClass.split(/\s+/).forEach((c) => bq.classList.add(c));

      let html = bq.innerHTML;
      let source = "";
      const m = html.match(SOURCE);
      const mEm = m ? null : html.match(SOURCE_EM);
      if (m && m.index > 0) {
        source = m[1].trim();
        html = html.slice(0, m.index);
      } else if (mEm && mEm.index > 0) {
        source = mEm[2].trim();
        html = html.slice(0, mEm.index);
      }

      const quote = cleanQuote(html);
      if (!quote) return;

      const splitAttr = rt.dataset.rtQuoteSplit === "false" ? "" : ' data-split="heading"';
      bq.innerHTML =
        `<span class="rt-quote_text"${splitAttr}>“${quote}”</span>` +
        (source ? `<cite class="rt-quote_source">${source}</cite>` : "");
    });
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

function initLoadFade() {
  const elements = nextPage.querySelectorAll(".home_grid_card, [data-load-fade]");
  if (!elements.length) return;

  if (reducedMotion) {
    gsap.set(elements, { autoAlpha: 1 });
    return;
  }

  const isFirstLoad = nextPage === document;
  const groups = new Map();

  elements.forEach((el) => {
    if (el.dataset.loadFadeInitialized === "true") return;
    el.dataset.loadFadeInitialized = "true";

    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });

  groups.forEach((list, parent) => {
    const delay = toNumber(parent.dataset.loadDelay, isFirstLoad ? 0.1 : 0.35);
    const stagger = toNumber(parent.dataset.loadStagger, 0.12);
    const duration = toNumber(parent.dataset.loadDuration, 1);

    gsap.fromTo(list,
      { autoAlpha: 0, y: "2rem" },
      {
        autoAlpha: 1,
        y: 0,
        duration,
        stagger,
        delay,
        ease: "expo.out",
        clearProps: "transform"
      }
    );
  });
}

function initAnimateLines() {
  const lines = nextPage.querySelectorAll("[data-animate-line]");
  if (!lines.length) return;

  if (reducedMotion) {
    gsap.set(lines, { visibility: "visible" });
    return;
  }

  const origins = {
    left: "0% 50%",
    right: "100% 50%",
    top: "50% 0%",
    bottom: "50% 100%",
    center: "50% 50%"
  };

  lines.forEach((line) => {
    if (line.dataset.lineInitialized === "true") return;
    line.dataset.lineInitialized = "true";

    const type = (line.dataset.animateLine || "width").toLowerCase();
    const isVertical = ["height", "y", "vertical"].includes(type);
    const prop = isVertical ? "scaleY" : "scaleX";

    const originKey = (line.dataset.lineOrigin || (isVertical ? "top" : "left")).toLowerCase();
    const origin = origins[originKey] || origins.center;

    const duration = toNumber(line.dataset.lineDuration, 1.2);
    const delay = toNumber(line.dataset.lineDelay, 0);
    const ease = line.dataset.lineEase || "expo.out";
    const start = line.dataset.lineStart || "top 85%";
    const end = line.dataset.lineEnd || "bottom 60%";
    const immediate = line.dataset.lineImmediate === "true";
    const scrub = line.dataset.lineScrub === "true";

    gsap.set(line, { transformOrigin: origin, [prop]: 0, visibility: "visible" });

    if (immediate || !hasScrollTrigger) {
      gsap.to(line, { [prop]: 1, duration, delay, ease });
      return;
    }

    if (scrub) {
      gsap.to(line, {
        [prop]: 1,
        ease: "none",
        scrollTrigger: {
          trigger: line,
          start: `clamp(${start})`,
          end: `clamp(${end})`,
          scrub: true
        }
      });
      return;
    }

    gsap.to(line, {
      [prop]: 1,
      duration,
      delay,
      ease,
      scrollTrigger: {
        trigger: line,
        start: `clamp(${start})`,
        once: true
      }
    });
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

      let played = false;
      let checks = 0;
      let checkTimer = null;

      const linesAreBroken = (inst) => {
        const lines = inst.lines || [];
        if (lines.length < 2) return false;
        const heights = lines.map((l) => l.offsetHeight).filter((h) => h > 0);
        if (!heights.length) return false;
        const single = Math.min(...heights);
        return heights.some((h) => h > single * 1.5);
      };

      const scheduleCheck = (inst) => {
        clearTimeout(checkTimer);
        checkTimer = setTimeout(() => {
          if (!heading.isConnected || checks >= 6) return;
          if (linesAreBroken(inst)) {
            checks++;
            if (typeof inst.split === "function") inst.split();
          }
        }, 150);
      };

      const instance = SplitText.create(heading, {
        type: typesToSplit.join(", "),
        mask: "lines",
        autoSplit: true,
        linesClass: "line",
        wordsClass: "word",
        charsClass: "letter",

        onSplit(inst) {
          const targets = inst[type];
          gsap.set(heading, { autoAlpha: 1 });
          scheduleCheck(inst);

          const release = () => {
            heading.setAttribute("data-split-done", "");
            [...(inst.masks || []), ...(inst.lines || [])].forEach((el) => (el.style.overflow = "visible"));
          };

          if (played) {
            release();
            return;
          }
          if (!targets || !targets.length) return;

          const animation = {
            yPercent: 110,
            duration,
            stagger,
            delay,
            ease,
            onComplete: () => {
              played = true;
              release();
            }
          };

          return isImmediate
            ? gsap.from(targets, animation)
            : gsap.from(targets, {
                ...animation,
                scrollTrigger: {
                  trigger: heading,
                  start: `clamp(${start})`,
                  once: true
                }
              });
        }
      });

      const recheck = () => scheduleCheck(instance);
      if (document.readyState !== "complete") window.addEventListener("load", recheck, { once: true });
      document.fonts.addEventListener?.("loadingdone", recheck);

      addCleanup(heading, () => {
        clearTimeout(checkTimer);
        window.removeEventListener("load", recheck);
        document.fonts.removeEventListener?.("loadingdone", recheck);
        instance.revert();
      });
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

const CLIP_OVERFLOW = typeof CSS !== "undefined" && CSS.supports && CSS.supports("overflow", "clip") ? "clip" : "hidden";

function initImageReveal() {
  const elements = Array.from(nextPage.querySelectorAll("[data-image-reveal]")).filter(
    (el) => el.dataset.imageRevealInitialized !== "true"
  );
  if (!elements.length) return;

  if (reducedMotion || !hasScrollTrigger) {
    elements.forEach((el) => {
      el.dataset.imageRevealInitialized = "true";
      gsap.set(el, { visibility: "visible" });
    });
    return;
  }

  const isFirstLoad = nextPage === document;
  const CURTAIN_COLOR = "var(--pac-dark--900, #141414)";

  const lerp = (a, b, t) => a + (b - a) * t;

  function getRadius(wrap, img) {
    let radius = parseFloat(getComputedStyle(wrap).borderTopLeftRadius) || 0;
    if (!radius && img) radius = parseFloat(getComputedStyle(img).borderTopLeftRadius) || 0;
    return radius;
  }

  function buildReveal(wrap) {
    wrap.dataset.imageRevealInitialized = "true";

    const type = (wrap.dataset.imageReveal || "clip").toLowerCase();
    const img = wrap.querySelector("[data-reveal-img]") || wrap.querySelector("img");
    const radius = getRadius(wrap, img);

    const defaults = {
      clip: { direction: "up", duration: 1.2, ease: "expo.out", zoom: 1.2 },
      circle: { direction: "center", duration: 1.4, ease: "expo.inOut", zoom: 1.3 },
      curtain: { direction: "right", duration: 1.4, ease: "power3.inOut", zoom: 1.15 }
    };
    const d = defaults[type] || defaults.clip;

    const direction = (wrap.dataset.revealDirection || d.direction).toLowerCase();
    const duration = toNumber(wrap.dataset.revealDuration, d.duration);
    const ease = wrap.dataset.revealEase || d.ease;
    const zoom = toNumber(wrap.dataset.revealZoom, d.zoom);
    const parallax = Math.max(0, toNumber(wrap.dataset.revealParallax, 0));
    const endScale = parallax > 0 ? 1 + parallax * 2 : 1;

    if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
    wrap.style.overflow = CLIP_OVERFLOW;

    if (img) {
      gsap.set(img, {
        scale: Math.max(zoom, endScale),
        transformOrigin: "50% 50%",
        willChange: "transform"
      });
    }

    const tl = gsap.timeline({ paused: true });
    const state = { p: 0 };
    let curtain = null;

    if (type === "circle") {
      const startSize = toNumber(wrap.dataset.revealCircleSize, 0.2);

      const applyCircle = () => {
        const w = wrap.offsetWidth;
        const h = wrap.offsetHeight;
        const s = Math.min(w, h) * startSize;
        const insetX = ((w - s) / 2) * (1 - state.p);
        const insetY = ((h - s) / 2) * (1 - state.p);
        const r = lerp(s / 2, radius, state.p);
        wrap.style.clipPath = `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px round ${r}px)`;
      };

      applyCircle();

      tl.to(state, {
        p: 1,
        duration,
        ease,
        onStart: applyCircle,
        onUpdate: applyCircle,
        onComplete: () => {
          wrap.style.clipPath = "";
        }
      }, 0);
    } else if (type === "curtain") {
      const horizontal = direction === "left" || direction === "right";
      const from = { right: "0% 50%", left: "100% 50%", down: "50% 0%", up: "50% 100%" };
      const to = { right: "100% 50%", left: "0% 50%", down: "50% 100%", up: "50% 0%" };
      const prop = horizontal ? "scaleX" : "scaleY";

      curtain = document.createElement("div");
      curtain.setAttribute("aria-hidden", "true");
      curtain.className = "image-reveal_curtain";
      Object.assign(curtain.style, {
        position: "absolute",
        inset: "0",
        background: CURTAIN_COLOR,
        zIndex: "2",
        pointerEvents: "none",
        borderRadius: "inherit"
      });
      wrap.appendChild(curtain);

      const content = Array.from(wrap.children).filter((el) => el !== curtain);
      gsap.set(content, { autoAlpha: 0 });
      gsap.set(curtain, { [prop]: 0, transformOrigin: from[direction] || from.right });

      tl.to(curtain, { [prop]: 1, duration: duration * 0.5, ease: "power3.in" }, 0)
        .set(content, { autoAlpha: 1 })
        .set(curtain, { transformOrigin: to[direction] || to.right })
        .to(curtain, { [prop]: 0, duration: duration * 0.6, ease: "power3.out" });
    } else {
      const insets = {
        up: (v) => `inset(${v}% 0% 0% 0% round ${radius}px)`,
        down: (v) => `inset(0% 0% ${v}% 0% round ${radius}px)`,
        left: (v) => `inset(0% 0% 0% ${v}% round ${radius}px)`,
        right: (v) => `inset(0% ${v}% 0% 0% round ${radius}px)`,
        center: (v) => `inset(${v / 2}% ${v / 2}% ${v / 2}% ${v / 2}% round ${radius}px)`
      };
      const build = insets[direction] || insets.up;

      const applyClip = () => {
        wrap.style.clipPath = build(100 - state.p * 100);
      };
      applyClip();

      tl.to(state, {
        p: 1,
        duration,
        ease,
        onUpdate: applyClip,
        onComplete: () => {
          wrap.style.clipPath = "";
        }
      }, 0);
    }

    if (img) {
      const imgStart = type === "curtain" ? duration * 0.5 : 0;
      tl.to(img, {
        scale: endScale,
        duration: duration * 1.3,
        ease: "expo.out"
      }, imgStart);
    }

    gsap.set(wrap, { visibility: "visible" });

    let parallaxTween = null;
    if (img && parallax > 0) {
      parallaxTween = gsap.fromTo(
        img,
        { yPercent: -parallax * 100 },
        {
          yPercent: parallax * 100,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    }

    addCleanup(wrap, () => {
      tl.kill();
      if (parallaxTween) parallaxTween.kill();
      if (curtain) curtain.remove();
    });

    return tl;
  }

  const groups = new Map();
  elements.forEach((el) => {
    const group = el.closest("[data-reveal-stagger]");
    const key = group || el;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });

  groups.forEach((list, trigger) => {
    const isGroup = trigger.hasAttribute("data-reveal-stagger");
    const stagger = isGroup ? toNumber(trigger.dataset.revealStagger, 0.12) : 0;
    const source = isGroup ? trigger : list[0];

    const immediate = (source.dataset.revealImmediate || list[0].dataset.revealImmediate) === "true";
    const baseDelay = toNumber(
      source.dataset.revealDelay ?? list[0].dataset.revealDelay,
      immediate ? (isFirstLoad ? 0.2 : 0.5) : 0
    );
    const start = source.dataset.revealStart || list[0].dataset.revealStart || "top 85%";

    const master = gsap.timeline({ paused: true });
    list.forEach((wrap, i) => {
      const tl = buildReveal(wrap);
      tl.paused(false);
      master.add(tl, baseDelay + i * stagger);
    });

    if (immediate) {
      master.play();
    } else {
      ScrollTrigger.create({
        trigger: source,
        start: `clamp(${start})`,
        once: true,
        onEnter: () => master.play()
      });
    }

    addCleanup(source, () => master.kill());
  });
}

function initWipeReveal() {
  const elements = Array.from(nextPage.querySelectorAll("[data-wipe-reveal]")).filter(
    (el) => el.dataset.wipeInitialized !== "true"
  );
  if (!elements.length) return;

  const wipeVars = (direction) => {
    switch ((direction || "left").toLowerCase()) {
      case "right":
        return { from: { xPercent: 0 }, to: { xPercent: 100 } };
      case "top":
        return { from: { yPercent: 0 }, to: { yPercent: -100 } };
      case "bottom":
        return { from: { yPercent: 0 }, to: { yPercent: 100 } };
      default:
        return { from: { xPercent: 0 }, to: { xPercent: -100 } };
    }
  };

  elements.forEach((el) => {
    el.dataset.wipeInitialized = "true";

    if (reducedMotion || !hasScrollTrigger) {
      gsap.set(el, { visibility: "visible" });
      return;
    }

    const style = getComputedStyle(el);
    if (style.position === "static") el.style.position = "relative";
    if (style.overflow === "visible") el.style.overflow = CLIP_OVERFLOW;

    let overlay = el.querySelector(":scope > .wipe_overlay");
    const isNew = !overlay;

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "wipe_overlay";
      overlay.setAttribute("aria-hidden", "true");
      Object.assign(overlay.style, {
        position: "absolute",
        inset: "0",
        zIndex: "2",
        pointerEvents: "none"
      });
      el.appendChild(overlay);
    }

    overlay.style.background =
      style.getPropertyValue("--wipe-color").trim() || "var(--pac-dark--900, #141414)";

    const { from, to } = wipeVars(el.getAttribute("data-wipe-reveal"));
    const duration = toNumber(el.dataset.wipeDuration, 1.1);
    const delay = toNumber(el.dataset.wipeDelay, 0);
    const ease = el.dataset.wipeEase || "power2.out";
    const start = el.dataset.wipeStart || "top 80%";

    gsap.set(overlay, from);
    gsap.set(el, { visibility: "visible" });

    let played = false;
    let tween = null;

    const play = () => {
      if (played) return;
      played = true;
      tween = gsap.to(overlay, { ...to, duration, delay, ease, overwrite: "auto" });
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: play,
      onRefresh: (self) => {
        if (!played && self.isActive) play();
      }
    });

    addCleanup(el, () => {
      if (tween) tween.kill();
      st.kill();
      if (isNew) overlay.remove();
    });
  });
}

function initGalleries() {
  const galleries = Array.from(nextPage.querySelectorAll("[data-gallery]")).filter(
    (el) => el.dataset.galleryInitialized !== "true"
  );
  if (!galleries.length) return;

  const getImg = (el) => (el.tagName === "IMG" ? el : el.querySelector("img"));

  galleries.forEach((gallery) => {
    gallery.dataset.galleryInitialized = "true";

    const own = (selector) =>
      Array.from(gallery.querySelectorAll(selector)).filter((el) => el.closest("[data-gallery]") === gallery);
    const first = (selector) => own(selector)[0] || null;

    const items = own("[data-gallery-item]").filter((item) => getImg(item));
    const count = items.length;

    if (!count) {
      if (gallery.dataset.galleryHideEmpty !== "false") gallery.style.display = "none";
      return;
    }

    const main = first("[data-gallery-main]") || items[0].parentElement;
    const prevBtns = own("[data-gallery-prev]");
    const nextBtns = own("[data-gallery-next]");
    const currentEls = own("[data-gallery-current]");
    const totalEls = own("[data-gallery-total]");
    const captionEls = own("[data-gallery-caption]");
    const thumbsWrap = first("[data-gallery-thumbs]");

    const loop = gallery.dataset.galleryLoop !== "false";
    const duration = reducedMotion ? 0 : toNumber(gallery.dataset.galleryDuration, 0.6);
    const zoom = toNumber(gallery.dataset.galleryZoom, 1);
    const pad = Math.max(0, Math.round(toNumber(gallery.dataset.galleryPad, 0)));
    const swipe = gallery.dataset.gallerySwipe !== "false";
    const keyboard = gallery.dataset.galleryKeyboard !== "false";
    const activeClass = gallery.dataset.galleryActiveClass || "is-active";
    const disabledClass = gallery.dataset.galleryDisabledClass || "is-disabled";
    const start = Math.min(count - 1, Math.max(0, Math.round(toNumber(gallery.dataset.galleryStart, 1)) - 1));

    const format = (n) => String(n).padStart(pad, "0");
    totalEls.forEach((el) => (el.textContent = format(count)));

    if (getComputedStyle(main).position === "static") main.style.position = "relative";
    main.style.overflow = "clip";

    items.forEach((item) => {
      Object.assign(item.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
      const img = getImg(item);
      Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
      img.setAttribute("draggable", "false");
    });

    Array.from(main.children).forEach((child) => {
      if (items.some((item) => child.contains(item))) return;
      const cs = getComputedStyle(child);
      if (cs.position === "static") child.style.position = "relative";
      if (cs.zIndex === "auto" || parseInt(cs.zIndex, 10) < 3) child.style.zIndex = "3";
    });

    if (count === 1) {
      gallery.dataset.gallerySingle = "true";
      [...prevBtns, ...nextBtns].forEach((el) => (el.style.display = "none"));
      if (thumbsWrap) thumbsWrap.style.display = "none";
    }

    let thumbs = [];
    if (thumbsWrap && count > 1) {
      const existing = Array.from(thumbsWrap.querySelectorAll("[data-gallery-thumb]"));

      if (existing.length > 1) {
        thumbs = existing.slice(0, count);
      } else {
        const template = existing[0] || null;
        if (template) template.remove();

        thumbs = items.map((item) => {
          const source = getImg(item);
          let thumb;
          if (template) {
            thumb = template.cloneNode(true);
          } else {
            thumb = document.createElement("button");
            thumb.type = "button";
            thumb.className = "gallery_thumb";
          }
          let img = getImg(thumb);
          if (!img) {
            img = document.createElement("img");
            thumb.appendChild(img);
          }
          img.src = source.currentSrc || source.src;
          if (source.srcset) img.srcset = source.srcset;
          img.sizes = "160px";
          img.alt = "";
          img.loading = "lazy";
          img.setAttribute("draggable", "false");
          thumbsWrap.appendChild(thumb);
          return thumb;
        });
      }

      thumbs.forEach((thumb, i) => {
        if (thumb.tagName !== "BUTTON" && thumb.tagName !== "A") {
          thumb.setAttribute("role", "button");
          thumb.setAttribute("tabindex", "0");
        }
        thumb.setAttribute("aria-label", `Foto ${i + 1} van ${count}`);
        thumb.style.cursor = "pointer";
      });
    }

    let current = -1;
    let activeTween = null;

    const scrollThumbIntoView = (thumb) => {
      if (!thumb || !thumbsWrap) return;
      if (thumbsWrap.scrollWidth <= thumbsWrap.clientWidth) return;
      const left = thumb.offsetLeft - thumbsWrap.offsetLeft - (thumbsWrap.clientWidth - thumb.offsetWidth) / 2;
      thumbsWrap.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
    };

    const updateControls = () => {
      currentEls.forEach((el) => (el.textContent = format(current + 1)));

      const caption = items[current].dataset.galleryCaption || getImg(items[current]).alt || "";
      captionEls.forEach((el) => {
        el.textContent = caption;
        el.style.display = caption ? "" : "none";
      });

      thumbs.forEach((thumb, i) => {
        const on = i === current;
        thumb.classList.toggle(activeClass, on);
        thumb.setAttribute("aria-current", on ? "true" : "false");
      });
      scrollThumbIntoView(thumbs[current]);

      if (!loop) {
        const atStart = current === 0;
        const atEnd = current === count - 1;
        prevBtns.forEach((el) => {
          el.classList.toggle(disabledClass, atStart);
          el.setAttribute("aria-disabled", atStart ? "true" : "false");
        });
        nextBtns.forEach((el) => {
          el.classList.toggle(disabledClass, atEnd);
          el.setAttribute("aria-disabled", atEnd ? "true" : "false");
        });
      }
    };

    const go = (index, animate = true) => {
      if (loop) index = (index + count) % count;
      if (index < 0 || index >= count || index === current) return;

      const prev = current;
      current = index;

      items.forEach((item, i) => {
        item.setAttribute("aria-hidden", i === current ? "false" : "true");
        item.style.zIndex = i === current ? "2" : i === prev ? "1" : "0";
      });

      if (activeTween) activeTween.progress(1);

      const incoming = items[current];
      const incomingImg = getImg(incoming);

      if (!animate || prev < 0 || !duration) {
        items.forEach((item, i) => gsap.set(item, { opacity: i === current ? 1 : 0 }));
        gsap.set(incomingImg, { scale: 1 });
      } else {
        const outgoing = items[prev];
        activeTween = gsap.timeline({
          onComplete: () => {
            items.forEach((item, i) => {
              if (i !== current) gsap.set(item, { opacity: 0 });
            });
            activeTween = null;
          }
        });
        activeTween
          .fromTo(incoming, { opacity: 0 }, { opacity: 1, duration, ease: "power1.inOut" }, 0)
          .set(outgoing, { opacity: 0 }, duration);
      }

      updateControls();
    };

    const next = () => go(current + 1);
    const prev = () => go(current - 1);

    const listeners = [];
    const on = (el, type, fn, opts) => {
      el.addEventListener(type, fn, opts);
      listeners.push(() => el.removeEventListener(type, fn, opts));
    };

    prevBtns.forEach((el) =>
      on(el, "click", (e) => {
        e.preventDefault();
        prev();
      })
    );
    nextBtns.forEach((el) =>
      on(el, "click", (e) => {
        e.preventDefault();
        next();
      })
    );

    thumbs.forEach((thumb, i) => {
      on(thumb, "click", (e) => {
        e.preventDefault();
        go(i);
      });
      on(thumb, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go(i);
        }
      });
    });

    if (keyboard && count > 1) {
      if (!gallery.hasAttribute("tabindex")) gallery.setAttribute("tabindex", "-1");
      on(gallery, "keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          next();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          prev();
        }
      });
    }

    if (swipe && count > 1) {
      let startX = 0;
      let startY = 0;
      let tracking = false;
      main.style.touchAction = "pan-y";

      on(main, "pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        tracking = true;
        startX = e.clientX;
        startY = e.clientY;
      });
      on(main, "pointerup", (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) next();
          else prev();
        }
      });
      on(main, "pointercancel", () => (tracking = false));
    }

    gallery.setAttribute("role", "region");
    if (!gallery.hasAttribute("aria-label")) gallery.setAttribute("aria-label", "Fotogalerij");

    go(start, false);

    if (zoom !== 1) {
      const zoomIn = () => {
        if (!duration) return;
        gsap.fromTo(getImg(items[current]), { scale: zoom }, { scale: 1, duration: duration * 1.5, ease: "power2.out" });
      };
      [...prevBtns, ...nextBtns, ...thumbs].forEach((el) => on(el, "click", zoomIn));
    }

    addCleanup(gallery, () => {
      listeners.forEach((off) => off());
      if (activeTween) activeTween.kill();
    });
  });
}

function initAgendaMonths() {
  const roots = Array.from(nextPage.querySelectorAll("[data-agenda]")).filter(
    (el) => el.dataset.agendaInitialized !== "true"
  );
  if (!roots.length) return;

  const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  const MONTHS_EN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  const parseDate = (value) => {
    const v = (value || "").trim();
    if (!v) return null;
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
    if (m) {
      const a = +m[1];
      const b = +m[2];
      return v.includes("/") && a <= 12 ? new Date(+m[3], a - 1, b) : new Date(+m[3], b - 1, a);
    }
    const lower = v.toLowerCase();
    const nl = MONTHS.findIndex((name) => lower.includes(name));
    const en = MONTHS_EN.findIndex((name) => lower.includes(name));
    const monthIndex = nl !== -1 ? nl : en;
    const year = lower.match(/\d{4}/);
    const day = lower.replace(/\d{4}/, "").match(/\d{1,2}/);
    if (monthIndex !== -1 && year) return new Date(+year[0], monthIndex, day ? +day[0] : 1);
    const t = Date.parse(v);
    return isNaN(t) ? null : new Date(t);
  };

  const keyOf = (d) => d.getFullYear() * 12 + d.getMonth();
  const labelOf = (key) => {
    const name = MONTHS[key % 12];
    return name.charAt(0).toUpperCase() + name.slice(1) + " " + Math.floor(key / 12);
  };

  roots.forEach((root) => {
    root.dataset.agendaInitialized = "true";

    const items = Array.from(root.querySelectorAll("[data-agenda-item]"))
      .map((el) => {
        const source = el.hasAttribute("data-agenda-date") ? el : el.querySelector("[data-agenda-date]");
        const date = source ? parseDate(source.getAttribute("data-agenda-date") || source.textContent) : null;
        if (!date) console.warn("[agenda] Geen geldige datum gevonden", el);
        return { el, date, key: date ? keyOf(date) : null };
      })
      .filter((item) => item.date);

    const labels = Array.from(root.querySelectorAll("[data-agenda-month]"));
    const prevBtns = Array.from(root.querySelectorAll("[data-agenda-prev]"));
    const nextBtns = Array.from(root.querySelectorAll("[data-agenda-next]"));
    const empties = Array.from(root.querySelectorAll("[data-agenda-empty]"));
    const disabledClass = root.dataset.agendaDisabledClass || "is-disabled";
    const order = root.dataset.agendaOrder === "desc" ? -1 : 1;
    const skipEmpty = root.dataset.agendaSkipEmpty !== "false";
    const duration = reducedMotion ? 0 : toNumber(root.dataset.agendaDuration, 0.6);
    const stagger = toNumber(root.dataset.agendaStagger, 0.08);

    const parents = new Set(items.map((item) => item.el.parentElement));
    parents.forEach((parent) => {
      items
        .filter((item) => item.el.parentElement === parent)
        .sort((a, b) => (a.date - b.date) * order)
        .forEach((item) => parent.appendChild(item.el));
    });

    const today = new Date();
    const currentKey = keyOf(today);
    const startAttr = root.dataset.agendaStart ? parseDate(root.dataset.agendaStart + "-01") : null;
    const startKey = startAttr ? keyOf(startAttr) : currentKey;

    // Vaste modus: alleen de huidige maand als label, geen bladeren tussen maanden.
    // Actief met data-agenda-mode="current", of automatisch als er geen vorige/volgende-knoppen zijn.
    const staticMode = root.dataset.agendaMode === "current" || (!prevBtns.length && !nextBtns.length);
    if (staticMode) {
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const when = (root.dataset.agendaWhen || "").toLowerCase();
      const onlyMonth = root.dataset.agendaFilter === "month";

      const visible = items.filter((item) => {
        const t = item.date.getTime();
        if (when === "upcoming" && t < startOfToday) return false;
        if (when === "past" && t >= startOfToday) return false;
        if (onlyMonth && item.key !== currentKey) return false;
        return true;
      });
      const show = new Set(visible.map((item) => item.el));
      items.forEach((item) => (item.el.style.display = show.has(item.el) ? "" : "none"));
      empties.forEach((el) => (el.style.display = visible.length ? "none" : ""));

      const label = labelOf(currentKey);
      labels.forEach((el) => (el.textContent = label));
      nextPage.querySelectorAll("[data-agenda-month]").forEach((el) => {
        if (!el.closest("[data-agenda]")) el.textContent = label;
      });
      [...prevBtns, ...nextBtns].forEach((el) => (el.style.display = "none"));
      root.dataset.agendaCurrent = String(currentKey);

      if (hasLenis && lenis) lenis.resize();
      if (hasScrollTrigger) ScrollTrigger.refresh();
      return;
    }

    let months;
    const itemKeys = items.map((item) => item.key);
    if (skipEmpty) {
      months = Array.from(new Set([...itemKeys, startKey])).sort((a, b) => a - b);
    } else {
      const min = Math.min(startKey, ...itemKeys);
      const max = Math.max(startKey, ...itemKeys);
      months = [];
      for (let k = min; k <= max; k++) months.push(k);
    }

    // Alleen vooruit bladeren: data-agenda-range="future" of data-agenda-when="upcoming"
    const futureOnly = root.dataset.agendaRange === "future" || (root.dataset.agendaWhen || "").toLowerCase() === "upcoming";
    if (futureOnly) {
      // Altijd vooruit kunnen klikken, ook naar maanden zonder events
      const ahead = Math.max(1, Math.round(toNumber(root.dataset.agendaMonthsAhead, 12)));
      const futureKeys = itemKeys.filter((k) => k >= currentKey);
      const last = Math.max(currentKey + ahead - 1, ...futureKeys);
      months = [];
      for (let k = currentKey; k <= last; k++) months.push(k);
    }

    let index = -1;
    let tl = null;

    const setLabel = (key) => labels.forEach((el) => (el.textContent = labelOf(key)));

    const updateButtons = () => {
      const inRange = typeof range !== "undefined" && range.from;
      const atStart = inRange ? keyOf(new Date(range.from)) <= months[0] : index <= 0;
      const atEnd = inRange ? keyOf(new Date(range.to || range.from)) >= months[months.length - 1] : index >= months.length - 1;
      prevBtns.forEach((el) => {
        el.classList.toggle(disabledClass, atStart);
        el.setAttribute("aria-disabled", atStart ? "true" : "false");
      });
      nextBtns.forEach((el) => {
        el.classList.toggle(disabledClass, atEnd);
        el.setAttribute("aria-disabled", atEnd ? "true" : "false");
      });
    };

    const refreshLayout = () => {
      if (hasLenis && lenis) lenis.resize();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    };

    // Wissel naar een set zichtbare items met een label (maand of periode)
    const transition = (show, labelText, animate) => {
      if (tl) tl.progress(1);
      const showSet = new Set(show);
      const visibleNow = items.filter((item) => item.el.style.display !== "none").map((item) => item.el);

      const swap = () => {
        items.forEach((item) => (item.el.style.display = showSet.has(item.el) ? "" : "none"));
        empties.forEach((el) => (el.style.display = show.length ? "none" : ""));
        labels.forEach((el) => (el.textContent = labelText));
        updateButtons();
        refreshLayout();
      };

      if (!animate || !duration) {
        swap();
        return;
      }

      const visibleEmpties = empties.filter((el) => el.style.display !== "none");

      tl = gsap.timeline({ onComplete: () => (tl = null) });
      tl.to([...labels, ...visibleNow], { autoAlpha: 0, y: -8, duration: 0.25, ease: "power2.in" }, 0);
      if (visibleEmpties.length) tl.to(visibleEmpties, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, 0);
      tl.add(swap)
        .set(visibleNow, { y: 0, autoAlpha: 1 })
        .set(empties, { autoAlpha: 1 })
        .fromTo(labels, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration, ease: "power2.out" });

      if (show.length) {
        tl.fromTo(
          show,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration, stagger, ease: "power2.out", clearProps: "opacity,visibility,transform" },
          "<0.05"
        );
      } else if (empties.length) {
        tl.fromTo(
          empties,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration, ease: "power1.out", clearProps: "opacity,visibility" },
          "<0.05"
        );
      }
    };

    // Datumprikker in de agenda: [data-filter-datepicker] of [data-agenda-datepicker] binnen de wrapper
    const range = { from: 0, to: 0 };
    const pickers = [];
    const refreshPickers = () => pickers.forEach((p) => p.refresh());

    const go = (newIndex, animate = true) => {
      if (newIndex < 0 || newIndex >= months.length || (newIndex === index && !range.from)) return;
      const key = months[newIndex];
      index = newIndex;
      range.from = 0;
      range.to = 0;
      root.removeAttribute("data-agenda-range");
      root.dataset.agendaCurrent = String(key);
      transition(items.filter((item) => item.key === key).map((item) => item.el), labelOf(key), animate);
      refreshPickers();
    };

    const showRange = (animate = true) => {
      const hi = range.to || range.from;
      const show = items
        .filter((item) => {
          const d = dpDayStart(item.date);
          return d >= range.from && d <= hi;
        })
        .map((item) => item.el);
      root.setAttribute("data-agenda-range", "true");
      transition(show, dpRangeLabel(range.from, range.to), animate);
    };

    const onPrev = (e) => {
      e.preventDefault();
      if (range.from) {
        // Uit de periode-weergave: naar de maand vóór het begin van de periode
        const k = keyOf(new Date(range.from));
        const i = months.findIndex((m) => m >= k);
        go(Math.max(0, (i === -1 ? months.length : i) - 1));
        return;
      }
      go(index - 1);
    };
    const onNext = (e) => {
      e.preventDefault();
      if (range.from) {
        const k = keyOf(new Date(range.to || range.from));
        const i = months.findIndex((m) => m > k);
        go(i === -1 ? months.length - 1 : i);
        return;
      }
      go(index + 1);
    };
    prevBtns.forEach((el) => el.addEventListener("click", onPrev));
    nextBtns.forEach((el) => el.addEventListener("click", onNext));

    go(Math.max(0, months.indexOf(startKey)), false);

    const agendaEventDays = new Set(items.map((item) => dpDayStart(item.date)));
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    root.querySelectorAll("[data-filter-datepicker], [data-agenda-datepicker]").forEach((host) => {
      if (host.closest("[data-filter]") && root.contains(host.closest("[data-filter]"))) return;
      const presetType = host.getAttribute("data-filter-datepicker-presets") || (futureOnly ? "future" : "past");
      pickers.push(
        createDatePicker(host, {
          eventDays: agendaEventDays,
          initialView: Date.now(),
          minDay: futureOnly ? startOfToday : 0,
          presets: presetType === "none" ? [] : dpPresets(presetType),
          getRange: () => ({ from: range.from, to: range.to }),
          setRange: (a, b) => {
            if (!a) {
              const back = Math.max(0, months.indexOf(currentKey));
              index = -1;
              go(back === -1 ? 0 : back);
              return;
            }
            range.from = a;
            range.to = b || a;
            showRange(true);
            refreshPickers();
          }
        })
      );
    });

    addCleanup(root, () => {
      if (tl) tl.kill();
      pickers.forEach((p) => p.destroy());
      prevBtns.forEach((el) => el.removeEventListener("click", onPrev));
      nextBtns.forEach((el) => el.removeEventListener("click", onNext));
    });
  });
}

function initSocialShare() {
  nextPage.querySelectorAll("[data-social-share]").forEach((root) => {
    if (root._socialShareBound) return;
    root._socialShareBound = true;

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-social-share-type]");
      if (!btn || !root.contains(btn)) return;
      e.preventDefault();

      const link = root.getAttribute("data-social-share-link") || location.href;
      const title = root.getAttribute("data-social-share-title") || document.title;
      const type = btn.getAttribute("data-social-share-type");
      const u = encodeURIComponent(link);
      const t = encodeURIComponent(title);

      const map = {
        x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
        telegram: `https://t.me/share/url?url=${u}&text=${t}`,
        whatsapp: `https://api.whatsapp.com/send?text=${t}%20${u}`,
        mail: `mailto:?subject=${t}&body=${t}%0A%0A${u}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`
      };

      if (type === "clipboard") {
        const done = () => {
          btn.setAttribute("data-social-share-success", "");
          setTimeout(() => btn.removeAttribute("data-social-share-success"), 2000);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(link).then(done).catch(() => {});
        } else {
          const ta = document.createElement("textarea");
          ta.value = link;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            done();
          } catch (err) {}
          ta.remove();
        }
        return;
      }

      if (type === "mail") {
        window.location.href = map.mail;
        return;
      }

      const url = map[type];
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });
}

// Gedeelde datumprikker (gebruikt door filters en agenda)
const DP_MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const DP_MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const dpDayStart = (t) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const dpFmtDay = (t, withYear) => {
  const d = new Date(t);
  return d.getDate() + " " + DP_MONTHS_SHORT[d.getMonth()] + (withYear ? " " + d.getFullYear() : "");
};
const dpRangeLabel = (from, to) => {
  if (!from) return null;
  to = to || from;
  if (to === from) return dpFmtDay(from, true);
  const a = new Date(from);
  const b = new Date(to);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return a.getDate() + " – " + dpFmtDay(to, true);
  }
  return dpFmtDay(from, a.getFullYear() !== b.getFullYear()) + " – " + dpFmtDay(to, true);
};
const dpPresets = (type) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = new Date(y, m, now.getDate());
  if (type === "future") {
    const dow = (today.getDay() + 6) % 7;
    return [
      { label: "Deze week", from: today, to: new Date(y, m, now.getDate() + (6 - dow)) },
      { label: "Deze maand", from: today, to: new Date(y, m + 1, 0) },
      { label: "Volgende maand", from: new Date(y, m + 1, 1), to: new Date(y, m + 2, 0) },
      { label: "Komende 3 maanden", from: today, to: new Date(y, m + 3, now.getDate()) }
    ];
  }
  return [
    { label: "Deze maand", from: new Date(y, m, 1), to: new Date(y, m + 1, 0) },
    { label: "Vorige maand", from: new Date(y, m - 1, 1), to: new Date(y, m, 0) },
    { label: "Dit jaar", from: new Date(y, 0, 1), to: new Date(y, 11, 31) },
    { label: "Vorig jaar", from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31) }
  ];
};

function createDatePicker(host, opts) {
  const placeholder = host.getAttribute("data-filter-datepicker-label") || opts.placeholder || "Datum";
  const eventDays = opts.eventDays || new Set();
  const minDay = opts.minDay || 0;
  const listeners = [];
  const on = (el, type, fn, o) => {
    el.addEventListener(type, fn, o);
    listeners.push(() => el.removeEventListener(type, fn, o));
  };

  const id = "fdp-" + Math.random().toString(36).slice(2, 8);
  const wrap = document.createElement("div");
  wrap.className = "filter-dropdown filter-datepicker";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-dropdown__button";
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", id);
  const label = document.createElement("span");
  label.className = "filter-dropdown__label";
  button.appendChild(label);
  button.insertAdjacentHTML(
    "beforeend",
    '<svg class="filter-dropdown__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
  );

  const panel = document.createElement("div");
  panel.className = "filter-datepicker__panel";
  panel.id = id;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", placeholder + " kiezen");
  panel.setAttribute("data-lenis-prevent", "");
  panel.hidden = true;

  const arrow = (d) =>
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  panel.innerHTML =
    '<div class="filter-datepicker__presets"></div>' +
    '<div class="filter-datepicker__head">' +
    '<button type="button" class="filter-datepicker__nav" data-dp-prev aria-label="Vorige maand">' + arrow("M15 6l-6 6 6 6") + "</button>" +
    '<div class="filter-datepicker__title" aria-live="polite"></div>' +
    '<button type="button" class="filter-datepicker__nav" data-dp-next aria-label="Volgende maand">' + arrow("M9 6l6 6-6 6") + "</button>" +
    "</div>" +
    '<div class="filter-datepicker__weekdays"><span>ma</span><span>di</span><span>wo</span><span>do</span><span>vr</span><span>za</span><span>zo</span></div>' +
    '<div class="filter-datepicker__grid" role="grid"></div>' +
    '<div class="filter-datepicker__foot"><span class="filter-datepicker__hint"></span></div>';

  wrap.appendChild(button);
  wrap.appendChild(panel);
  host.appendChild(wrap);

  // "Wis datum" naast de knop: eigen element met [data-filter-datepicker-clear] in dezelfde filter/agenda, anders automatisch
  const scope = host.closest("[data-filter], [data-agenda]") || host.parentElement || host;
  let clearEls = Array.from(scope.querySelectorAll("[data-filter-datepicker-clear]"));
  const ownClear = !clearEls.length;
  if (ownClear) {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "filter-datepicker__reset";
    c.textContent = host.getAttribute("data-filter-datepicker-clear-label") || "Wis datum";
    wrap.appendChild(c);
    clearEls = [c];
  }

  const presetsEl = panel.querySelector(".filter-datepicker__presets");
  const titleEl = panel.querySelector(".filter-datepicker__title");
  const gridEl = panel.querySelector(".filter-datepicker__grid");
  const hintEl = panel.querySelector(".filter-datepicker__hint");
  const prevEl = panel.querySelector("[data-dp-prev]");

  let from = 0;
  let to = 0;
  let pending = false;
  let hoverDay = 0;
  let isOpen = false;
  let cells = [];
  const monthOf = (t) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };
  let view = monthOf(opts.initialView || Date.now());

  const sync = () => {
    const r = opts.getRange();
    if (!pending) {
      from = r.from || 0;
      to = r.to || 0;
    }
  };

  const commit = (a, b) => {
    pending = false;
    opts.setRange(a, b);
    sync();
  };

  const presetBtns = (opts.presets || []).map((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "filter-datepicker__preset";
    b.textContent = p.label;
    on(b, "click", () => {
      view = monthOf(p.from.getTime());
      commit(p.from.getTime(), p.to.getTime());
      close(true);
    });
    presetsEl.appendChild(b);
    return { b, p };
  });
  if (!presetBtns.length) presetsEl.remove();

  const paint = () => {
    const lo = pending ? Math.min(from, hoverDay || from) : from;
    const hi = pending ? Math.max(from, hoverDay || from) : to || from;
    cells.forEach((cell) => {
      const t = +cell.dataset.day;
      const inRange = !!lo && t >= lo && t <= hi;
      cell.classList.toggle("is-in-range", inRange);
      cell.classList.toggle("is-start", !!lo && t === lo);
      cell.classList.toggle("is-end", !!lo && t === hi);
      cell.setAttribute("aria-pressed", inRange ? "true" : "false");
    });
    hintEl.textContent = pending ? "Kies een einddatum" : from ? dpRangeLabel(from, to) : "Kies een begindatum";
    presetBtns.forEach(({ b, p }) =>
      b.classList.toggle("is-active", !pending && from === p.from.getTime() && to === p.to.getTime())
    );
  };

  const renderGrid = () => {
    const vy = view.getFullYear();
    const vm = view.getMonth();
    titleEl.textContent = DP_MONTHS[vm].charAt(0).toUpperCase() + DP_MONTHS[vm].slice(1) + " " + vy;
    prevEl.disabled = !!minDay && new Date(vy, vm, 1).getTime() <= monthOf(minDay).getTime();
    const offset = (new Date(vy, vm, 1).getDay() + 6) % 7;
    const today = dpDayStart(Date.now());
    gridEl.innerHTML = "";
    cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(vy, vm, 1 - offset + i);
      const t = d.getTime();
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "filter-datepicker__day";
      cell.textContent = d.getDate();
      cell.dataset.day = String(t);
      cell.setAttribute("aria-label", dpFmtDay(t, true) + (eventDays.has(t) ? ", met events" : ""));
      if (d.getMonth() !== vm) cell.classList.add("is-outside");
      if (t === today) cell.classList.add("is-today");
      if (eventDays.has(t)) cell.classList.add("has-event");
      if (minDay && t < minDay) {
        cell.disabled = true;
        cell.classList.add("is-disabled");
      }
      gridEl.appendChild(cell);
      cells.push(cell);
    }
    paint();
  };

  const refresh = () => {
    sync();
    label.textContent = dpRangeLabel(from, to) || placeholder;
    button.classList.toggle("is-filtered", !!from);
    clearEls.forEach((el) => (el.style.display = from ? "" : "none"));
    if (isOpen) paint();
  };

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    sync();
    if (from) view = monthOf(from);
    renderGrid();
    panel.hidden = false;
    // Rechts uitlijnen als het paneel buiten beeld zou vallen
    panel.style.left = "";
    panel.style.right = "";
    const rect = panel.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      panel.style.left = "auto";
      panel.style.right = "0";
    }
    wrap.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    if (!reducedMotion) gsap.fromTo(panel, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" });
  };

  function close(focusButton = false) {
    if (!isOpen) return;
    isOpen = false;
    if (pending) commit(from, from); // halve selectie = één dag
    wrap.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    const done = () => (panel.hidden = true);
    if (reducedMotion) done();
    else gsap.to(panel, { autoAlpha: 0, y: -6, duration: 0.18, ease: "power2.in", onComplete: done });
    if (focusButton) button.focus({ preventScroll: true });
  }

  on(button, "click", () => (isOpen ? close() : open()));
  on(prevEl, "click", () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderGrid();
  });
  on(panel.querySelector("[data-dp-next]"), "click", () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderGrid();
  });
  on(gridEl, "click", (e) => {
    const cell = e.target.closest(".filter-datepicker__day");
    if (!cell || cell.disabled) return;
    const t = +cell.dataset.day;
    if (!pending) {
      from = t;
      to = 0;
      pending = true;
      hoverDay = t;
      paint();
      return;
    }
    commit(Math.min(from, t), Math.max(from, t));
    close(true);
  });
  on(gridEl, "mouseover", (e) => {
    if (!pending) return;
    const cell = e.target.closest(".filter-datepicker__day");
    if (!cell || cell.disabled || +cell.dataset.day === hoverDay) return;
    hoverDay = +cell.dataset.day;
    paint();
  });
  clearEls.forEach((el) =>
    on(el, "click", (e) => {
      e.preventDefault();
      pending = false;
      commit(0, 0);
      refresh();
      if (isOpen) paint();
    })
  );
  on(panel, "keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    }
  });
  on(document, "pointerdown", (e) => {
    if (isOpen && !wrap.contains(e.target)) close();
  });

  refresh();
  return {
    refresh,
    wrap,
    destroy: () => {
      listeners.forEach((off) => off());
      wrap.remove();
    }
  };
}

function initListFilters() {
  const roots = Array.from(nextPage.querySelectorAll("[data-filter]")).filter(
    (el) => el.dataset.filterInitialized !== "true"
  );
  if (!roots.length) return;

  const slug = (v) =>
    (v || "")
      .toString()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const MONTHS_NL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  const parseDate = (value) => {
    const v = (value || "").trim();
    if (!v) return 0;
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
    m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
    if (m) {
      const a = +m[1];
      const b = +m[2];
      return (v.includes("/") && a <= 12 ? new Date(+m[3], a - 1, b) : new Date(+m[3], b - 1, a)).getTime();
    }
    const lower = v.toLowerCase();
    const month = MONTHS_NL.findIndex((n) => lower.includes(n));
    const year = lower.match(/\d{4}/);
    if (month !== -1 && year) {
      const day = lower.replace(/\d{4}/, "").match(/\d{1,2}/);
      return new Date(+year[0], month, day ? +day[0] : 1).getTime();
    }
    const t = Date.parse(v);
    return isNaN(t) ? 0 : t;
  };

  roots.forEach((root) => {
    root.dataset.filterInitialized = "true";

    const searchNormalize = (v) =>
      (v || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const RESERVED = ["filter-item", "filter-date", "filter-title", "filter-initialized"];
    const items = Array.from(root.querySelectorAll("[data-filter-item]")).map((el, index) => {
      const values = {};
      const labels = [];
      const add = (group, value) => {
        const g = slug(group);
        const v = slug(value);
        if (!g || !v) return;
        (values[g] = values[g] || new Set()).add(v);
        labels.push((value || "").toString().trim());
      };
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.replace(/^data-/, "");
        if (!name.startsWith("filter-") || RESERVED.includes(name)) return;
        attr.value.split(/[,;|]/).forEach((v) => add(name.replace(/^filter-/, ""), v));
      });
      el.querySelectorAll("[data-filter-field]").forEach((field) => {
        add(field.getAttribute("data-filter-field"), field.getAttribute("data-filter-field-value") || field.textContent);
      });
      const dateSource = el.hasAttribute("data-filter-date") ? el : el.querySelector("[data-filter-date]");
      const date = dateSource ? parseDate(dateSource.getAttribute("data-filter-date") || dateSource.textContent) : 0;
      // Datumgroepen: elk item met een datum krijgt automatisch "jaar" en "maand"
      if (date) {
        const d = new Date(date);
        add("jaar", String(d.getFullYear()));
        add("maand", MONTHS_NL[d.getMonth()]);
      }
      const titleEl = el.querySelector("[data-filter-title]");
      const searchFields = root.dataset.filterSearchFields !== "false";
      const text = searchNormalize(((titleEl || el).textContent || "") + (searchFields ? " " + labels.join(" ") : ""));
      return { el, index, values, date, text };
    });

    const buttons = Array.from(root.querySelectorAll("[data-filter-button]"));
    const selects = Array.from(root.querySelectorAll("[data-filter-select]"));
    const searches = Array.from(root.querySelectorAll("[data-filter-search]"));
    const sorts = Array.from(root.querySelectorAll("[data-filter-sort]"));
    const counts = Array.from(root.querySelectorAll("[data-filter-count]"));
    const resets = Array.from(root.querySelectorAll("[data-filter-reset]"));
    const empties = Array.from(root.querySelectorAll("[data-filter-empty]"));
    const activeClass = root.dataset.filterActiveClass || "is-active";
    const useUrl = root.dataset.filterUrl !== "false";
    // Eigen URL-voorvoegsel per filter, bv. data-filter-url-key="afgelopen" → ?afgelopen-van=…
    const urlKey = slug(root.dataset.filterUrlKey || "");
    const uk = (name) => (urlKey ? urlKey + "-" + name : name);
    const duration = reducedMotion ? 0 : toNumber(root.dataset.filterDuration, 0.5);
    const stagger = toNumber(root.dataset.filterStagger, 0.05);
    const singular = root.dataset.filterSingular || "verhaal";
    const plural = root.dataset.filterPlural || "verhalen";

    const groups = new Set([
      ...buttons.map((b) => slug(b.getAttribute("data-filter-button"))),
      ...selects.map((s) => slug(s.getAttribute("data-filter-select")))
    ]);

    const state = { filters: {}, query: "", sort: sorts[0] ? sorts[0].value || "new" : "", from: 0, to: 0 };
    groups.forEach((g) => (state.filters[g] = ""));

    selects.forEach((select) => {
      if (!select.hasAttribute("data-filter-populate")) return;
      const group = slug(select.getAttribute("data-filter-select"));
      const labels = new Map();
      items.forEach((item) => {
        item.el.querySelectorAll(`[data-filter-field]`).forEach((field) => {
          if (slug(field.getAttribute("data-filter-field")) !== group) return;
          const label = (field.textContent || "").trim();
          if (label) labels.set(slug(field.getAttribute("data-filter-field-value") || label), label);
        });
        const attr = item.el.getAttribute("data-filter-" + group);
        if (attr) attr.split(/[,;|]/).forEach((v) => v.trim() && !labels.has(slug(v)) && labels.set(slug(v), v.trim()));
      });
      const isDateGroup = group === "jaar" || group === "maand";
      if (isDateGroup) {
        items.forEach((item) => {
          if (!item.date) return;
          const d = new Date(item.date);
          if (group === "jaar") labels.set(String(d.getFullYear()), String(d.getFullYear()));
          else {
            const name = MONTHS_NL[d.getMonth()];
            labels.set(name, name.charAt(0).toUpperCase() + name.slice(1));
          }
        });
      }
      Array.from(select.options).forEach((opt) => {
        if (opt.value && opt.value !== "all") opt.remove();
      });
      const dateOrder = (a, b) =>
        group === "jaar" ? +b[0] - +a[0] : MONTHS_NL.indexOf(a[0]) - MONTHS_NL.indexOf(b[0]);
      Array.from(labels.entries())
        .sort(isDateGroup ? dateOrder : (a, b) => a[1].localeCompare(b[1], "nl"))
        .forEach(([value, label]) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = label;
          select.appendChild(opt);
        });
    });

    if (useUrl) {
      const params = new URLSearchParams(location.search);
      groups.forEach((g) => {
        if (params.has(uk(g))) state.filters[g] = slug(params.get(uk(g)));
      });
      if (params.has(uk("q"))) state.query = params.get(uk("q"));
      if (params.has(uk("sort")) && sorts.length) state.sort = params.get(uk("sort"));
      const ymd = (v) => {
        const mt = (v || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        return mt ? new Date(+mt[1], +mt[2] - 1, +mt[3]).getTime() : 0;
      };
      if (params.has(uk("van"))) state.from = ymd(params.get(uk("van")));
      if (params.has(uk("tot"))) state.to = ymd(params.get(uk("tot")));
      if (state.to && !state.from) state.from = state.to;
      if (state.from && !state.to) state.to = state.from;
    }

    const writeUrl = () => {
      if (!useUrl) return;
      const params = new URLSearchParams(location.search);
      groups.forEach((g) => (state.filters[g] ? params.set(uk(g), state.filters[g]) : params.delete(uk(g))));
      state.query.trim() ? params.set(uk("q"), state.query.trim()) : params.delete(uk("q"));
      const toYmd = (t) => {
        const d = new Date(t);
        return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      };
      state.from ? params.set(uk("van"), toYmd(state.from)) : params.delete(uk("van"));
      state.from && state.to ? params.set(uk("tot"), toYmd(state.to)) : params.delete(uk("tot"));
      sorts.length && state.sort && state.sort !== (sorts[0].options[0] || {}).value ? params.set(uk("sort"), state.sort) : params.delete(uk("sort"));
      const qs = params.toString();
      try {
        history.replaceState(history.state, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
      } catch (e) {}
    };

    const isFiltered = () => Object.values(state.filters).some(Boolean) || state.query.trim() !== "" || !!state.from;

    const syncControls = () => {
      buttons.forEach((btn) => {
        const g = slug(btn.getAttribute("data-filter-button"));
        const v = slug(btn.getAttribute("data-filter-value") || "");
        const on = (v === "" || v === "all") ? !state.filters[g] : state.filters[g] === v;
        btn.classList.toggle(activeClass, on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      selects.forEach((select) => {
        const g = slug(select.getAttribute("data-filter-select"));
        const want = state.filters[g] || "";
        const match = Array.from(select.options).find((o) => slug(o.value) === want || (!want && (o.value === "" || o.value === "all")));
        if (match) select.value = match.value;
      });
      searches.forEach((input) => {
        if (input.value !== state.query) input.value = state.query;
      });
      sorts.forEach((select) => {
        if (state.sort) select.value = state.sort;
      });
      if (typeof customDropdowns !== "undefined") customDropdowns.forEach((d) => d.refresh());
      if (typeof datePickers !== "undefined") datePickers.forEach((d) => d.refresh());
      const filtered = isFiltered();
      resets.forEach((el) => {
        if (el.hasAttribute("data-filter-reset-always")) return;
        el.style.display = filtered ? "" : "none";
      });
    };

    let tween = null;

    const apply = (animate = true) => {
      const q = searchNormalize(state.query);
      const matches = items.filter((item) => {
        for (const g of groups) {
          const want = state.filters[g];
          if (want && !(item.values[g] && item.values[g].has(want))) return false;
        }
        if (state.from) {
          if (!item.date) return false;
          const d = new Date(item.date);
          const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          if (day < state.from || day > (state.to || state.from)) return false;
        }
        return !q || item.text.includes(q);
      });

      if (sorts.length) {
        const dir = state.sort === "old" ? 1 : state.sort === "new" ? -1 : 0;
        const sorted = dir ? [...items].sort((a, b) => (a.date - b.date) * dir || a.index - b.index) : [...items].sort((a, b) => a.index - b.index);
        sorted.forEach((item) => item.el.parentElement && item.el.parentElement.appendChild(item.el));
      }

      const show = new Set(matches.map((m) => m.el));
      if (tween) tween.progress(1);
      items.forEach((item) => (item.el.style.display = show.has(item.el) ? "" : "none"));
      empties.forEach((el) => (el.style.display = matches.length ? "none" : ""));
      counts.forEach((el) => {
        const one = el.getAttribute("data-filter-singular") || singular;
        const many = el.getAttribute("data-filter-plural") || plural;
        el.textContent = matches.length + " " + (matches.length === 1 ? one : many);
      });
      syncControls();

      if (animate && duration) {
        const visible = (sorts.length ? Array.from(show).sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1)) : Array.from(show)).slice(0, 12);
        const targets = visible.length ? visible : empties;
        if (targets.length) {
          tween = gsap.fromTo(
            targets,
            { autoAlpha: 0, y: visible.length ? 16 : 0 },
            { autoAlpha: 1, y: 0, duration, stagger: visible.length ? stagger : 0, ease: "power2.out", clearProps: "opacity,visibility,transform", onComplete: () => (tween = null) }
          );
        }
      }

      if (hasLenis && lenis) lenis.resize();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    };

    const update = () => {
      writeUrl();
      apply(true);
    };

    const listeners = [];
    const on = (el, type, fn, opts) => {
      el.addEventListener(type, fn, opts);
      listeners.push(() => el.removeEventListener(type, fn, opts));
    };

    buttons.forEach((btn) =>
      on(btn, "click", (e) => {
        e.preventDefault();
        const g = slug(btn.getAttribute("data-filter-button"));
        const v = slug(btn.getAttribute("data-filter-value") || "");
        const next = v === "all" ? "" : v;
        state.filters[g] = state.filters[g] === next && btn.hasAttribute("data-filter-toggle") ? "" : next;
        update();
      })
    );

    selects.forEach((select) =>
      on(select, "change", () => {
        const g = slug(select.getAttribute("data-filter-select"));
        const v = slug(select.value);
        state.filters[g] = v === "all" ? "" : v;
        update();
      })
    );

    let searchTimer = null;
    searches.forEach((input) => {
      on(input, "input", () => {
        state.query = input.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(update, 200);
      });
      on(input, "keydown", (e) => {
        if (e.key === "Enter") e.preventDefault();
      });
    });

    sorts.forEach((select) =>
      on(select, "change", () => {
        state.sort = select.value;
        update();
      })
    );

    resets.forEach((el) =>
      on(el, "click", (e) => {
        e.preventDefault();
        groups.forEach((g) => (state.filters[g] = ""));
        state.query = "";
        state.from = 0;
        state.to = 0;
        update();
      })
    );

    const forms = new Set(
      [...selects, ...searches, ...sorts].map((el) => el.closest("form")).filter(Boolean)
    );
    forms.forEach((form) =>
      on(
        form,
        "submit",
        (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
        },
        true
      )
    );

    const customDropdowns = [];
    const buildDropdown = (select) => {
      const wrap = document.createElement("div");
      wrap.className = "filter-dropdown";
      const id = "fd-" + Math.random().toString(36).slice(2, 8);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-dropdown__button";
      button.setAttribute("aria-haspopup", "listbox");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", id);
      const label = document.createElement("span");
      label.className = "filter-dropdown__label";
      button.appendChild(label);
      button.insertAdjacentHTML(
        "beforeend",
        '<svg class="filter-dropdown__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
      );

      const list = document.createElement("ul");
      list.className = "filter-dropdown__list";
      list.id = id;
      list.setAttribute("role", "listbox");
      list.setAttribute("tabindex", "-1");
      list.setAttribute("data-lenis-prevent", "");
      list.hidden = true;

      wrap.appendChild(button);
      wrap.appendChild(list);
      select.insertAdjacentElement("afterend", wrap);
      select.classList.add("filter-dropdown__native");
      select.setAttribute("tabindex", "-1");
      select.setAttribute("aria-hidden", "true");

      let options = [];
      let activeIndex = -1;
      let isOpen = false;

      const render = () => {
        list.innerHTML = "";
        options = Array.from(select.options).map((opt, i) => {
          const li = document.createElement("li");
          li.className = "filter-dropdown__option";
          li.setAttribute("role", "option");
          li.id = id + "-" + i;
          li.textContent = opt.textContent;
          li.addEventListener("click", () => choose(i));
          li.addEventListener("mousemove", () => setActive(i));
          list.appendChild(li);
          return li;
        });
        refresh();
      };

      const refresh = () => {
        const i = Math.max(0, select.selectedIndex);
        label.textContent = select.options[i] ? select.options[i].textContent : "";
        options.forEach((li, j) => {
          li.setAttribute("aria-selected", j === i ? "true" : "false");
          li.classList.toggle("is-selected", j === i);
        });
        button.classList.toggle("is-filtered", select.selectedIndex > 0);
      };

      const setActive = (i) => {
        activeIndex = Math.max(0, Math.min(options.length - 1, i));
        options.forEach((li, j) => li.classList.toggle("is-active", j === activeIndex));
        const li = options[activeIndex];
        if (li) {
          list.setAttribute("aria-activedescendant", li.id);
          const top = li.offsetTop;
          const bottom = top + li.offsetHeight;
          if (top < list.scrollTop) list.scrollTop = top;
          else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
        }
      };

      const open = () => {
        if (isOpen) return;
        isOpen = true;
        list.hidden = false;
        wrap.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        setActive(Math.max(0, select.selectedIndex));
        list.focus({ preventScroll: true });
        if (!reducedMotion) gsap.fromTo(list, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" });
      };

      const close = (focusButton = true) => {
        if (!isOpen) return;
        isOpen = false;
        wrap.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        const done = () => (list.hidden = true);
        if (reducedMotion) done();
        else gsap.to(list, { autoAlpha: 0, y: -6, duration: 0.18, ease: "power2.in", onComplete: done });
        if (focusButton) button.focus({ preventScroll: true });
      };

      const choose = (i) => {
        if (select.selectedIndex !== i) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        refresh();
        close();
      };

      on(button, "click", () => (isOpen ? close() : open()));
      on(button, "keydown", (e) => {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
          e.preventDefault();
          open();
        }
      });
      on(list, "keydown", (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIndex + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIndex - 1); }
        else if (e.key === "Home") { e.preventDefault(); setActive(0); }
        else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(activeIndex); }
        else if (e.key === "Escape") { e.preventDefault(); close(); }
        else if (e.key === "Tab") close(false);
      });
      on(document, "pointerdown", (e) => {
        if (isOpen && !wrap.contains(e.target)) close(false);
      });

      render();
      const api = { refresh, render, wrap };
      customDropdowns.push(api);
      return api;
    };

    root.querySelectorAll("[data-filter-mobile-dropdown]").forEach((group) => {
      const groupButtons = buttons.filter((btn) => group.contains(btn));
      if (!groupButtons.length) return;
      const g = slug(group.getAttribute("data-filter-mobile-dropdown") || groupButtons[0].getAttribute("data-filter-button"));
      const holder = document.createElement("div");
      holder.className = "filter-mobile-select";
      const select = document.createElement("select");
      select.setAttribute("data-filter-select", g);
      select.setAttribute("aria-label", group.getAttribute("aria-label") || g);
      const seen = new Set();
      groupButtons.forEach((btn) => {
        const raw = slug(btn.getAttribute("data-filter-value") || "");
        const value = raw === "" ? "all" : raw;
        if (seen.has(value)) return;
        seen.add(value);
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = (btn.textContent || "").trim();
        select.appendChild(opt);
      });
      holder.appendChild(select);
      group.insertAdjacentElement("afterend", holder);
      selects.push(select);
      on(select, "change", () => {
        const v = slug(select.value);
        state.filters[g] = v === "all" ? "" : v;
        update();
      });
      addCleanup(root, () => holder.remove());
    });

    [...selects, ...sorts].forEach((select) => {
      if (select.getAttribute("data-filter-custom") !== "false" && root.getAttribute("data-filter-custom") !== "false") buildDropdown(select);
    });

    // Datumprikker: [data-filter-datepicker] → uitklapkalender met periode-selectie
    const datePickers = [];
    const filterEventDays = new Set(items.filter((i) => i.date).map((i) => dpDayStart(i.date)));
    const latestDate = items.reduce((max, i) => (i.date > max ? i.date : max), 0);
    root.querySelectorAll("[data-filter-datepicker]").forEach((host) => {
      const presetType = host.getAttribute("data-filter-datepicker-presets") || "past";
      datePickers.push(
        createDatePicker(host, {
          eventDays: filterEventDays,
          initialView: latestDate || Date.now(),
          presets: presetType === "none" ? [] : dpPresets(presetType),
          getRange: () => ({ from: state.from, to: state.to }),
          setRange: (a, b) => {
            state.from = a;
            state.to = b;
            update();
          }
        })
      );
    });

    apply(false);

    addCleanup(root, () => {
      clearTimeout(searchTimer);
      customDropdowns.forEach((d) => d.wrap.remove());
      datePickers.forEach((d) => d.destroy());
      if (tween) tween.kill();
      listeners.forEach((off) => off());
    });
  });
}

function initGradientColors() {
  nextPage.querySelectorAll("[data-gradient]").forEach((target) => {
    const source =
      target.querySelector("[data-gradient-color]") ||
      (target.getAttribute("data-gradient") && nextPage.querySelector(`[data-gradient-color="${target.getAttribute("data-gradient")}"]`)) ||
      nextPage.querySelector("[data-gradient-color]");
    if (!source) return;

    const bg = getComputedStyle(source).backgroundColor;
    const usable = bg && bg !== "transparent" && !/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(bg);
    if (usable) target.style.setProperty("--gradient-color", bg);

    const map = { gradientDirection: "--gradient-direction", gradientStart: "--gradient-start", gradientEnd: "--gradient-end" };
    Object.entries(map).forEach(([key, prop]) => {
      const v = target.dataset[key];
      if (v) target.style.setProperty(prop, /^\d+(\.\d+)?$/.test(v) ? v + (key === "gradientDirection" ? "deg" : "%") : v);
    });
  });
}

function initHoverReveal() {
  const targets = Array.from(nextPage.querySelectorAll("[data-hover-reveal]")).filter(
    (el) => el.dataset.hoverRevealInit !== "true"
  );
  if (!targets.length) return;

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let refreshTimer = null;
  const refreshLayout = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (hasLenis && lenis) lenis.resize();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    }, 250);
  };

  targets.forEach((el) => {
    el.dataset.hoverRevealInit = "true";

    // Touch / geen hover: tekst gewoon zichtbaar laten
    if (!canHover) return;

    const trigger = el.closest("[data-hover-reveal-trigger]") || el.parentElement;
    const mode = el.getAttribute("data-hover-reveal") === "fade" ? "fade" : "expand";
    const duration = reducedMotion ? 0.01 : toNumber(el.dataset.hoverRevealDuration, 0.7);
    const stagger = reducedMotion ? 0 : toNumber(el.dataset.hoverRevealStagger, 0.06);

    // Flex/grid gap compenseren zodat er in dichte staat geen lege ruimte blijft
    const ps = getComputedStyle(el.parentElement);
    const stacked = (ps.display.includes("flex") && ps.flexDirection.startsWith("column")) || ps.display.includes("grid");
    const gap = stacked ? parseFloat(ps.rowGap) || 0 : 0;
    const openMargin = parseFloat(getComputedStyle(el).marginTop) || 0;
    const closedMargin = el.previousElementSibling ? -gap : 0;

    let open = false;
    let lines = [];
    let split = null;

    if (mode === "expand") gsap.set(el, { height: 0, overflow: "hidden", marginTop: closedMargin });

    if (hasSplitText) {
      split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "hover-reveal-line",
        autoSplit: true,
        onSplit(self) {
          lines = self.lines;
          gsap.set(lines, { yPercent: open ? 0 : 110 });
          gsap.set(el, { autoAlpha: 1 });
        }
      });
    } else {
      gsap.set(el, { autoAlpha: 0 });
    }

    const show = () => {
      if (open) return;
      open = true;
      if (mode === "expand") {
        gsap.to(el, { height: "auto", marginTop: openMargin, duration, ease: "osmo", overwrite: "auto", onComplete: refreshLayout });
      }
      if (lines.length) {
        gsap.to(lines, { yPercent: 0, duration, stagger, ease: "osmo", overwrite: "auto", delay: mode === "expand" ? 0.06 : 0 });
      } else {
        gsap.to(el, { autoAlpha: 1, duration, ease: "osmo", overwrite: "auto" });
      }
    };

    const hide = () => {
      if (!open) return;
      open = false;
      const d = duration * 0.75;
      if (lines.length) {
        gsap.to(lines, { yPercent: 110, duration: d * 0.8, stagger: stagger * 0.5, ease: "power2.in", overwrite: "auto" });
      } else {
        gsap.to(el, { autoAlpha: 0, duration: d, ease: "osmo", overwrite: "auto" });
      }
      if (mode === "expand") {
        gsap.to(el, { height: 0, marginTop: closedMargin, duration: d, delay: 0.08, ease: "osmo", overwrite: "auto", onComplete: refreshLayout });
      }
    };

    const onFocusOut = (e) => {
      if (!trigger.contains(e.relatedTarget)) hide();
    };

    trigger.addEventListener("mouseenter", show);
    trigger.addEventListener("mouseleave", hide);
    trigger.addEventListener("focusin", show);
    trigger.addEventListener("focusout", onFocusOut);

    addCleanup(el, () => {
      clearTimeout(refreshTimer);
      trigger.removeEventListener("mouseenter", show);
      trigger.removeEventListener("mouseleave", hide);
      trigger.removeEventListener("focusin", show);
      trigger.removeEventListener("focusout", onFocusOut);
      gsap.killTweensOf([el, ...lines]);
      if (split) split.revert();
      gsap.set(el, { clearProps: "height,overflow,marginTop,opacity,visibility" });
    });
  });
}

function initBreadcrumbs() {
  nextPage.querySelectorAll("[data-breadcrumbs], [data-scroll-row]").forEach((el) => {
    if (el.dataset.breadcrumbsInit === "true") return;
    el.dataset.breadcrumbsInit = "true";
    const isRow = el.hasAttribute("data-scroll-row");
    const update = () => {
      el.classList.toggle("is-end", el.scrollLeft >= el.scrollWidth - el.clientWidth - 2);
      el.classList.toggle("is-scrolled", el.scrollLeft > 2);
    };
    requestAnimationFrame(() => {
      el.scrollLeft = 0;
      // Scroll-rij: het actieve item (w--current / is-active / aria-current) in beeld schuiven
      const current = isRow && el.querySelector(".w--current, .is-active, [aria-current='page']");
      if (current && el.scrollWidth > el.clientWidth) {
        const left = current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2;
        el.scrollLeft = Math.max(0, Math.min(left, el.scrollWidth - el.clientWidth));
      }
      update();
    });
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    addCleanup(el, () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    });
  });
}

// Sticky stapel: [data-stack] op de lijst; kaarten vliegen van onder in en landen bovenop de stapel
function initStackCards() {
  if (!hasScrollTrigger) return;
  nextPage.querySelectorAll("[data-stack]").forEach((list) => {
    if (list.dataset.stackInit === "true") return;
    list.dataset.stackInit = "true";

    const items = Array.from(list.querySelectorAll(":scope > [data-stack-item]")).length
      ? Array.from(list.querySelectorAll(":scope > [data-stack-item]"))
      : Array.from(list.children);
    if (items.length < 2 || reducedMotion) {
      list.classList.add("is-static");
      return;
    }

    const ds = list.dataset;
    const pinTarget = list.closest("[data-stack-pin]") || list;
    const stepVh = toNumber(ds.stackStep, 70);
    const depthZ = toNumber(ds.stackDepth, 140);
    const offsetY = toNumber(ds.stackOffset, 7);
    const dim = gsap.utils.clamp(0, 1, toNumber(ds.stackDim, 0.12));
    const tilt = toNumber(ds.stackTilt, 10);
    // data-stack="desktop" = vanaf 992px, data-stack="tablet" = vanaf 768px (uit op mobiel L en kleiner)
    const breakpoints = { desktop: 992, tablet: 768 };
    const minW = breakpoints[ds.stack] || 0;
    const query = minW ? "(min-width: " + minW + "px)" : "all";

    const mm = gsap.matchMedia();
    if (query !== "all") {
      mm.add("(max-width: " + (minW - 1) + "px)", () => {
        list.classList.add("is-static");
        return () => list.classList.remove("is-static");
      });
    }
    mm.add(query, () => {
      list.classList.add("is-stacked");
      items.forEach((el, i) => (el.style.zIndex = String(i + 1)));
      gsap.set(items, { transformOrigin: "50% 100%", force3D: true, filter: "brightness(1)" });
      gsap.set(items.slice(1), { y: () => window.innerHeight * 1.1, rotationX: -tilt, autoAlpha: 1 });

      const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 1 } });
      for (let i = 1; i < items.length; i++) {
        const at = i - 1;
        tl.to(items[i], { y: 0, rotationX: 0 }, at);
        for (let j = 0; j < i; j++) {
          const depth = i - j;
          tl.to(
            items[j],
            {
              z: -depth * depthZ,
              yPercent: -depth * offsetY,
              filter: "brightness(" + Math.max(0, 1 - depth * dim) + ")"
            },
            at
          );
        }
      }
      tl.to({}, { duration: 0.35 });

      const st = ScrollTrigger.create({
        trigger: pinTarget,
        start: ds.stackStart || "center center",
        end: () => "+=" + Math.round(((items.length - 1) * stepVh * window.innerHeight) / 100),
        pin: pinTarget,
        pinSpacing: true,
        scrub: toNumber(ds.stackScrub, 1),
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tl
      });

      return () => {
        st.kill();
        tl.kill();
        list.classList.remove("is-stacked");
        gsap.set(items, { clearProps: "transform,filter,zIndex,opacity,visibility" });
      };
    });

    addCleanup(list, () => mm.revert());
  });
}

function initFilterLinks() {
  const slug = (v) =>
    (v || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  nextPage.querySelectorAll("[data-filter-link]").forEach((link) => {
    const group = slug(link.getAttribute("data-filter-link"));
    const value = slug(link.getAttribute("data-filter-link-value") || link.textContent);
    if (!group || !value) return;
    const base = link.getAttribute("data-filter-link-base") || link.getAttribute("href") || "/nieuws-media";
    try {
      const url = new URL(base, location.origin);
      url.searchParams.set(group, value);
      link.setAttribute("href", url.pathname + url.search + url.hash);
    } catch (e) {}
  });
}

function initVideoPopup() {
  const buttons = Array.from(nextPage.querySelectorAll("[data-open-video]")).filter(
    (btn) => btn.dataset.videoInitialized !== "true"
  );
  if (!buttons.length) return;

  const findPopup = (btn) => {
    const id = (btn.getAttribute("data-open-video") || "").trim();
    const scopes = [nextPage, document];
    for (const scope of scopes) {
      const popup = id
        ? scope.querySelector(`[data-popup-video="${id}"]`)
        : scope.querySelector("[data-popup-video]");
      if (popup) return popup;
    }
    return null;
  };

  const stopMedia = (popup) => {
    popup.querySelectorAll("video").forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
    popup.querySelectorAll("iframe").forEach((iframe) => {
      if (iframe.dataset.videoSrc === undefined) return;
      iframe.src = iframe.dataset.videoSrc;
    });
  };

  const withAutoplay = (src) => {
    try {
      const url = new URL(src, window.location.href);

      if (url.hostname.includes("embedly.com")) {
        const inner = url.searchParams.get("src");
        if (inner) url.searchParams.set("src", withAutoplay(inner));
        return url.toString();
      }

      if (/youtube(-nocookie)?\.com|youtu\.be/.test(url.hostname)) {
        url.searchParams.set("autoplay", "1");
        url.searchParams.set("playsinline", "1");
        return url.toString();
      }

      if (url.hostname.includes("vimeo.com")) {
        url.searchParams.set("autoplay", "1");
        return url.toString();
      }

      return src;
    } catch (e) {
      return src;
    }
  };

  const playMedia = (popup) => {
    if (popup.dataset.videoAutoplay === "false") return;

    const video = popup.querySelector("video");
    if (video) {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    popup.querySelectorAll("iframe").forEach((iframe) => {
      const original = iframe.dataset.videoSrc;
      if (!original) return;
      const allow = iframe.getAttribute("allow") || "";
      if (!/autoplay/.test(allow)) {
        iframe.setAttribute("allow", (allow ? allow + "; " : "") + "autoplay; fullscreen; encrypted-media; picture-in-picture");
      }
      const next = withAutoplay(original);
      if (next !== iframe.src) iframe.src = next;
    });
  };

  const setupPopup = (popup) => {
    if (popup._videoPopup) return popup._videoPopup;

    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    if (!popup.hasAttribute("aria-label")) popup.setAttribute("aria-label", "Video");

    popup.querySelectorAll("iframe").forEach((iframe) => {
      if (iframe.dataset.videoSrc === undefined) iframe.dataset.videoSrc = iframe.src;
    });

    let isOpen = false;
    let lastFocus = null;
    let pausedBgVideos = [];

    const pauseBackgroundVideos = () => {
      pausedBgVideos = Array.from(document.querySelectorAll(".w-background-video video, [data-bg-video] video")).filter(
        (video) => !popup.contains(video) && !video.paused
      );
      pausedBgVideos.forEach((video) => video.pause());
    };

    const resumeBackgroundVideos = () => {
      pausedBgVideos.forEach((video) => {
        if (!video.isConnected) return;
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      });
      pausedBgVideos = [];
    };

    const onKeydown = (e) => {
      if (e.key === "Escape" && isOpen) close();
    };

    const open = (trigger) => {
      if (isOpen) return;
      isOpen = true;
      lastFocus = trigger || document.activeElement;

      gsap.killTweensOf(popup);
      gsap.set(popup, { display: "flex" });
      popup.setAttribute("aria-hidden", "false");

      if (lenis) lenis.stop();
      pauseBackgroundVideos();
      document.addEventListener("keydown", onKeydown);

      if (reducedMotion) {
        gsap.set(popup, { autoAlpha: 1 });
      } else {
        gsap.fromTo(popup, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" });
      }

      playMedia(popup);

      const focusTarget = popup.querySelector("[data-close-video]") || popup;
      if (focusTarget === popup && !popup.hasAttribute("tabindex")) popup.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;

      document.removeEventListener("keydown", onKeydown);
      popup.setAttribute("aria-hidden", "true");

      const finish = () => {
        gsap.set(popup, { display: "none" });
        stopMedia(popup);
        resumeBackgroundVideos();
        if (lenis) lenis.start();
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
      };

      gsap.killTweensOf(popup);
      if (reducedMotion) {
        finish();
      } else {
        gsap.to(popup, { autoAlpha: 0, duration: 0.3, ease: "power2.in", onComplete: finish });
      }
    };

    const onPopupClick = (e) => {
      if (e.target.closest("[data-close-video]") || e.target === popup) {
        e.preventDefault();
        close();
      }
    };

    popup.addEventListener("click", onPopupClick);

    popup._videoPopup = { open, close };

    addCleanup(popup.closest('[data-barba="container"]') ? popup : buttons[0], () => {
      close();
      popup.removeEventListener("click", onPopupClick);
      document.removeEventListener("keydown", onKeydown);
      delete popup._videoPopup;
    });

    return popup._videoPopup;
  };

  buttons.forEach((btn) => {
    btn.dataset.videoInitialized = "true";

    const popup = findPopup(btn);
    if (!popup) {
      console.warn("[video popup] Geen [data-popup-video] gevonden voor deze knop.", btn);
      return;
    }

    const controls = setupPopup(popup);

    if (!btn.matches("a, button")) {
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
    }

    const onOpen = (e) => {
      e.preventDefault();
      controls.open(btn);
    };

    const onKey = (e) => {
      if (e.key === "Enter" || e.key === " ") onOpen(e);
    };

    btn.addEventListener("click", onOpen);
    btn.addEventListener("keydown", onKey);

    addCleanup(btn, () => {
      btn.removeEventListener("click", onOpen);
      btn.removeEventListener("keydown", onKey);
      delete btn.dataset.videoInitialized;
    });
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
    const inactiveOpacity = gsap.utils.clamp(0, 1, toNumber(slider.dataset.teamInactiveOpacity, 0.5));
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

    // Social links: [data-team-url="linkedin"] in het CMS-item → [data-team-link="linkedin"] in de tekst
    const linkTargets = Array.from(slider.querySelectorAll("[data-team-link]")).filter((el) => !el.closest("[data-team-item]"));
    const linksWrap = slider.querySelector("[data-team-links]") || (linkTargets[0] ? linkTargets[0].parentElement : null);

    const readUrl = (el) => {
      if (!el) return "";
      if (el.classList.contains("w-condition-invisible")) return "";
      const raw = (el.getAttribute("href") || el.textContent || "").trim();
      if (!raw || raw.endsWith("#")) return "";
      return raw;
    };

    function getData(index) {
      const tpl = templates[index];
      const name = tpl.querySelector("[data-team-name]");
      const role = tpl.querySelector("[data-team-role]");
      const bio = tpl.querySelector("[data-team-bio]");
      const links = {};
      tpl.querySelectorAll("[data-team-url]").forEach((el) => {
        const key = (el.getAttribute("data-team-url") || "").trim().toLowerCase();
        if (key) links[key] = readUrl(el);
      });
      return {
        name: name ? name.textContent : "",
        role: role ? role.textContent : "",
        bio: bio ? bio.innerHTML : "",
        links
      };
    }

    function fillLinks(data) {
      if (!linkTargets.length) return;
      let any = false;
      linkTargets.forEach((el) => {
        const key = (el.getAttribute("data-team-link") || "").trim().toLowerCase();
        const url = data.links[key] || "";
        if (url) {
          any = true;
          el.style.display = "";
          el.setAttribute("href", url);
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
          el.setAttribute("aria-label", (el.textContent || key).trim() + " van " + data.name.trim());
        } else {
          el.style.display = "none";
          el.removeAttribute("href");
        }
      });
      if (linksWrap) linksWrap.style.display = any ? "" : "none";
      if (any && linksWrap && !reducedMotion) {
        gsap.fromTo(linksWrap, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.15, ease: "expo.out", overwrite: true });
      }
    }

    function fillText(index) {
      const data = getData(index);
      if (textName) textName.textContent = data.name;
      if (textRole) textRole.textContent = data.role;
      if (textBio) textBio.innerHTML = data.bio;
      fillLinks(data);
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
        el._setO = gsap.quickSetter(el, "opacity");
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
        const opacity = inactiveOpacity + (1 - inactiveOpacity) * closeness;

        el._setX(baseCenter + pos - itemW / 2);
        el._setY(centerY + Math.sin(pos / waveLength * Math.PI * 2) * amp);
        el._setSX(scale);
        el._setSY(scale);
        el._setO(opacity);
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

function initDomainTabs() {
  nextPage.querySelectorAll("[data-domains], .domains_module").forEach((module) => {
    if (module.dataset.domainsInitialized === "true") return;
    if (module.querySelector("[data-domains], .domains_module")) return;

    const tabs = Array.from(module.querySelectorAll("[data-domain-tab], .domains_collection_item"));
    const panels = Array.from(module.querySelectorAll("[data-domain-panel], .domains_contents_item, .domain_contents_item"));
    const count = Math.min(tabs.length, panels.length);
    if (!count) {
      console.warn("[domains] Geen tabs of panels gevonden", { tabs: tabs.length, panels: panels.length }, module);
      return;
    }
    if (tabs.length !== panels.length) {
      console.warn("[domains] Aantal tabs (" + tabs.length + ") en panels (" + panels.length + ") verschilt", module);
    }
    tabs.length = count;
    panels.length = count;

    module.dataset.domainsInitialized = "true";

    const num = (v, d) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : d;
    };
    const duration = num(module.dataset.domainsDuration, 0.8);
    const stagger = num(module.dataset.domainsStagger, 0.08);
    const inactiveOpacity = num(module.dataset.domainsInactiveOpacity, 0.4);
    const hoverOpacity = num(module.dataset.domainsHoverOpacity, 0.7);
    const cardStagger = num(module.dataset.domainsCardStagger, 0.1);
    const cardDelay = num(module.dataset.domainsCardDelay, 0.2);
    const CARD_SELECTOR = "[data-domain-card], .project_grid_card, [data-gallery]";
    const blobDuration = num(module.dataset.domainsBlobDuration, 1.2);

    const blobSection = module.closest("[data-blob-section], .section_domains");
    const blob = blobSection ? blobSection.querySelector("[data-domain-blob], .blob") : null;

    const isUsableColor = (c) =>
      !!c && c !== "transparent" && !/^rgba\([^)]*,\s*0\)$/.test(c.replace(/\s+/g, " "));

    const getColor = (i) => {
      const el =
        tabs[i].querySelector("[data-domain-color]") ||
        panels[i].querySelector("[data-domain-color]");
      if (!el) return null;
      const attr = (el.dataset.domainColor || "").trim();
      if (attr && (attr.startsWith("#") || attr.startsWith("rgb") || attr.startsWith("hsl"))) return attr;
      const bg = getComputedStyle(el).backgroundColor;
      return isUsableColor(bg) ? bg : null;
    };

    const readBlobOpacity = (i) => {
      const colorEl =
        tabs[i].querySelector("[data-domain-color]") ||
        panels[i].querySelector("[data-domain-color]");
      const sources = [tabs[i], panels[i], colorEl].filter(Boolean);
      for (const el of sources) {
        const v = parseFloat(el.dataset.domainBlobOpacity);
        if (Number.isFinite(v)) return gsap.utils.clamp(0, 1, v);
      }
      const fallback = parseFloat(module.dataset.domainsBlobOpacity);
      return Number.isFinite(fallback) ? gsap.utils.clamp(0, 1, fallback) : null;
    };

    const updateBlob = (index, animate) => {
      if (!blob) return;
      const color = getColor(index);
      const opacity = readBlobOpacity(index);
      if (!color && opacity === null) return;

      const vars = {
        duration: animate && !reducedMotion ? blobDuration : 0,
        ease: "power2.out",
        overwrite: "auto"
      };
      if (color) vars["--blob-color"] = color;
      if (opacity !== null) vars.opacity = opacity;

      gsap.to(blob, vars);
    };
    const scrollHost = module.closest("[data-domains-scroll]");
    const scrollMode = !!(scrollHost && hasScrollTrigger);
    const useHash = module.dataset.domainsHash !== "false" && !scrollMode;

    const uid = "domain-" + Math.random().toString(36).slice(2, 7);
    const tabList = tabs[0].parentElement;
    tabList.setAttribute("role", "tablist");
    tabList.setAttribute("aria-orientation", "vertical");

    const getSlug = (i) => tabs[i].dataset.domainSlug || panels[i].dataset.domainSlug || "";

    const distributeProjects = () => {
      const scope = module.closest("[data-barba='container']") || nextPage;
      const source =
        module.querySelector("[data-domain-projects-source]") ||
        scope.querySelector("[data-domain-projects-source]");
      if (!source) return;

      const limit = Math.max(0, Math.round(num(module.dataset.domainsProjectLimit, 3)));
      const cards = Array.from(source.querySelectorAll("[data-project-domain]"));

      panels.forEach((panel, i) => {
        const target = panel.querySelector("[data-domain-projects], .domains_projects_wrap");
        if (!target) return;

        const slug = getSlug(i);
        target.innerHTML = "";

        const matches = slug
          ? cards.filter((card) => (card.dataset.projectDomain || "").trim() === slug).slice(0, limit)
          : [];

        matches.forEach((card) => target.appendChild(card));

        const empty = panel.querySelector("[data-domain-projects-empty]");
        target.classList.toggle("is-empty", matches.length === 0);
        if (empty) empty.style.display = matches.length ? "none" : "";
        if (!slug) console.warn("[domains] Geen data-domain-slug gevonden voor domein", i + 1, tabs[i]);
      });

      source.remove();
    };

    distributeProjects();

    const readColorEl = (i, selector) => {
      const el = tabs[i].querySelector(selector) || panels[i].querySelector(selector);
      if (!el) return null;
      const bg = getComputedStyle(el).backgroundColor;
      return isUsableColor(bg) ? bg : null;
    };

    const colorVars = [
      ["[data-domain-text-color]", "--domain-text"],
      ["[data-domain-tag-color]", "--domain-tag-bg"],
      ["[data-domain-tag-text-color]", "--domain-tag-text"]
    ];

    panels.forEach((panel, i) => {
      const color = getColor(i);
      if (color) panel.style.setProperty("--domain-color", color);
      colorVars.forEach(([selector, prop]) => {
        const value = readColorEl(i, selector);
        if (value) panel.style.setProperty(prop, value);
      });
    });

    const getIndicator = (tab) => tab.querySelector("[data-domain-indicator], .domain_indicator");

    const getTabFades = (tab) => {
      const marked = tab.querySelectorAll("[data-domain-tab-fade]");
      if (marked.length) return Array.from(marked);
      const inner = tab.querySelector(".domains_collection_item_inner") || tab;
      return Array.from(inner.children).filter(
        (el) => !el.matches("[data-domain-indicator], .domain_indicator, .u-domain-line, [data-domain-line]")
      );
    };

    const getPanelHeading = (panel) =>
      panel.querySelector("[data-domain-heading]") || panel.querySelector("h1, h2, h3");

    const getPanelFades = (panel, heading) => {
      const marked = panel.querySelectorAll("[data-domain-fade]");
      if (marked.length) return Array.from(marked);
      if (!heading || !heading.parentElement) return [];
      return Array.from(heading.parentElement.children).filter(
        (el) => el !== heading && !el.matches(CARD_SELECTOR) && !el.querySelector(CARD_SELECTOR)
      );
    };

    const getPanelCards = (panel) => Array.from(panel.querySelectorAll(CARD_SELECTOR));

    tabs.forEach((tab, i) => {
      const panel = panels[i];
      tab.id = tab.id || uid + "-tab-" + i;
      panel.id = panel.id || uid + "-panel-" + i;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      tab.style.cursor = "pointer";
    });

    let current = -1;
    let tl = null;
    let splits = [];
    const revertSplits = () => {
      splits.forEach((sp) => sp.revert());
      splits = [];
    };

    const finishRunning = () => {
      if (tl) {
        const running = tl;
        tl = null;
        running.progress(1);
        running.kill();
      }
      revertSplits();
    };

    const updateTabs = (index, animate) => {
      tabs.forEach((tab, j) => {
        const on = j === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;

        const fades = getTabFades(tab);
        if (fades.length) {
          gsap.to(fades, {
            opacity: on ? 1 : inactiveOpacity,
            duration: animate ? 0.4 : 0,
            ease: "power2.out",
            overwrite: true
          });
        }

        const indicator = getIndicator(tab);
        if (indicator) {
          gsap.to(indicator, {
            scale: on ? 1 : 0,
            duration: animate ? (on ? 0.5 : 0.3) : 0,
            ease: on ? "back.out(2)" : "power2.out",
            overwrite: true
          });
        }
      });
    };

    const updatePanelsA11y = (index) => {
      panels.forEach((panel, j) => {
        const on = j === index;
        panel.classList.toggle("is-active", on);
        panel.setAttribute("aria-hidden", on ? "false" : "true");
        if (on) panel.removeAttribute("inert");
        else panel.setAttribute("inert", "");
      });
    };

    const scrollTabIntoView = (tab) => {
      let el = tab.parentElement;
      while (el && el !== module.parentElement) {
        const ox = getComputedStyle(el).overflowX;
        if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth) {
          const elRect = el.getBoundingClientRect();
          const tabRect = tab.getBoundingClientRect();
          const left = el.scrollLeft + (tabRect.left - elRect.left) - (elRect.width - tabRect.width) / 2;
          el.scrollTo({ left: Math.max(0, left), behavior: reducedMotion ? "auto" : "smooth" });
          return;
        }
        el = el.parentElement;
      }
    };

    const updateHash = (index) => {
      if (!useHash) return;
      const slug = getSlug(index);
      if (!slug) return;
      try {
        history.replaceState(history.state, "", "#" + slug);
      } catch (e) {}
    };

    const go = (index, animate = true) => {
      if (index < 0 || index >= count || index === current) return;

      finishRunning();

      const prev = current;
      current = index;

      updateTabs(index, animate);
      updatePanelsA11y(index);
      updateBlob(index, animate && prev >= 0);
      scrollTabIntoView(tabs[index]);
      if (prev >= 0) updateHash(index);

      if (!animate || reducedMotion || prev < 0) {
        panels.forEach((panel, j) => gsap.set(panel, { autoAlpha: j === index ? 1 : 0, y: 0 }));
        return;
      }

      const oldPanel = panels[prev];
      const newPanel = panels[index];
      const heading = getPanelHeading(newPanel);
      const fades = getPanelFades(newPanel, heading);
      const cards = getPanelCards(newPanel);

      tl = gsap.timeline({
        defaults: { ease: "osmo" },
        onComplete: () => {
          revertSplits();
          if (fades.length) gsap.set(fades, { clearProps: "opacity,visibility,transform" });
          if (cards.length) gsap.set(cards, { clearProps: "opacity,visibility,transform" });
          tl = null;
        }
      });

      tl.to(oldPanel, { autoAlpha: 0, y: -12, duration: 0.3, ease: "power2.in" })
        .set(oldPanel, { y: 0 })
        .set(newPanel, { autoAlpha: 1, y: 0 });

      if (heading && hasSplitText) {
        const headingSplit = SplitText.create(heading, { type: "lines", mask: "lines", linesClass: "line" });
        splits.push(headingSplit);
        tl.from(headingSplit.lines, { yPercent: 110, duration, stagger }, ">");
      }

      if (fades.length) {
        tl.from(
          fades,
          { autoAlpha: 0, y: 16, duration, stagger },
          heading && hasSplitText ? "<0.15" : ">"
        );
      }

      if (cards.length) {
        tl.from(
          cards,
          { autoAlpha: 0, y: 32, duration, stagger: cardStagger },
          fades.length || (heading && hasSplitText) ? "<" + cardDelay : ">"
        );
      }
    };

    let scrollST = null;
    const select = (i) => {
      if (scrollST && scrollST.end > scrollST.start) {
        const y = scrollST.start + ((i + 0.5) / count) * (scrollST.end - scrollST.start);
        if (hasLenis && lenis) lenis.scrollTo(y, { duration: 1 });
        else window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
        return;
      }
      go(i);
    };

    const onClick = (e) => {
      const i = tabs.indexOf(e.currentTarget);
      if (i === -1) return;
      if (e.target.closest("a") || e.currentTarget.tagName === "A") e.preventDefault();
      select(i);
    };

    const onKeydown = (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      let next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % count;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + count) % count;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = count - 1;
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(i);
        return;
      }
      if (next === null) return;
      e.preventDefault();
      tabs[next].focus();
      select(next);
    };

    const onEnter = (e) => {
      const i = tabs.indexOf(e.currentTarget);
      if (i === -1 || i === current) return;
      gsap.to(getTabFades(tabs[i]), { opacity: hoverOpacity, duration: 0.3, ease: "power2.out", overwrite: true });
    };

    const onLeave = (e) => {
      const i = tabs.indexOf(e.currentTarget);
      if (i === -1 || i === current) return;
      gsap.to(getTabFades(tabs[i]), { opacity: inactiveOpacity, duration: 0.3, ease: "power2.out", overwrite: true });
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", onClick);
      tab.addEventListener("keydown", onKeydown);
      tab.addEventListener("mouseenter", onEnter);
      tab.addEventListener("mouseleave", onLeave);
    });

    let startIndex = Math.min(Math.max(0, Math.round(num(module.dataset.domainsStart, 0))), count - 1);
    const hash = decodeURIComponent((location.hash || "").replace("#", ""));
    if (hash) {
      const fromHash = tabs.findIndex((_, i) => getSlug(i) === hash);
      if (fromHash !== -1) startIndex = fromHash;
    }
    if (scrollMode) startIndex = 0;
    go(startIndex, false);

    // Scroll-modus: data-domains-scroll op een wrapper pint de module en speelt de domeinen 1 voor 1 af
    let scrollMM = null;
    if (scrollMode) {
      const sd = scrollHost.dataset;
      const stepVh = num(sd.domainsScrollStep, 80);
      const query = sd.domainsScroll === "desktop" ? "(min-width: 992px)" : "all";
      scrollMM = gsap.matchMedia();
      scrollMM.add(query, () => {
        scrollST = ScrollTrigger.create({
          trigger: scrollHost,
          start: sd.domainsScrollStart || "top top",
          end: () => "+=" + Math.round((count * stepVh * window.innerHeight) / 100),
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: sd.domainsScrollSnap !== undefined
            ? {
                snapTo: (v) => (Math.min(count - 1, Math.floor(v * count)) + 0.5) / count,
                duration: { min: 0.2, max: 0.6 },
                delay: 0.1,
                ease: "power2.inOut"
              }
            : false,
          onUpdate: (self) => {
            const pr = self.progress.toFixed(4);
            module.style.setProperty("--domains-progress", pr);
            scrollHost.style.setProperty("--domains-progress", pr);
            const i = Math.min(count - 1, Math.floor(self.progress * count));
            if (i !== current) go(i);
          }
        });
        return () => {
          scrollST = null;
          module.style.removeProperty("--domains-progress");
          scrollHost.style.removeProperty("--domains-progress");
        };
      });
    }

    addCleanup(module, () => {
      if (scrollMM) scrollMM.revert();
      finishRunning();
      tabs.forEach((tab) => {
        tab.removeEventListener("click", onClick);
        tab.removeEventListener("keydown", onKeydown);
        tab.removeEventListener("mouseenter", onEnter);
        tab.removeEventListener("mouseleave", onLeave);
      });
      delete module.dataset.domainsInitialized;
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

function initSliders() {
  const roots = Array.from(nextPage.querySelectorAll("[data-slider], .stories-swiper")).filter(
    (el) => el.dataset.sliderInit !== "true"
  );
  if (!roots.length) return;

  roots.forEach((root) => {
    const track =
      root.querySelector("[data-slider-track]") ||
      root.querySelector(".swiper-wrapper") ||
      root.querySelector(".w-dyn-items") ||
      root.firstElementChild;
    if (!track) return;
    root.dataset.sliderInit = "true";
    root.classList.add("pac-slider");
    track.classList.add("pac-slider__track");

    const getItems = () => {
      const marked = track.querySelectorAll("[data-slider-item]");
      return Array.from(marked.length ? marked : track.children).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };
    let items = getItems();
    items.forEach((el) => el.classList.add("pac-slider__item"));

    const scope = root.closest("[data-slider-ui]") || root.parentElement || root;
    const find = (sel) => Array.from(root.querySelectorAll(sel)).concat(root === scope ? [] : Array.from(scope.querySelectorAll(sel))).filter((el, i, a) => a.indexOf(el) === i);
    const prevBtns = find("[data-slider-prev]");
    const nextBtns = find("[data-slider-next]");
    const currentEls = find("[data-slider-current]");
    const totalEls = find("[data-slider-total]");
    const uiEls = find("[data-slider-controls]");
    const disabledClass = root.dataset.sliderDisabledClass || "is-disabled";
    const duration = reducedMotion ? 0 : toNumber(root.dataset.sliderDuration, 0.8);
    const dragEnabled = root.dataset.sliderDrag !== "false";
    const friction = toNumber(root.dataset.sliderMomentum, 1);

    track.setAttribute("tabindex", track.getAttribute("tabindex") || "0");
    if (!track.hasAttribute("role")) track.setAttribute("role", "region");
    if (!track.hasAttribute("aria-label")) track.setAttribute("aria-label", root.dataset.sliderLabel || "Carrousel");

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const padLeft = () => parseFloat(getComputedStyle(track).scrollPaddingLeft) || parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const itemLeft = (el) => track.scrollLeft + (el.getBoundingClientRect().left - track.getBoundingClientRect().left) - padLeft();

    let tween = null;
    const pauseSnap = () => track.classList.add("is-moving");
    const resumeSnap = () => track.classList.remove("is-moving");

    const scrollToX = (x, dur = duration, ease = "osmo") => {
      if (tween) tween.kill();
      const target = gsap.utils.clamp(0, maxScroll(), x);
      pauseSnap();
      tween = gsap.to(track, {
        scrollLeft: target,
        duration: dur,
        ease,
        onComplete: () => {
          tween = null;
          resumeSnap();
        }
      });
    };

    const currentIndex = () => {
      const x = track.scrollLeft;
      let idx = 0;
      items.forEach((el, i) => {
        if (itemLeft(el) <= x + 4) idx = i;
      });
      if (x >= maxScroll() - 4) idx = items.length - 1;
      return idx;
    };

    const go = (dir) => {
      const x = track.scrollLeft;
      if (dir > 0) {
        const next = items.find((el) => itemLeft(el) > x + 4);
        scrollToX(next ? itemLeft(next) : maxScroll());
      } else {
        const prev = items.slice().reverse().find((el) => itemLeft(el) < x - 4);
        scrollToX(prev ? itemLeft(prev) : 0);
      }
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = maxScroll();
      const x = track.scrollLeft;
      const scrollable = max > 2;
      const progress = scrollable ? x / max : 0;
      root.style.setProperty("--slider-progress", progress.toFixed(4));
      root.classList.toggle("is-static", !scrollable);
      uiEls.forEach((el) => (el.style.display = scrollable ? "" : "none"));
      const atStart = x <= 2;
      const atEnd = x >= max - 2;
      prevBtns.forEach((b) => {
        b.classList.toggle(disabledClass, atStart || !scrollable);
        b.setAttribute("aria-disabled", atStart ? "true" : "false");
      });
      nextBtns.forEach((b) => {
        b.classList.toggle(disabledClass, atEnd || !scrollable);
        b.setAttribute("aria-disabled", atEnd ? "true" : "false");
      });
      const idx = currentIndex();
      currentEls.forEach((el) => (el.textContent = String(idx + 1)));
      totalEls.forEach((el) => (el.textContent = String(items.length)));
      items.forEach((el, i) => el.classList.toggle("is-current", i === idx));
    };
    const requestUpdate = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Muis-slepen met momentum (touch blijft native)
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    const onPointerDown = (e) => {
      if (!dragEnabled || e.pointerType !== "mouse" || e.button !== 0) return;
      if (maxScroll() <= 2) return;
      if (tween) tween.kill();
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      startScroll = track.scrollLeft;
      lastT = performance.now();
      velocity = 0;
      pauseSnap();
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        track.classList.add("is-dragging");
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (!moved) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = 0.8 * ((e.clientX - lastX) / dt) + 0.2 * velocity;
      lastX = e.clientX;
      lastT = now;
      track.scrollLeft = startScroll - dx;
    };
    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      try { track.releasePointerCapture(e.pointerId); } catch (err) {}
      if (!moved) {
        resumeSnap();
        return;
      }
      const throwDist = -velocity * 380 * friction;
      let target = track.scrollLeft + throwDist;
      if (getComputedStyle(track).scrollSnapType.indexOf("x") !== -1 || root.dataset.sliderSnap === "true") {
        let best = 0;
        let bestD = Infinity;
        items.forEach((el) => {
          const d = Math.abs(itemLeft(el) - target);
          if (d < bestD) {
            bestD = d;
            best = itemLeft(el);
          }
        });
        target = best;
      }
      scrollToX(target, reducedMotion ? 0 : gsap.utils.clamp(0.5, 1.1, 0.5 + Math.abs(velocity) * 0.25), "power3.out");
    };
    const onClickCapture = (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    const onDragStart = (e) => e.preventDefault();
    const onWheelOrTouch = () => {
      if (tween) {
        tween.kill();
        tween = null;
        resumeSnap();
      }
    };

    const onPrev = (e) => {
      e.preventDefault();
      go(-1);
    };
    const onNext = (e) => {
      e.preventDefault();
      go(1);
    };

    track.addEventListener("scroll", requestUpdate, { passive: true });
    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("click", onClickCapture, true);
    track.addEventListener("dragstart", onDragStart);
    track.addEventListener("wheel", onWheelOrTouch, { passive: true });
    track.addEventListener("touchstart", onWheelOrTouch, { passive: true });
    prevBtns.forEach((b) => b.addEventListener("click", onPrev));
    nextBtns.forEach((b) => b.addEventListener("click", onNext));

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          items = getItems();
          requestUpdate();
        })
      : null;
    if (ro) {
      ro.observe(track);
      items.forEach((el) => ro.observe(el));
    }
    update();

    addCleanup(root, () => {
      if (tween) tween.kill();
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      track.removeEventListener("scroll", requestUpdate);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("click", onClickCapture, true);
      track.removeEventListener("dragstart", onDragStart);
      track.removeEventListener("wheel", onWheelOrTouch);
      track.removeEventListener("touchstart", onWheelOrTouch);
      prevBtns.forEach((b) => b.removeEventListener("click", onPrev));
      nextBtns.forEach((b) => b.removeEventListener("click", onNext));
    });
  });
}
