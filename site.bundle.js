// FAQ animation
document.addEventListener("DOMContentLoaded", () => {

  const faqItems = document.querySelectorAll(".faq_item");

  faqItems.forEach((item, index) => {

    const question = item.querySelector(".faq_question");
    const answer = item.querySelector(".faq_answer");
    const plusIcon = item.querySelector(".plus_icon");

    const isFirst = index === 0;

    gsap.set(answer, {
      height: isFirst ? "auto" : 0
    });

    gsap.set(plusIcon, {
      rotate: isFirst ? 45 : 0
    });

    item.dataset.open = isFirst ? "true" : "false";

    question.addEventListener("click", () => {

      const isOpen = item.dataset.open === "true";

      if (!isOpen) {

        gsap.to(answer, {
          height: answer.scrollHeight,
          duration: 0.5,
          ease: "expo.out"
        });

        gsap.to(plusIcon, {
          rotate: 45,
          duration: 0.5,
          ease: "expo.out"
        });

        item.dataset.open = "true";

      } else {

        gsap.to(answer, {
          height: 0,
          duration: 0.4,
          ease: "expo.out"
        });

        gsap.to(plusIcon, {
          rotate: 0,
          duration: 0.4,
          ease: "expo.out"
        });

        item.dataset.open = "false";

      }

    });

  });

});
