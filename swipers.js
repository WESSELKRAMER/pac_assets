document.addEventListener("DOMContentLoaded", () => {
  const swiper = new Swiper(".stories-swiper", {
    slidesPerView: "auto",
    spaceBetween: 16,
    speed: 700,
    grabCursor: true,
    freeMode: {
      enabled: true,
      momentum: true,
      momentumRatio: 0.8,
    },
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
  });
});
