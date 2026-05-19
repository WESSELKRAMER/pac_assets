document.addEventListener("DOMContentLoaded", () => {
  if (typeof Swiper === "undefined") return;

  document.querySelectorAll(".stories-swiper").forEach((swiperEl) => {
    if (swiperEl.swiper) {
      swiperEl.swiper.destroy(true, true);
    }

    new Swiper(swiperEl, {
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
  });
});
