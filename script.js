import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import Stats from "three/addons/libs/stats.module.js";

//!変数定義
let scene,
  camera,
  renderer,
  sunLight,
  controls,
  canvas,
  evil,
  pro,
  pro2,
  fun1,
  fun2,
  action1,
  action2,
  mixer,
  composer,
  backgroundTexture,
  textureL,
  textureR,
  dust,
  stats,
  atamaBone,
  isLookingAtMenu = false,
  isPlayingAction1,
  lastWidth = null;

//頭動かす用
window.headTarget = { x: 0, y: 0 };

function init() {

  //!シーン追加
  scene = new THREE.Scene();

  //!霧
  scene.fog = new THREE.FogExp2(0xfab37f, 0.03);

  //!カメラ追加
  camera = new THREE.PerspectiveCamera(
    85,
    window.innerWidth / window.innerHeight,
    0.3,
    500,
  );
  camera.position.set(3.9, -0.1, 2.5);
  camera.rotation.y = 0.72;

  //!レンダー追加
  canvas = document.querySelector("#canvas");
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  //!夕日のライト
  sunLight = new THREE.DirectionalLight(0xffa05a, 1.0);
  sunLight.position.set(20, 3, 9.5);
  sunLight.castShadow = true;
  sunLight.shadow.bias = -0.005;
  //光があたる範囲を広げる設定
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 4;
  sunLight.shadow.camera.bottom = -20;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.radius = 1;
  sunLight.shadow.mapSize.width = 2048; 
  sunLight.shadow.mapSize.height = 2048;

  scene.add(sunLight);

  //!リムライト 影を落とさず
  const rimLight = new THREE.PointLight(0xffaa00, 2, 1);
  rimLight.position.set(-3.8, 1, -2);
  scene.add(rimLight);

  //!空の色と地面の反射
  const hemiLight = new THREE.HemisphereLight(0xffc8a0, 0x2c3e50, 0.5);
  scene.add(hemiLight);

  //!環境マップ
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("image/sun3.jpg", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture; // これでモデルが夕焼けを反射する
  });

  //!字背景
  const planeGeo = new THREE.PlaneGeometry(800, 400);
  const planeLoader = new THREE.TextureLoader();

  textureL = planeLoader.load("image/hai4.jpg");
  textureL.wrapS = THREE.RepeatWrapping;
  const matL = new THREE.MeshBasicMaterial({
    map: textureL,
    side: THREE.DoubleSide,
    fog: false,
  });
  const planeL = new THREE.Mesh(planeGeo, matL);

  textureR = planeLoader.load("image/sun3.jpg");
  textureR.wrapS = THREE.RepeatWrapping;
  const matR = new THREE.MeshBasicMaterial({
    map: textureR,
    side: THREE.DoubleSide,
    fog: false,
  });
  const planeR = new THREE.Mesh(planeGeo, matR);

  planeL.position.set(-100, 110, -200);
  planeL.rotation.y = Math.PI / 2.5;

  planeR.position.set(100, 23, -200);
  planeR.rotation.y = -Math.PI / 2.5;

  scene.add(planeL, planeR);

  //!モデル読み込み
  const loader = new GLTFLoader();
  loader.load("model/evil16.glb", (gltf) => {
    evil = gltf.scene;
    evil.position.y = -3;
    evil.children.forEach((child) => {
      child.rotation.y = Math.PI;
    });
    canvas.style.opacity = '1';

    mixer = new THREE.AnimationMixer(evil);
    const clips = gltf.animations;
    const clip1 = THREE.AnimationClip.findByName(clips, "animation1");
    const clip2 = THREE.AnimationClip.findByName(clips, "animation2");

    if (clip1 && clip2) {
      const action1 = mixer.clipAction(clip1);
      const action2 = mixer.clipAction(clip2);

      action1.setLoop(THREE.LoopOnce);
      action1.clampWhenFinished = true;

      action2.setLoop(THREE.LoopOnce);
      action2.clampWhenFinished = true;

      mixer.addEventListener("finished", (e) => {
        if (e.action === action1) {
          isPlayingAction1 = false; 
          playAction2WithDelay(0); 
        } else if (e.action === action2) {
          const delay = 2000 + Math.random() * 5000;
          playAction2WithDelay(delay);
        }
      });

      function playAction2WithDelay(ms) {
        setTimeout(() => {
          action2.reset();
          action2.play();
        }, ms);
      }

      action1.play();
      isPlayingAction1 = true;
    }

    evil.traverse((child) => {

      if (child.name === "fun1") {
        fun1 = child;
      }

      if (child.name === "fun2") {
        fun2 = child;
      }


      if (child.name === "pro") {
        pro = child;
      }

      if (child.name === "pro2") {
        pro2 = child;
      }


      if (child.name === "atama") {
        atamaBone = child;
      }

      if (child.isMesh) {
     
        child.geometry.computeVertexNormals();

        child.material = new THREE.MeshToonMaterial({
          map: child.material.map,
          color: child.material.color,
        });

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    //!埃を追加
    const dustCount = 800;
    const dustGeometry = new THREE.BufferGeometry(); 

    const positions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = Math.pow(Math.random(), 2) * 4 - 1.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const dustMaterial = new THREE.PointsMaterial({
      color: 0xfc8f3f,
      size: 0.02,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });

    dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    scene.add(evil);
  });

  window.addEventListener("resize", onWindowResize);
  onWindowResize();

  initPostProcessing();
  animate();
}

//!コンポーザー
function initPostProcessing() {
  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 4,
    aperture: 0.001,
    maxblur: 0.0018,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  composer.addPass(bokehPass);

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,
    0.1,
    0.7,
  );

  composer.addPass(bloom);

  const filmPass = new FilmPass(
    0.5, //* 粒子の濃さ
    0, //* スキャンライン（横線）の濃さ。0にすれば粒子のみ
    0, //* スキャンラインの数
    false, //* 白黒にするかどうか
  );

  composer.addPass(filmPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);
}

//!リサイズ関数
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  lastWidth = width;

  const aspect = width / height;

  camera.aspect = width / height;

  if (aspect < 1) {
    camera.position.x = 2; 
  } else {
    const minAspect = 1.77; 
    const maxAspect = 2.5; 
    if (aspect <= minAspect) {
      camera.fov = 85;
      camera.position.x = 3.9;
    } else if (aspect >= maxAspect) {
      camera.fov = 60;
      camera.position.x = 3.9;
    } else {
      const t = (aspect - minAspect) / (maxAspect - minAspect);
      camera.fov = 85 + (60 - 85) * t;
    }
  }

  if (sunLight) {
    sunLight.shadow.camera.updateProjectionMatrix();

    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    if (composer) {
      composer.setSize(width, height);
    }
  }

  ScrollTrigger.refresh();
  
}

//!アニメーション関数
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (sunLight) sunLight.position.z -= delta * 0.01;

  const time = clock.getElapsedTime(); 

  if (camera) {
    camera.position.x += Math.sin(time * 0.8) * 0.0004;
    camera.position.y += Math.cos(time * 0.7) * 0.0004;
    camera.rotation.z += Math.sin(time * 0.5) * 0.0001;
  }

  if(dust) dust.rotation.y += 0.0002;
  if(dust) dust.position.y += Math.sin(clock.elapsedTime * 0.2) * 0.0005;

  if (textureL) textureL.offset.x += delta * 0.1;

  if (textureR) textureR.offset.x -= delta * 0.1;

  if (mixer) {
    mixer.update(delta);
  }

  if (atamaBone) {
    if(!isPlayingAction1){
    atamaBone.rotation.y = headTarget.y;
    atamaBone.rotation.x = headTarget.x;
    }
  }

  if (fun1) {
    fun1.rotation.z = Math.sin(time * 0.5) * 0.5;
  }

  if (fun2) {
    fun2.rotation.z = -Math.sin(time * 0.5) * 0.5;
  }

  if (pro) pro.rotation.y += delta * 20;
  if (pro2) pro2.rotation.y += delta * 20;

  if (controls) controls.update();

  composer.render();

}

init();
