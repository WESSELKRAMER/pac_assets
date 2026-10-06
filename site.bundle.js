(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function hasGSAP() {
    return typeof window.gsap !== "undefined";
  }

  function toNumber(value, fallback) {
    const n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  // Navbar hide on scroll (beheerbaar via data attributes)
  function initNavbarHide() {
    if (!hasGSAP()) return;

    const navbar = document.querySelector("[data-navbar]") || document.querySelector(".navbar");
    if (!navbar) return;
    if (navbar.dataset.navbarInitialized === "true") return;
    navbar.dataset.navbarInitialized = "true";

    // Body-attributen (per pagina) gaan voor op attributen van de navbar
    function read(key) {
      const fromBody = document.body.dataset[key];
      return fromBody !== undefined ? fromBody : navbar.dataset[key];
    }

    const hideEnabled = read("navbarHide") !== "false";
    const offset = toNumber(read("navbarOffset"), 10);
    const threshold = toNumber(read("navbarThreshold"), 0);
    const duration = toNumber(read("navbarDuration"), 0.5);
    const ease = read("navbarEase") || "expo.out";

    let lastScroll = window.pageYOffset;
    let ticking = false;
    let state = lastScroll <= offset ? "top" : "visible";

    gsap.set(navbar, { yPercent: 0 });
    navbar.setAttribute("data-navbar-state", state);

    function setState(newState) {
      if (newState === state) return;
      state = newState;
      navbar.setAttribute("data-navbar-state", state);

      gsap.to(navbar, {
        yPercent: state === "hidden" ? -100 : 0,
        duration,
        ease,
        overwrite: "auto"
      });
    }

    function handleScroll() {
      ticking = false;

      const currentScroll = window.pageYOffset;
      const delta = currentScroll - lastScroll;

      if (currentScroll <= offset) {
        setState("top");
        lastScroll = currentScroll;
        return;
      }

      if (!hideEnabled) {
        setState("visible");
        lastScroll = currentScroll;
        return;
      }

      // Kleine bewegingen negeren tot de threshold is bereikt
      if (Math.abs(delta) <= threshold) return;

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

  // Logo hover (cirkel krimpt)
  function initLogoHover() {
    if (!hasGSAP()) return;

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

  // Dynamic year
  function initDynamicCurrentYear() {
    const currentYear = new Date().getFullYear();
    document.querySelectorAll("[data-current-year]").forEach((el) => {
      el.textContent = currentYear;
    });
  }

  // Nav current underline
  function initNavCurrentUnderline() {
    document.querySelectorAll(".nav_item.w--current").forEach((el) => {
      el.setAttribute("data-underline-link", "alt");
    });
  }

  // Unselectable text
  function initUnselectableText() {
    const elements = document.querySelectorAll("[data-no-select]");
    if (!elements.length) return;

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

  // Cursor-following blob
  function initCursorBlob() {
    if (!hasGSAP()) return;

    document.querySelectorAll("[data-blob-section]").forEach((section) => {
      const blob = section.querySelector(".blob");
      if (!blob) return;
      if (section.dataset.blobInitialized === "true") return;
      section.dataset.blobInitialized = "true";

      // Blob centreren op zijn eigen middelpunt en in het midden van de section zetten
      gsap.set(blob, {
        xPercent: -50,
        yPercent: -50,
        x: section.offsetWidth / 2,
        y: section.offsetHeight / 2
      });

      // Geen cursor (touch): blob blijft in het midden staan
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      // Hogere duration = trager meebewegen
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

      // Blob blijft staan op de plek waar de cursor de section verliet
      section.addEventListener("mouseleave", () => {
        isInside = false;
      });

      // Blob blijft onder de cursor als je scrollt zonder de muis te bewegen
      window.addEventListener(
        "scroll",
        () => {
          if (isInside) updateTarget();
        },
        { passive: true }
      );
    });
  }

  // CTA animation
  function initCTAAnimation() {
    if (!hasGSAP()) return;

    document.querySelectorAll(".primary_cta, .grid_card_cta_wrapper").forEach((cta) => {
      const text = cta.querySelector(".cta_text, .grid_card_cta_text");
      const arrow = cta.querySelector(".cta_arrow");
      const circle = cta.querySelector(".cta_arrow_wrapper");

      if (!text || !arrow || !circle) return;
      if (text.dataset.ctaSplit === "true") return;

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

      cta.addEventListener("mouseenter", () => {
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

      cta.addEventListener("mouseleave", () => {
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

  // FAQ animation
  function initFAQAnimation() {
    if (!hasGSAP()) return;

    const faqItems = document.querySelectorAll(".faq_item");
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

  // Text animation
  function initMaskTextScrollReveal() {
    if (
      !hasGSAP() ||
      typeof window.SplitText === "undefined" ||
      typeof window.ScrollTrigger === "undefined"
    ) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);

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

    document.querySelectorAll('[data-split="heading"]').forEach((heading) => {
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

      SplitText.create(heading, {
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
    });
  }

  // Big logo reveal (footer)
  function initBigLogoReveal() {
    const logos = document.querySelectorAll(".big_logo");
    if (!logos.length) return;

    // Fallback: zonder GSAP/ScrollTrigger het logo gewoon tonen
    if (!hasGSAP() || typeof window.ScrollTrigger === "undefined") {
      logos.forEach((logo) => {
        logo.style.visibility = "visible";
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    logos.forEach((logo) => {
      if (logo.dataset.logoRevealInitialized === "true") return;
      logo.dataset.logoRevealInitialized = "true";

      // Sorteer paths van links naar rechts zodat de stagger klopt
      const paths = Array.from(logo.querySelectorAll("path")).sort((a, b) => {
        return a.getBBox().x - b.getBBox().x;
      });

      if (!paths.length) {
        gsap.set(logo, { visibility: "visible" });
        return;
      }

      // Eerst letters naar beneden, dan pas het logo zichtbaar maken (geen flash)
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

  // Logo marquee
  function initLogoMarquee() {
    if (!hasGSAP()) return;

    const track = document.querySelector(".logo-marquee_track");
    if (!track) return;

    gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 50,
      repeat: -1
    });
  }

  // Footer link hover
  function initFooterLinkHover() {
    if (!hasGSAP()) return;

    const links = document.querySelectorAll(".footer_link");
    if (!links.length) return;

    links.forEach((link) => {
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

  onReady(() => {
    initNavbarHide();
    initLogoHover();
    initDynamicCurrentYear();
    initNavCurrentUnderline();
    initUnselectableText();
    initCursorBlob();
    initCTAAnimation();
    initFAQAnimation();
    initMaskTextScrollReveal();
    initBigLogoReveal();
    initLogoMarquee();
    initFooterLinkHover();

    if (typeof window.ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  });
})();
