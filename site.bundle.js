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
    const question = item.querySelector(".faq_question");
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon, .cta_arrow_wrapper");

    if (!question || !answer) return;

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

    question.addEventListener("click", () => {
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
