import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------
   1. Smooth scroll (Lenis) + GSAP ScrollTrigger sync
---------------------------------------------------------- */
gsap.registerPlugin(ScrollTrigger);
let lenis;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.1, lerp: 0.1, smoothWheel: true });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ----------------------------------------------------------
   2. Hero 3D sail
---------------------------------------------------------- */
function initSail() {
  const canvas = document.getElementById('sail-canvas');
  if (!canvas) return;
  const section = document.getElementById('sail3d');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  // environment for glossy reflections on the film
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // lighting — neutral key + brand-tinted rim lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rimLime = new THREE.DirectionalLight(0xc8ff00, 2.4);
  rimLime.position.set(-5, 1, -3);
  scene.add(rimLime);
  const rimBlue = new THREE.DirectionalLight(0x27d3ff, 1.8);
  rimBlue.position.set(5, -2, -4);
  scene.add(rimBlue);

  const pivot = new THREE.Group();
  scene.add(pivot);

  let loaded = false;
  const BASE_Y = Math.PI - 0.35;   // resting angle: sail front faces camera
  let curY = BASE_Y, curX = 0;
  let pmx = 0, pmy = 0;            // pointer parallax offsets
  let scrollProg = 0;

  new GLTFLoader().load(
    'assets/models/sail-real.glb',
    (gltf) => {
      const model = gltf.scene;
      // center + scale to a consistent height
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const target = 4.2;
      const scale = target / Math.max(size.y, 0.0001);
      model.scale.setScalar(scale);
      pivot.add(model);
      placeForViewport();
      loaded = true;
      canvas.style.opacity = '1';
    },
    undefined,
    () => { canvas.style.display = 'none'; }   // graceful fallback
  );

  // offset the sail toward the right so hero copy reads on the left
  function placeForViewport() {
    const narrow = window.innerWidth < 900;
    pivot.position.x = narrow ? 0 : 1.7;
    pivot.position.y = narrow ? 0.2 : 0;
    canvas.style.opacity = narrow ? '0.55' : '1';
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    placeForViewport();
  }
  window.addEventListener('resize', resize);
  resize();

  // scroll drives rotation across the hero (limited arc keeps the good face forward)
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { scrollProg = self.progress; },
  });

  // subtle mouse parallax
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      pmx = ((e.clientX / window.innerWidth) * 2 - 1) * 0.25;
      pmy = ((e.clientY / window.innerHeight) * 2 - 1) * 0.12;
    });
  }

  // only render while hero is on screen
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
    .observe(section);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible || !loaded) return;
    const t = clock.getElapsedTime();
    const targetY = BASE_Y + scrollProg * 0.9 + pmx;
    const targetX = pmy;
    curY += (targetY - curY) * 0.06;
    curX += (targetX - curX) * 0.06;
    pivot.rotation.y = curY + Math.sin(t * 0.4) * 0.04;
    pivot.rotation.x = curX + Math.sin(t * 0.5) * 0.015;
    renderer.render(scene, camera);
  }
  tick();
}
initSail();

/* ----------------------------------------------------------
   3. Reveal on scroll
---------------------------------------------------------- */
if (reduceMotion) {
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
} else {
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      onStart: () => el.classList.add('is-revealed'),
    });
  });
}

/* ----------------------------------------------------------
   3b. Hero image parallax
---------------------------------------------------------- */
if (!reduceMotion) {
  const heroImg = document.getElementById('hero-img');
  if (heroImg) gsap.to(heroImg, {
    scale: 1.18, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ----------------------------------------------------------
   4. Parallax on craft images
---------------------------------------------------------- */
if (!reduceMotion) {
  document.querySelectorAll('[data-parallax] img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ----------------------------------------------------------
   5. Nav stuck state
---------------------------------------------------------- */
const nav = document.getElementById('nav');
ScrollTrigger.create({
  start: 'top -80',
  onUpdate: (self) => nav.classList.toggle('is-stuck', self.scroll() > 80),
});

/* ----------------------------------------------------------
   6. Stat counters
---------------------------------------------------------- */
document.querySelectorAll('[data-count]').forEach((el) => {
  const end = parseInt(el.dataset.count, 10);
  const obj = { v: 0 };
  gsap.to(obj, {
    v: end, duration: 1.4, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    onUpdate: () => { el.textContent = Math.round(obj.v); },
  });
});

/* ----------------------------------------------------------
   7. Trick videos — play only when in view
---------------------------------------------------------- */
const vObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const v = entry.target;
    if (entry.isIntersecting) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  });
}, { threshold: 0.25 });
document.querySelectorAll('video[data-trick]').forEach((v) => vObserver.observe(v));

/* ----------------------------------------------------------
   8. Footer year + refresh
---------------------------------------------------------- */
document.getElementById('year').textContent = new Date().getFullYear();
window.addEventListener('load', () => ScrollTrigger.refresh());
