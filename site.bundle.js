// CTA animation
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;

  document.querySelectorAll(".primary_cta").forEach((cta) => {
    const text = cta.querySelector(".cta_text");
    const arrowCurrent = cta.querySelector(".cta_arrow.is-current");
    const arrowNext = cta.querySelector(".cta_arrow.is-next");
    const circle = cta.querySelector(".cta_arrow_wrapper");

    if (!text || !arrowCurrent || !arrowNext || !circle) return;

    const originalText = text.textContent.trim();

    text.innerHTML = originalText
      .split("")
      .map((char) => `<span class="cta_char">${char === " " ? "&nbsp;" : char}</span>`)
      .join("");

    const chars = text.querySelectorAll(".cta_char");

    gsap.set(text, { overflow: "hidden" });
    gsap.set(chars, { display: "inline-block" });
    gsap.set(circle, { transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ paused: true });

    tl.to(chars, {
      yPercent: -100,
      opacity: 0,
      duration: 0.22,
      stagger: 0.018,
      ease: "power2.in"
    }, 0);

    tl.set(chars, {
      yPercent: 100,
      opacity: 0
    });

    tl.to(chars, {
      yPercent: 0,
      opacity: 1,
      duration: 0.38,
      stagger: 0.018,
      ease: "expo.out"
    }, 0.28);

    tl.to(circle, {
      scale: 1.08,
      duration: 0.4,
      ease: "expo.out"
    }, 0);

    tl.to(arrowCurrent, {
      x: "0.75rem",
      y: "-0.75rem",
      opacity: 0,
      duration: 0.22,
      ease: "power2.in"
    }, 0);

    tl.fromTo(arrowNext,
      {
        x: "-0.75rem",
        y: "0.75rem",
        opacity: 0
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.32,
        ease: "expo.out"
      },
      0.12
    );

    cta.addEventListener("mouseenter", () => {
      tl.restart();
    });

    cta.addEventListener("mouseleave", () => {
      gsap.to(circle, {
        scale: 1,
        duration: 0.35,
        ease: "expo.out"
      });
    });
  });
});

// Dynamic year
function initDynamicCurrentYear() {  
  const currentYear = new Date().getFullYear();
  const currentYearElements = document.querySelectorAll('[data-current-year]');
  currentYearElements.forEach(currentYearElement => {
    currentYearElement.textContent = currentYear;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDynamicCurrentYear();
});

// FAQ animation
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;

  const faqItems = document.querySelectorAll(".faq_item");
  if (!faqItems.length) return;

  function closeItem(item) {
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon, .cta_arrow_wrapper");

    gsap.to(answer, {
      height: 0,
      duration: 0.4,
      ease: "expo.out"
    });

    if (plusIcon) {
      gsap.to(plusIcon, {
        rotate: 0,
        duration: 0.4,
        ease: "expo.out"
      });
    }

    item.dataset.open = "false";
  }

  function openItem(item) {
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon, .cta_arrow_wrapper");

    gsap.set(answer, { height: "auto" });
    const height = answer.offsetHeight;
    gsap.set(answer, { height: 0 });

    gsap.to(answer, {
      height,
      duration: 0.5,
      ease: "expo.out",
      onComplete: () => {
        gsap.set(answer, { height: "auto" });
      }
    });

    if (plusIcon) {
      gsap.to(plusIcon, {
        rotate: 45,
        duration: 0.5,
        ease: "expo.out"
      });
    }

    item.dataset.open = "true";
  }

  faqItems.forEach((item, index) => {
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon, .cta_arrow_wrapper");

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
});

// Text animation
function initMaskTextScrollReveal() {
  if (
    typeof gsap === "undefined" ||
    typeof SplitText === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) return;

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

    const type = ["lines", "words", "chars"].includes(
      heading.dataset.splitReveal
    )
      ? heading.dataset.splitReveal
      : "lines";

    const isImmediate =
      heading.dataset.splitImmediate === "true";

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

document.addEventListener("DOMContentLoaded", () => {
  initMaskTextScrollReveal();
});

//Logo Marquee
document.addEventListener("DOMContentLoaded", () => {

  const track = document.querySelector(".logo-marquee_track");

  gsap.to(track, {
    xPercent: -50,
    ease: "none",
    duration: 50,
    repeat: -1
  });

});

//Footer link hover
document.addEventListener("DOMContentLoaded", () => {

  const links = document.querySelectorAll(".footer_link");

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

});
