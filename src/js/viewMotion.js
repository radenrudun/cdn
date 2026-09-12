/**
 * viewMotion.js
 * Lightweight on-scroll animation library
 * Author: (your name)
 * Version: 1.0.0
 *
 * Usage:
 *   // Otomatis via data-vm
 *   <div data-vm="fade-up" data-vm-duration="600" data-vm-delay="100"></div>
 *
 *   // Manual
 *   viewMotion("#hero", { animation: "zoom", duration: 400 });
 *   viewMotion(".card", { animation: "slideLeft", stagger: 100 });
 *
 *   // Init semua otomatis
 *   viewMotion.init();
 */

(function (global) {
   "use strict";

   // ============================================================
   // PRESET ANIMASI
   // ============================================================
   const PRESETS = {
      fade: opt => [{ opacity: 0 }, { opacity: 1 }],
      "fade-up": () => [
         { opacity: 0, transform: "translateY(40px)" },
         { opacity: 1, transform: "translateY(0)" }
      ],
      "fade-down": () => [
         { opacity: 0, transform: "translateY(-40px)" },
         { opacity: 1, transform: "translateY(0)" }
      ],
      "fade-left": () => [
         { opacity: 0, transform: "translateX(40px)" },
         { opacity: 1, transform: "translateX(0)" }
      ],
      "fade-right": () => [
         { opacity: 0, transform: "translateX(-40px)" },
         { opacity: 1, transform: "translateX(0)" }
      ],
      zoom: () => [
         { opacity: 0.5, transform: "scale(0.5)" },
         { opacity: 1, transform: "scale(1.1)", offset: 0.7 },
         { opacity: 1, transform: "scale(1)" }
      ],
      "zoom-in": () => [
         { opacity: 0, transform: "scale(0.6)" },
         { opacity: 1, transform: "scale(1)" }
      ],
      "zoom-out": () => [
         { opacity: 0, transform: "scale(1.4)" },
         { opacity: 1, transform: "scale(1)" }
      ],
      rotate: () => [
         { opacity: 0, transform: "rotate(-15deg) scale(0.8)" },
         { opacity: 1, transform: "rotate(0) scale(1)" }
      ],
      bounce: () => [
         { opacity: 0, transform: "scale(0.3)" },
         { opacity: 1, transform: "scale(1.2)", offset: 0.6 },
         { opacity: 1, transform: "scale(0.9)", offset: 0.8 },
         { opacity: 1, transform: "scale(1)" }
      ],
      blur: () => [
         { opacity: 0, filter: "blur(10px)" },
         { opacity: 1, filter: "blur(0)" }
      ],
      pop: () => [
         { opacity: 0, transform: "scale(0) rotate(-10deg)" },
         { opacity: 0.8, transform: "scale(1.15) rotate(2deg)", offset: 0.5 },
         { opacity: 1, transform: "scale(1) rotate(0)" }
      ],
      glitch: () => [
         {
            opacity: 0,
            transform: "translateX(-4px) skewX(-5deg)",
            filter: "blur(2px)"
         },
         {
            opacity: 0.5,
            transform: "translateX(4px) skewX(5deg)",
            offset: 0.3
         },
         {
            opacity: 1,
            transform: "translateX(0) skewX(0)",
            filter: "blur(0)",
            offset: 0.7
         },
         { opacity: 1, transform: "translateX(0) skewX(0)" }
      ],
      drop: () => [
         { opacity: 0, transform: "translateY(-40px) scale(0.9)" },
         {
            opacity: 0.6,
            transform: "translateY(5px) scale(1.05)",
            offset: 0.7
         },
         { opacity: 1, transform: "translateY(0) scale(1)" }
      ],
      flip: () => [
         { opacity: 0, transform: "perspective(600px) rotateX(-90deg)" },
         { opacity: 1, transform: "perspective(600px) rotateX(0)" }
      ],
      "flip-y": () => [
         { opacity: 0, transform: "perspective(600px) rotateY(-90deg)" },
         { opacity: 1, transform: "perspective(600px) rotateY(0)" }
      ],
      swing: () => [
         { opacity: 0, transform: "rotateZ(-10deg)" },
         { opacity: 1, transform: "rotateZ(5deg)", offset: 0.5 },
         { opacity: 1, transform: "rotateZ(-3deg)", offset: 0.75 },
         { opacity: 1, transform: "rotateZ(0)" }
      ],
      shake: () => [
         { opacity: 0, transform: "translateX(0)" },
         { opacity: 1, transform: "translateX(-8px)", offset: 0.3 },
         { opacity: 1, transform: "translateX(8px)", offset: 0.5 },
         { opacity: 1, transform: "translateX(-4px)", offset: 0.7 },
         { opacity: 1, transform: "translateX(0)" }
      ],
      none: () => [{ opacity: 1 }, { opacity: 1 }]
   };

   // ============================================================
   // DEFAULT OPTIONS
   // ============================================================
   const DEFAULTS = {
      animation: "fade-up",
      duration: 600,
      delay: 0,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      threshold: 0.15, // 0 - 1
      rootMargin: "0px", // contoh: "0px 0px -50px 0px"
      once: true, // hanya animasi sekali
      stagger: 0, // jeda per element dalam ms (khusus selector multi)
      reverse: false, // animasi mundur saat keluar viewport
      attribute: "data-vm",
      useDataAttributes: true,
      onStart: null, // (el, anim) => {}
      onFinish: null, // (el, anim) => {}
      onEnter: null, // alias onStart
      onExit: null // (el) => {} saat keluar viewport (jika once=false)
   };

   // ============================================================
   // UTIL
   // ============================================================
   const isElement = el => el instanceof Element;

   const toArray = target => {
      if (!target) return [];
      if (isElement(target)) return [target];
      if (typeof target === "string") {
         return Array.from(document.querySelectorAll(target));
      }
      if (target instanceof NodeList || Array.isArray(target)) {
         return Array.from(target);
      }
      return [];
   };

   const parseBool = v => v === "" || v === "true" || v === "1";

   const parseNumber = (v, fallback) => {
      const n = parseFloat(v);
      return isNaN(n) ? fallback : n;
   };

   // ============================================================
   // CLASS VIEWMOTION
   // ============================================================
   class ViewMotionInstance {
      constructor(target, options = {}) {
         this.elements = toArray(target);
         this.options = Object.assign({}, DEFAULTS, options);
         this.observer = null;
         this.started = new WeakSet();
         this.triggered = new WeakSet();
         this._buildObserver();
         this._observeAll();
      }

      _buildObserver() {
         const opt = this.options;

         // kalau IntersectionObserver gak ada -> langsung tampil
         if (typeof IntersectionObserver === "undefined") {
            this.elements.forEach(el => this._play(el, 0, true));
            return;
         }

         this.observer = new IntersectionObserver(
            entries => {
               entries.forEach((entry, i) => {
                  const el = entry.target;
                  const elOptions = el.__vmOptions || this.options;

                  if (entry.isIntersecting) {
                     if (elOptions.once && this.triggered.has(el)) return;
                     const stagger = elOptions.stagger || 0;
                     const idx = this.elements.indexOf(el);
                     const delayExtra =
                        stagger > 0 && idx > -1 ? idx * stagger : 0;

                     this._play(
                        el,
                        (elOptions.delay || 0) + delayExtra,
                        false,
                        elOptions
                     );
                     this.triggered.add(el);

                     if (elOptions.once && this.observer) {
                        this.observer.unobserve(el);
                     }
                  } else {
                     // keluar viewport
                     if (!elOptions.once && elOptions.reverse) {
                        this._reset(el);
                     }
                     if (typeof elOptions.onExit === "function") {
                        elOptions.onExit(el);
                     }
                  }
               });
            },
            {
               threshold: opt.threshold,
               rootMargin: opt.rootMargin
            }
         );
      }

      _observeAll() {
         if (!this.observer) return;
         this.elements.forEach(el => this.observer.observe(el));
      }

      _play(el, delay, immediate = false, optsOverride = null) {
         const opt = optsOverride || el.__vmOptions || this.options;
         const preset = PRESETS[opt.animation] || PRESETS["fade-up"];
         const keyframes = preset(opt);

         // set state awal biar gak "flash"
         if (!this.started.has(el)) {
            try {
               el.style.opacity = keyframes[0].opacity ?? 1;
               if (keyframes[0].transform)
                  el.style.transform = keyframes[0].transform;
               if (keyframes[0].filter) el.style.filter = keyframes[0].filter;
            } catch (e) {}
         }

         const run = () => {
            const anim = el.animate(keyframes, {
               duration: opt.duration,
               delay: 0,
               easing: opt.easing,
               fill: "both"
            });

            el.__vmAnimation = anim;
            this.started.add(el);

            if (typeof opt.onStart === "function") opt.onStart(el, anim);
            if (typeof opt.onEnter === "function") opt.onEnter(el, anim);

            anim.onfinish = () => {
               try {
                  el.style.opacity = "";
                  el.style.transform = "";
                  el.style.filter = "";
               } catch (e) {}
               if (typeof opt.onFinish === "function") opt.onFinish(el, anim);
            };
         };

         if (immediate || delay <= 0) run();
         else setTimeout(run, delay);
      }

      _reset(el) {
         if (el.__vmAnimation) {
            try {
               el.__vmAnimation.cancel();
            } catch (e) {}
         }
         this.started.delete(el);
      }

      /**
       * Trigger manual (play semua)
       */
      play() {
         this.elements.forEach((el, i) => {
            const opt = el.__vmOptions || this.options;
            const stagger = opt.stagger || 0;
            this._play(el, (opt.delay || 0) + i * stagger, false, opt);
         });
         return this;
      }

      /**
       * Reset semua animasi
       */
      reset() {
         this.elements.forEach(el => this._reset(el));
         return this;
      }

      /**
       * Tambah element baru
       */
      add(target) {
         const els = toArray(target);
         els.forEach(el => {
            this.elements.push(el);
            if (this.observer) this.observer.observe(el);
         });
         return this;
      }

      /**
       * Hapus observer
       */
      destroy() {
         if (this.observer) {
            this.elements.forEach(el => this.observer.unobserve(el));
            this.observer.disconnect();
            this.observer = null;
         }
         return this;
      }

      /**
       * Refresh (re-observe)
       */
      refresh() {
         this.destroy();
         this._buildObserver();
         this._observeAll();
         return this;
      }
   }

   // ============================================================
   // PUBLIC API
   // ============================================================
   const instances = [];

   function viewMotion(target, options = {}) {
      if (typeof target === "string" && !target.trim()) return null;
      const inst = new ViewMotionInstance(target, options);
      instances.push(inst);
      return inst;
   }

   // Alias
   viewMotion.animate = viewMotion;

   /**
    * Init otomatis dari element dengan atribut data-vm
    */
   viewMotion.init = function (root = document, overrideOptions = {}) {
      const attr = overrideOptions.attribute || DEFAULTS.attribute;
      const nodes = root.querySelectorAll(`[${attr}]`);
      const created = [];

      nodes.forEach(el => {
         const animation = el.getAttribute(attr) || "fade-up";
         const opts = {
            animation,
            duration: parseNumber(
               el.getAttribute(`${attr}-duration`),
               DEFAULTS.duration
            ),
            delay: parseNumber(
               el.getAttribute(`${attr}-delay`),
               DEFAULTS.delay
            ),
            easing: el.getAttribute(`${attr}-easing`) || DEFAULTS.easing,
            threshold: parseNumber(
               el.getAttribute(`${attr}-threshold`),
               DEFAULTS.threshold
            ),
            rootMargin:
               el.getAttribute(`${attr}-root-margin`) || DEFAULTS.rootMargin,
            once: el.hasAttribute(`${attr}-once`)
               ? parseBool(el.getAttribute(`${attr}-once`))
               : DEFAULTS.once,
            reverse: el.hasAttribute(`${attr}-reverse`)
               ? parseBool(el.getAttribute(`${attr}-reverse`))
               : DEFAULTS.reverse,
            stagger: parseNumber(
               el.getAttribute(`${attr}-stagger`),
               DEFAULTS.stagger
            )
         };
         el.__vmOptions = opts;

         const inst = new ViewMotionInstance(el, opts);
         // simpan biar trigger bisa dipanggil
         el.__vmInstance = inst;
         created.push(inst);
      });

      return created;
   };

   /**
    * Trigger manual elemen tertentu
    */
   viewMotion.trigger = function (target) {
      toArray(target).forEach(el => {
         if (el.__vmInstance)
            el.__vmInstance._play(el, 0, true, el.__vmOptions);
      });
   };

   /**
    * Reset manual
    */
   viewMotion.reset = function (target) {
      toArray(target).forEach(el => {
         if (el.__vmInstance) el.__vmInstance._reset(el);
      });
   };

   /**
    * Tambah preset kustom
    */
   viewMotion.register = function (name, keyframesFn) {
      PRESETS[name] = keyframesFn;
      return viewMotion;
   };

   /**
    * List preset yang tersedia
    */
   viewMotion.presets = function () {
      return Object.keys(PRESETS);
   };

   /**
    * Destroy semua instance
    */
   viewMotion.destroyAll = function () {
      instances.forEach(i => i.destroy());
      instances.length = 0;
   };

   // expose
   global.viewMotion = viewMotion;

   // auto-init DOMContentLoaded kalau ada [data-vm]
   if (typeof document !== "undefined") {
      const autoInit = () => {
         if (document.querySelector("[data-vm]")) {
            viewMotion.init();
         }
      };
      if (document.readyState === "loading") {
         document.addEventListener("DOMContentLoaded", autoInit, {
            once: true
         });
      } else {
         autoInit();
      }
   }

   return viewMotion;
})(typeof window !== "undefined" ? window : this);
