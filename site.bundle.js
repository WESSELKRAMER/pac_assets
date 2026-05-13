// FAQ animation
document.addEventListener("DOMContentLoaded", () => {

  const faqItems = document.querySelectorAll(".faq_item");

  faqItems.forEach((item) => {

    const question = item.querySelector(".faq_question");
    const answer = item.querySelector(".faq_answer");

    gsap.set(answer, {
      height: 0
    });

    let isOpen = false;

    question.addEventListener("click", () => {

      if (!isOpen) {

        gsap.to(answer, {
          height: answer.scrollHeight,
          duration: 0.5,
          ease: "expo.out"
        });

      } else {

        gsap.to(answer, {
          height: 0,
          duration: 0.4,
          ease: "expo.out"
        });

      }

      isOpen = !isOpen;

    });

  });

});
