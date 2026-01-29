//! タイトルフェードイン・アウト

// ★ 初期状態を明示的に設定
gsap.set(".hero-content", {
  opacity: 1,
  filter: "blur(0px)",
  y: 0
});

const tl = gsap.timeline({
  defaults: {
    filter: "blur(0px)",
    ease: "power2.inOut",
    opacity: 1,
    duration: 2,
  },
});

tl.to(".main-title", {})
  .to(".subtitle", {
    duration: 2,
  }, "-=1.5");

// ★ scrub を 1 → 0.5 に（より滑らか）
// ★ end を固定値に変更
gsap.to(".hero-content", {
  scrollTrigger: {
    trigger: "#hero",
    start: "top top",
    end: "bottom top", // ★ 60% → top に変更（シンプルに）
    scrub: 1, // ★ 1 → 0.5（より滑らか）
    markers: true, 
  },
  opacity: 0,
  filter: "blur(20px)",
  y: -50,
  ease: "none",
});

//! コンテンツアニメーション
gsap.utils.toArray(".content-box").forEach((box) => {
  gsap.to(box, {
    scrollTrigger: {
      trigger: box,
      start: "top 93%",
      toggleActions: "play reverse play reverse",
    },
    opacity: 1,
    filter: "blur(0px)",
    duration: 1,
    ease: "power2.out"
  });
});

//! 頭の向きを変えるアニメーション
const nav = document.querySelector(".nav-vertical");
nav.addEventListener("mouseenter", () => {
  if (window.innerWidth >= 1024) {
    gsap.to(headTarget, {
      y: 0.5,
      x: 0.2,
      duration: 0.8,
      ease: "power2.out"
    });
  }
});

nav.addEventListener("mouseleave", () => {
  gsap.to(headTarget, {
    y: 0,
    x: 0,
    duration: .8,
    ease: "power2.out"
  })
});

//! 電車音
const soundBtn = document.querySelector('#sound-toggle');
const bgm = document.querySelector('#bgm');
const btnIcon = soundBtn.querySelector('.icon');
let isPlaying = false;

soundBtn.addEventListener('click', () => {
  if (!isPlaying) {
    bgm.play();
    bgm.volume = 0;
    gsap.to(bgm, { volume: 1, duration: 2 });
    btnIcon.innerText = "OFF";
    isPlaying = true;
  } else {
    gsap.to(bgm, {
      volume: 0,
      duration: .5,
      onComplete: () => {
        bgm.pause();
        btnIcon.innerText = "ON";
      }
    });
    isPlaying = false;
  }
});