document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".stories-swiper").forEach((swiperEl) => {
    new Swiper(swiperEl, {
      slidesPerView: "auto",
      spaceBetween: 16,
      speed: 700,

      grabCursor: true,
      simulateTouch: true,
      allowTouchMove: true,
      touchStartPreventDefault: false,
      watchOverflow: false,

      freeMode: {
        enabled: true,
        momentum: true
      }
    });
  });
});
