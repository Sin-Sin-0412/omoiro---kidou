import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
// DoFは少し特殊で、標準的なBokehPassなどを使います
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
// fps確認用
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
  isPlayingAction1;

//頭を動かす用 目標とする角度を保持するオブジェクト（GSAPでここをアニメーションさせる）
//const headTargetにするとanimate.jsから参照できないため、windowでグローバル変数にする。
window.headTarget = { x: 0, y: 0 };

function init() {
  //stats = new Stats();
  //document.body.appendChild(stats.dom);

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
  sunLight.shadow.mapSize.width = 2048; // デフォルトは512
  sunLight.shadow.mapSize.height = 2048;

  scene.add(sunLight);

  //!リムライト 影を落とさず
  const rimLight = new THREE.PointLight(0xffaa00, 2, 1);
  rimLight.position.set(-3.8, 1, -2);
  scene.add(rimLight);

  /*const rimHelper = new THREE.PointLightHelper(rimLight, 0.2);
  scene.add(rimHelper);*/

  //!空の色と地面の反射
  const hemiLight = new THREE.HemisphereLight(0xffc8a0, 0x2c3e50, 0.5);
  scene.add(hemiLight);

  //!環境マップ
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("image/sun3.jpg", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture; // これでモデルが夕焼けを反射する
  });

  //!ハの字背景
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

    //アニメーション
    //animation1を1回だけ再生し、その後はanimation2を再生
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

      //mixerが管理してるいずれかのアニメーションが終わったら実行される
      // e.action にはたった今終わったアニメーションが入ってる。
      mixer.addEventListener("finished", (e) => {
        if (e.action === action1) {
          // 最初の1回が終わったら、action2を開始
          isPlayingAction1 = false; 
          playAction2WithDelay(0); // 最初は待ち時間なしでOK
        } else if (e.action === action2) {
          // action2が終わるたびに、ランダムな待ち時間（2秒〜5秒）を作って再実行
          const delay = 2000 + Math.random() * 5000;
          playAction2WithDelay(delay);
        }
      });

      // action2を再生するための専用関数（delay付き）
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
      //ファンを探す
      if (child.name === "fun1") {
        fun1 = child;
      }

      if (child.name === "fun2") {
        fun2 = child;
      }

      //プロペラを探す
      if (child.name === "pro") {
        pro = child;
      }

      if (child.name === "pro2") {
        pro2 = child;
      }

      // 頭を探す
      if (child.name === "atama") {
        atamaBone = child;
      }

      if (child.isMesh) {
        // 【パキパキ解消】法線を再計算して滑らかにする
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
    const dustGeometry = new THREE.BufferGeometry(); //大量の点・線・面を効率よく扱うための箱

    //点の位置データを入れる配列を作る。GPUにそのまま渡せる高速な数値配列
    //Float32ArrayはGPUにそのまま渡せる高速な数値配列
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

    /*//カメラ操作
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 100;

    controls.enableDamping = true;
    controls.dampingFactor = 0.5;
    controls.enabled = true;
    controls.target.set(0, 1, -2);
    */

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

  //ボケ
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

  //画面のざらつき
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
  const aspect = width / height;

  camera.aspect = width / height;

  if (aspect < 1) {
    camera.position.x = 2; //スマホ表示時
  } else {
    // 現場流：アスペクト比に応じてFOVを滑らかに計算する
    // 横長になればなるほど、FOVを85から60へ近づける
    const minAspect = 1.77; // 16:9
    const maxAspect = 2.5; // かなりの横長

    if (aspect <= minAspect) {
      camera.fov = 85;
      camera.position.x = 3.9;
    } else if (aspect >= maxAspect) {
      camera.fov = 60;
      camera.position.x = 3.9;
    } else {
      // 1.77から2.5の間を 0.0 〜 1.0 の割合に変換
      const t = (aspect - minAspect) / (maxAspect - minAspect);
      // 割合(t)を使って、85から60の間を滑らかに補完（線形補完）
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
}

//!アニメーション関数
const clock = new THREE.Clock();

function animate() {
  //stats.begin();

  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // 夕日移動
  if (sunLight) sunLight.position.z -= delta * 0.01;

  // カメラの揺れ用
  // 順番に注意。getDeltaの前で宣言したらエラ−が起きる
  const time = clock.getElapsedTime(); // カメラの揺れ用

  if (camera) {
    // positionを直接書き換えるのではなく、わずかに加算する
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

  //頭を動かすアニメーション。
  //mixer内のアニメーションに上書きするため、mixer.update(delta)より下に書く必要がある。
  if (atamaBone) {
    if(!isPlayingAction1){
    atamaBone.rotation.y = headTarget.y;
    atamaBone.rotation.x = headTarget.x;
    }
  }

  //首振りさせる
  if (fun1) {
    fun1.rotation.z = Math.sin(time * 0.5) * 0.5;
  }

  if (fun2) {
    fun2.rotation.z = -Math.sin(time * 0.5) * 0.5;
  }

  //プロペラを回す
  if (pro) pro.rotation.y += delta * 20;
  if (pro2) pro2.rotation.y += delta * 20;

  if (controls) controls.update();

  composer.render();

  //stats.end();
}

init();
