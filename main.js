/* ===== HeYYou global (hand-built shell) ===== */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // GSAP + ScrollTrigger
  if (window.gsap && window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); }

  // Lenis smooth scroll, synced to ScrollTrigger
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.1, lerp: 0.1, smoothWheel: true });
    window.lenis = lenis;
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    if (window.gsap) { gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
    else { (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0); }
  }

  // Reveal on scroll (hero handled by its own init, so skip #hero)
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(function (el) {
    if (!el.closest('#hero')) io.observe(el);
  });

  // Videos: play only while in view
  var vio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (v.play) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
      else if (v.pause) { v.pause(); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('video').forEach(function (v) { vio.observe(v); });

  // Nav scrolled state
  var nav = document.getElementById('nav');
  function onScroll(y) { if (nav) nav.classList.toggle('is-stuck', y > 40); }
  if (lenis) { lenis.on('scroll', function (e) { onScroll((e && typeof e.scroll === 'number') ? e.scroll : (window.scrollY || 0)); }); }
  else { window.addEventListener('scroll', function () { onScroll(window.scrollY || 0); }, { passive: true }); }
  onScroll(window.scrollY || 0);

  // Footer year
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();


/* ===== section init functions ===== */
function initHero(){
  const gsap = window.gsap;
  const section = document.querySelector('#hero');
  if(!section || !gsap) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Staggered entrance on load, echoing the Hero.tsx rise(delay) feel.
  // The global .reveal observer may also fire; GSAP just drives the same
  // elements to their resting state cleanly on first paint.
  const items = gsap.utils.toArray('#hero [data-stagger] > * > .reveal, #hero .reveal');

  if(reduce){
    gsap.set(items, { opacity: 1, y: 0 });
    return;
  }

  gsap.set(items, { opacity: 0, y: 26 });
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.1,
    delay: 0.05,
    onComplete(){ items.forEach(el => el.classList.add('is-in')); }
  });
}

function initMake(){
  const gsap = window.gsap;
  const section = document.getElementById('make');
  if (!section) return;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !gsap || !window.ScrollTrigger) {
    // Fall back to the global IntersectionObserver .reveal behavior; nothing to drive.
    return;
  }

  gsap.registerPlugin(window.ScrollTrigger);

  // Stagger the numbered rows in on scroll. We drive these explicitly, so
  // take them out of the global .reveal observer to avoid a double transition.
  const rows = gsap.utils.toArray(section.querySelectorAll('[data-stagger] .reveal'));
  rows.forEach(function (el) { el.classList.remove('reveal'); });

  gsap.set(rows, { opacity: 0, y: 28 });
  gsap.to(rows, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.09,
    scrollTrigger: {
      trigger: section.querySelector('[data-stagger]'),
      start: 'top 78%',
      once: true
    }
  });
}

function initMaker(){
  const gsap = window.gsap;
  if(!gsap || !window.ScrollTrigger) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const section = document.querySelector('#maker');
  if(!section) return;

  // Subtle parallax lift on the photo as the section scrolls through view.
  const photo = section.querySelector('figure img');
  if(photo){
    gsap.fromTo(photo,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  }
}

function initCraft() {
  const gsap = window.gsap;
  if (!gsap) return;
  const section = document.getElementById('craft');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Reduced motion: skip the scale/dim scrub. The CSS position:sticky stacking
  // still reads as plain, ordered content.
  if (prefersReduced) return;

  gsap.registerPlugin(ScrollTrigger);

  const cards = gsap.utils.toArray(section.querySelectorAll('.craft-card'));
  if (cards.length < 2) return;

  cards.forEach((card, i) => {
    // The last card never gets covered, so it doesn't scale back.
    if (i === cards.length - 1) return;

    const next = cards[i + 1];

    // As `next` rises to cover `card`, gently shrink + dim `card`. The dim only
    // starts once `next` is well up the viewport, so the card you are reading
    // stays bright and legible, and the receded state never goes dark.
    gsap.to(card, {
      scale: 0.97,
      filter: 'brightness(0.86)',
      ease: 'none',
      scrollTrigger: {
        trigger: next,
        start: 'top 42%',
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });
}

function initAction() {
  const gsap = window.gsap;
  const section = document.getElementById('action');
  if (!section) return;

  const track = section.querySelector('.hy-hscroll-track');
  const panels = track ? Array.prototype.slice.call(track.querySelectorAll('.hy-hscroll-panel')) : [];
  const videos = Array.prototype.slice.call(section.querySelectorAll('.hy-vid'));
  if (!track || panels.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Autoplay each video when it (or the section) enters the viewport ---
  // Adapted from the part's motion intent: media should be live as it sweeps past.
  const playSafe = function (v) {
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const v = entry.target;
        if (entry.isIntersecting) playSafe(v);
        else { try { v.pause(); } catch (e) {} }
      });
    }, { root: null, threshold: 0.15 });
    videos.forEach(function (v) { io.observe(v); });
  } else {
    videos.forEach(playSafe);
  }
  // Also kick playback once the whole section is on screen (covers the pinned case
  // where a card may not individually cross the observer threshold on some browsers).
  if ('IntersectionObserver' in window) {
    const sectionIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) videos.forEach(playSafe);
      });
    }, { threshold: 0.05 });
    sectionIo.observe(section);
  }

  if (prefersReduced || typeof gsap === 'undefined') return; // CSS handles the non-pinned fallback
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  // --- Horizontal sweep: vertical scroll translates the over-wide track ---
  // Distance = track overflow beyond the viewport width (recomputed on refresh).
  const getScrollDistance = function () {
    return Math.max(0, track.scrollWidth - window.innerWidth);
  };

  const tween = gsap.to(track, {
    x: function () { return -getScrollDistance(); },
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: function () { return '+=' + getScrollDistance(); },
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // --- Per-panel parallax mapped inside the horizontal tween (containerAnimation) ---
  panels.forEach(function (panel) {
    const media = panel.querySelector('[data-hscroll-parallax]');
    if (!media) return;
    gsap.fromTo(
      media,
      { xPercent: -6 },
      {
        xPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: panel,
          containerAnimation: tween,
          start: 'left right',
          end: 'right left',
          scrub: true,
        },
      }
    );
  });
}

function initRig(){
  const gsap = window.gsap;
  const section = document.getElementById('rig');
  if(!section) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){
    section.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('is-in'); });
    section.querySelectorAll('[data-stagger]').forEach(function(el){ el.classList.add('is-in'); });
    return;
  }

  // If GSAP + ScrollTrigger are available, drive the reveal for smoother, scrubbed control.
  if(gsap && window.ScrollTrigger){
    var ScrollTrigger = window.ScrollTrigger;

    // simple reveals (header + CTA row)
    gsap.utils.toArray('#rig .reveal:not([data-stagger])').forEach(function(el){
      if(el.hasAttribute('data-stagger')) return;
      // skip bento cards here; they animate as a stagger group below
      if(el.matches('[data-bento]')) return;
      gsap.fromTo(el,{opacity:0,y:38},{
        opacity:1,y:0,duration:.7,ease:'power3.out',
        onStart:function(){ el.classList.add('is-in'); },
        scrollTrigger:{ trigger:el, start:'top 85%', once:true }
      });
    });

    // bento cards: batch stagger as the grid enters view
    var cards = gsap.utils.toArray('#rig [data-stagger] [data-bento]');
    if(cards.length){
      gsap.fromTo(cards,{opacity:0,y:40},{
        opacity:1,y:0,duration:.7,ease:'power3.out',stagger:0.09,
        onStart:function(){
          cards.forEach(function(c){ c.classList.add('is-in'); });
          var grid = section.querySelector('[data-stagger]');
          if(grid) grid.classList.add('is-in');
        },
        scrollTrigger:{ trigger:section.querySelector('[data-stagger]'), start:'top 82%', once:true }
      });
    }
    return;
  }

  // Fallback: IntersectionObserver toggles .is-in (matches global convention).
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    },{ rootMargin:'0px 0px -12% 0px', threshold:0.12 });
    section.querySelectorAll('.reveal, [data-stagger]').forEach(function(el){ io.observe(el); });
  } else {
    section.querySelectorAll('.reveal, [data-stagger]').forEach(function(el){ el.classList.add('is-in'); });
  }
}

function initLimited(){
  const gsap = window.gsap;
  if(!gsap) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Gently pause/play the background film based on visibility to save cycles.
  const video = document.querySelector('#limited video');
  if(video){
    if(reduce){
      try { video.pause(); } catch(e){}
    } else if(window.ScrollTrigger){
      window.ScrollTrigger.create({
        trigger: '#limited',
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => { video.play().catch(()=>{}); },
        onEnterBack: () => { video.play().catch(()=>{}); },
        onLeave: () => { try { video.pause(); } catch(e){} },
        onLeaveBack: () => { try { video.pause(); } catch(e){} },
      });
    }
  }

  if(reduce) return;

  // Slow parallax drift on the aurora glows for depth.
  const glows = gsap.utils.toArray('#limited [aria-hidden="true"].blur-3xl');
  if(glows.length && window.ScrollTrigger){
    gsap.to(glows, {
      yPercent: (i) => (i % 2 === 0 ? -12 : 14),
      ease: 'none',
      scrollTrigger: {
        trigger: '#limited',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
}

function initContact(){
  var section = document.getElementById("contact");
  if (!section) return;
  var form = section.querySelector("#cf-form");
  if (!form || form.dataset.cfBound) return;
  form.dataset.cfBound = "true";

  var card = form.parentElement;
  var success = card.querySelector("[data-cf-success]");
  var submitBtn = form.querySelector("[data-cf-submit]");
  var submitLabel = form.querySelector("[data-cf-label]");
  var resetBtn = card.querySelector("[data-cf-reset]");

  function field(name){ return form.querySelector('[name="' + name + '"]'); }
  function errorEl(name){ return form.querySelector('[data-error-for="' + name + '"]'); }

  function setError(name, msg){
    var input = field(name), el = errorEl(name);
    if (msg){
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", "cf-" + name + "-error");
      el.id = "cf-" + name + "-error";
      el.textContent = msg;
      el.classList.remove("hidden");
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      el.textContent = "";
      el.classList.add("hidden");
    }
  }

  function validate(){
    var errs = {};
    var name = field("name").value.trim();
    var email = field("email").value.trim();
    var message = field("message").value.trim();
    if (!name) errs.name = "Let us know your name.";
    if (!email) errs.email = "We need an email to reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "That email doesn't look quite right.";
    if (message.length < 10) errs.message = "A little more detail helps Youp build it right (10+ characters).";
    return errs;
  }

  ["name", "email", "message"].forEach(function(name){
    field(name).addEventListener("input", function(){
      if (field(name).getAttribute("aria-invalid") === "true") setError(name, null);
    });
  });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var errs = validate();
    ["name", "email", "message"].forEach(function(n){ setError(n, errs[n] || null); });
    var keys = Object.keys(errs);
    if (keys.length){ field(keys[0]).focus(); return; }

    // Route the message to Youp via a pre-filled WhatsApp deep-link.
    var name = field("name").value.trim();
    var email = field("email").value.trim();
    var msg = field("message").value.trim();
    var text = "Hi Youp! I'm interested in a HeYYou sail.\n\n"
             + "Name: " + name + "\n"
             + "Email: " + email + "\n\n"
             + "My setup:\n" + msg;
    var waUrl = "https://wa.me/5997821269?text=" + encodeURIComponent(text);

    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = "Opening WhatsApp…";
    window.open(waUrl, "_blank", "noopener");
    setTimeout(function(){
      form.reset();
      form.classList.add("hidden");
      success.classList.remove("hidden");
      success.classList.add("flex");
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Send on WhatsApp";
    }, 500);
  });

  if (resetBtn){
    resetBtn.addEventListener("click", function(){
      success.classList.add("hidden");
      success.classList.remove("flex");
      form.classList.remove("hidden");
      field("name").focus();
    });
  }
}

/* Sticky Grid Scroll — pinned 3-column zoom grid (saltycodestudio-parts/motion/sticky-grid-scroll).
   Lenis is already wired to ScrollTrigger by the global init, so we pass {lenis:false}. */
function initStickyGridScroll(root, userOptions){
  root = root || document;
  var gsap = window.gsap;
  if (!gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(window.ScrollTrigger);
  var opts = Object.assign({
    scrollLength: 2.6, zoom: 2.05, columnOffset: 18,
    stagger: 0.06, revealStart: 0.7, revealEnd: 0.86
  }, userOptions || {});
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.querySelectorAll('.sgs').forEach(function(section){
    var stage = section.querySelector('.sgs-stage');
    var grid = section.querySelector('.sgs-grid');
    var content = section.querySelector('[data-sgs-content]');
    var cells = gsap.utils.toArray(section.querySelectorAll('.sgs-cell'));
    var leftCol = section.querySelector('[data-col="left"]');
    var centerCol = section.querySelector('[data-col="center"]');
    var rightCol = section.querySelector('[data-col="right"]');
    if (!stage || !grid || !cells.length) return;

    var fromTop = [], fromBottom = [];
    gsap.utils.toArray(section.querySelectorAll('.sgs-col')).forEach(function(col){
      var colCells = gsap.utils.toArray(col.querySelectorAll('.sgs-cell'));
      if (col === centerCol) fromTop = fromTop.concat(colCells);
      else fromBottom = fromBottom.concat(colCells);
    });

    if (reduce) {
      gsap.set(cells, { autoAlpha: 1, yPercent: 0, scale: 1 });
      gsap.set(grid, { scale: 1 });
      if (content) gsap.set(content, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.set(fromTop, { yPercent: -160, autoAlpha: 0, scale: 0.92 });
    gsap.set(fromBottom, { yPercent: 160, autoAlpha: 0, scale: 0.92 });
    gsap.set(grid, { scale: 0.86, transformOrigin: '50% 50%' });
    if (content) gsap.set(content, { autoAlpha: 0, y: 28 });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section, start: 'top top',
        end: function(){ return '+=' + window.innerHeight * opts.scrollLength; },
        scrub: 1, pin: stage, anticipatePin: 1, invalidateOnRefresh: true
      }
    });

    tl.to(fromTop, { yPercent: 0, autoAlpha: 1, scale: 1, duration: 1.1,
      ease: 'power2.out', stagger: { each: opts.stagger, from: 'start' } }, 0);
    tl.to(fromBottom, { yPercent: 0, autoAlpha: 1, scale: 1, duration: 1.1,
      ease: 'power2.out', stagger: { each: opts.stagger, from: 'end' } }, 0.12);

    tl.to(grid, { scale: opts.zoom, duration: 1.6, ease: 'power1.inOut' }, 0.9);
    if (leftCol) tl.to(leftCol, { xPercent: -opts.columnOffset, duration: 1.6, ease: 'power1.inOut' }, 0.9);
    if (rightCol) tl.to(rightCol, { xPercent: opts.columnOffset, duration: 1.6, ease: 'power1.inOut' }, 0.9);
    if (centerCol) tl.to(centerCol, { yPercent: -4, duration: 1.6, ease: 'power1.inOut' }, 0.9);

    if (content) {
      var total = tl.duration() || 1;
      var inAt = opts.revealStart * total;
      var outAt = opts.revealEnd * total;
      tl.to(content, { autoAlpha: 1, y: 0, duration: Math.max(0.001, outAt - inAt), ease: 'power2.out' }, inAt);
      tl.to(grid, { filter: 'brightness(0.5)', duration: outAt - inAt }, inAt);
    }
  });
}

/* ===== run section inits ===== */
try{ if(typeof initHero === 'function') initHero(); }catch(e){ console.error('initHero', e); }
try{ if(typeof initMake === 'function') initMake(); }catch(e){ console.error('initMake', e); }
try{ if(typeof initMaker === 'function') initMaker(); }catch(e){ console.error('initMaker', e); }
try{ if(typeof initCraft === 'function') initCraft(); }catch(e){ console.error('initCraft', e); }
try{ if(typeof initAction === 'function') initAction(); }catch(e){ console.error('initAction', e); }
try{ if(typeof initRig === 'function') initRig(); }catch(e){ console.error('initRig', e); }
try{ if(typeof initLimited === 'function') initLimited(); }catch(e){ console.error('initLimited', e); }
try{ if(typeof initContact === 'function') initContact(); }catch(e){ console.error('initContact', e); }
if (window.ScrollTrigger) { setTimeout(function(){ ScrollTrigger.refresh(); }, 250); }
