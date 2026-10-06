gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

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

  initNavbarHide();
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
  if (has(".big_logo")) initBigLogoReveal();
  if (has(".logo-marquee_track")) initLogoMarquee();
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
      el.dataset.underlineOriginal = el.getAttribute("data-underline-link") || "";
    }

    if (el.classList.contains("w--current")) {
      el.setAttribute("data-underline-link", "alt");
    } else if (el.dataset.underlineOriginal) {
      el.setAttribute("data-underline-link", el.dataset.underlineOriginal);
    } else {
      el.removeAttribute("data-underline-link");
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
  if (!hasSplitText || !hasScrollTrigger) return;

  const splitConfig = {
    lines: {
      duration: 0.8,
      stagger: 0.1
    },
    words: {
      duration: 0.8,
      stagger: 0.03
    },
    chars: {
      duration: 0.8,
      stagger: 0.015
    }
  };

  nextPage.querySelectorAll('[data-split="heading"]').forEach((heading) => {
    if (heading.dataset.splitInitialized === "true") return;
    heading.dataset.splitInitialized = "true";

    const type = ["lines", "words", "chars"].includes(heading.dataset.splitReveal)
      ? heading.dataset.splitReveal
      : "lines";

    const isImmediate = heading.dataset.splitImmediate === "true";

    const typesToSplit =
      type === "lines"
        ? ["lines"]
        : type === "words"
        ? ["lines", "words"]
        : ["lines", "words", "chars"];

    const instance = SplitText.create(heading, {
      type: typesToSplit.join(","),
      mask: "lines",
      autoSplit: true,
      linesClass: "line",
      wordsClass: "word",
      charsClass: "letter",

      onSplit(instance) {
        const targets = instance[type];
        const config = splitConfig[type];

        if (!targets || !targets.length) return;

        const animation = {
          yPercent: 110,
          duration: config.duration,
          stagger: config.stagger,
          ease: "expo.out"
        };

        if (isImmediate) {
          return gsap.from(targets, {
            ...animation,
            delay: 0.2
          });
        }

        return gsap.from(targets, {
          ...animation,
          scrollTrigger: {
            trigger: heading,
            start: "top 80%",
            once: true
          }
        });
      }
    });

    addCleanup(heading, () => instance.revert());
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
        start: "top 95%",
        once: true
      }
    });
  });
}

function initLogoMarquee() {
  const track = nextPage.querySelector(".logo-marquee_track");
  if (!track) return;
  if (track.dataset.marqueeInitialized === "true") return;
  track.dataset.marqueeInitialized = "true";

  const tween = gsap.to(track, {
    xPercent: -50,
    ease: "none",
    duration: 50,
    repeat: -1
  });

  addCleanup(track, () => tween.kill());
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
