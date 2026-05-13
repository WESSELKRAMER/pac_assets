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
