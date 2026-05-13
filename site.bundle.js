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

  // Dynamic year
  function initDynamicCurrentYear() {
    const currentYear = new Date().getFullYear();
    document.querySelectorAll("[data-current-year]").forEach((el) => {
      el.textContent = currentYear;
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
        duration: 0.65,
        ease: "power2.out"
      });

      if (plusIcon) {
        gsap.to(plusIcon, {
          rotate: 0,
          duration: 0.65,
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
        duration: 0.65,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(answer, { height: "auto" });
        }
      });

      if (plusIcon) {
        gsap.to(plusIcon, {
          rotate: 45,
          duration: 0.65,
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
    initDynamicCurrentYear();
    initCTAAnimation();
    initFAQAnimation();
    initMaskTextScrollReveal();
    initLogoMarquee();
    initFooterLinkHover();

    if (typeof window.ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  });
})();
