//! タイトルフェードイン・アウト
const tl = gsap.timeline({
  defaults: {
    filter: "blur(0px)",
    ease: "power2.inOut",
    opacity: 1,
    duration: 2,
  },
});

tl.to(".main-title", {})

.to(".subtitle",{
    duration: 2,
  },"-=1.5",);

gsap.to(".hero-content", {
  scrollTrigger: {
    trigger: "#hero",
    start: "top top",
    end: "bottom 60%",
    scrub: 1,
  },
  opacity: 0,
  filter: "blur(20px)",
  y: -50,
  ease: "none",
});


//! コンテンツアニメーション

// content-boxそのものをトリガーにする。これなら同じアニメーションにしたい要素を一括でアニメーション可能。
gsap.utils.toArray(".content-box").forEach((box) => {
  gsap.to(box, {
    scrollTrigger: {
      trigger: box,
      start: "top 93%",
      // [入る時, 去る時, 戻って入る時, 戻って去る時]
      toggleActions: "play reverse play reverse", 
    },
    opacity: 1,
    filter: "blur(0px)",
    duration: 1,
    ease: "power2.out"
  });
});

 //! 頭の向きを変えるアニメーション
 // headTarget変数そのもにアニメーションをつける
 const nav = document.querySelector(".nav-vertical");

 nav.addEventListener("mouseenter", ()=>{
  if(window.innerWidth >= 1024){
  gsap.to(headTarget,{
    y: 0.5,
    x: 0.2,
    duration: 0.8,
    ease: "power2.out"
  });
}
 });

 nav.addEventListener("mouseleave", ()=>{
  gsap.to(headTarget, {
    y: 0,
    x: 0,
    duration: .8,
    ease: "power2.out"
  })
 })


 // 電車音
 const soundBtn = document.querySelector('#sound-toggle');
const bgm = document.querySelector('#bgm');
const btnIcon = soundBtn.querySelector('.icon');

let isPlaying = false;

soundBtn.addEventListener('click', () => {
  if (!isPlaying) {
    // 再生開始
    bgm.play();
    bgm.volume = 0; // 最初は無音
    gsap.to(bgm, { volume: 1, duration: 2 }); // 2秒かけて音量を0.5へ
    btnIcon.innerText = "OFF";
    isPlaying = true;
  } else {
    // 停止（フェードアウトしてから停止）
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
