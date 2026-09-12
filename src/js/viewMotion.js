/**
 * viewMotion.js
 * Lightweight on-scroll animation library
 * Author: Raden
 * Version: 3.5.0
 *
 * Usage:
 *   // Trigger mode (default) — animasi saat masuk viewport
 *   <div data-vm="fade-up"></div>
 *
 *   // Scrub mode — animasi mengikuti scroll progress
 *   <div data-vm="zoom"
 *        data-vm-mode="scrub"
 *        data-vm-start="top bottom"
 *        data-vm-end="bottom top"></div>
 *
 *   // Pin + scrub
 *   <div data-vm="fade-up"
 *        data-vm-mode="scrub"
 *        data-vm-pin="true"
 *        data-vm-start="top top"
 *        data-vm-end="bottom top"></div>
 *
 *   // Manual
 *   viewMotion("#hero", { animation: "zoom", mode: "scrub" });
 *   viewMotion(".card", { animation: "fade-up", stagger: 100 });
 */

(function (global) {
   "use strict";

   // ============================================================
   // PRESETS ANIMASI
   // ============================================================
   const PRESETS = {
      fade: () => [{ opacity: 0 }, { opacity: 1 }],
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
      // Basic
      animation: "fade-up",
      duration: 600,
      delay: 0,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",

      // Trigger mode
      threshold: 0.15,
      rootMargin: "0px",
      once: true,
      stagger: 0,
      reverse: false,

      // Scroll mode
      mode: "trigger", // "trigger" | "scrub"
      start: "top bottom", // [el-edge] [viewport-pos]
      end: "bottom top", // [el-edge] [viewport-pos]
      smooth: 0, // 0–1 lerp smoothing (khusus scrub)
      pin: false, // pin element di range start-end
      pinSpacing: true,
      direction: "both", // "down" | "up" | "both"
      repeat: false, // false | true | number
      speed: 1, // playback rate

      // Attributes
      attribute: "data-vm",

      // Callbacks
      onStart: null, // (el, anim)
      onFinish: null, // (el, anim)
      onEnter: null, // (el, anim)
      onExit: null, // (el)
      onProgress: null // (el, progress, direction) — scrub only
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

   /**
    * Parse "top bottom" -> { el: "top", vp: "bottom" }
    * Support: top | center | bottom | 80% | 100vh | 200px
    */
   function parsePos(str) {
      const s = String(str || "").trim() || "top bottom";
      const parts = s.split(/\s+/);
      return {
         el: parts[0] || "top",
         vp: parts[1] || "bottom"
      };
   }

   /**
    * Convert viewport value ke pixel
    */
   function vpToPx(vp, vpHeight) {
      if (typeof vp === "number") return vp;
      const s = String(vp);
      if (s.endsWith("%")) return (parseFloat(s) / 100) * vpHeight;
      if (s.endsWith("vh")) return (parseFloat(s) / 100) * vpHeight;
      if (s.endsWith("px")) return parseFloat(s);
      if (s === "top") return 0;
      if (s === "center") return vpHeight / 2;
      if (s === "bottom") return vpHeight;
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
   }

   /**
    * Convert element-edge ke posisi dokumen Y
    */
   function elToDocY(pos, elTop, elBottom) {
      if (pos === "top") return elTop;
      if (pos === "bottom") return elBottom;
      if (pos === "center") return (elTop + elBottom) / 2;
      return elTop;
   }

   /**
    * Hitung scrollY ketika elemen [elEdge] menyentuh viewport [vpPos]
    */
   function calcScrollY(elTop, elBottom, elPos, vpPos, vpHeight) {
      const eY = elToDocY(elPos, elTop, elBottom);
      const vY = vpToPx(vpPos, vpHeight);
      return eY - vY;
   }

   // ============================================================
   // CLASS VIEWMOTION INSTANCE
   // ============================================================
   class ViewMotionInstance {
      constructor(target, options = {}) {
         this.elements = toArray(target);
         this.options = Object.assign({}, DEFAULTS, options);
         this.observer = null;
         this.started = new WeakSet();
         this.triggered = new WeakSet();
         this.scrubMap = new WeakMap();
         this._rafId = null;
         this._lastProgress = new WeakMap();
         this._lastScrollY = window.scrollY || window.pageYOffset || 0;
         this._resizeBound = null;

         if (this.options.mode === "scrub") {
            this._initScrub();
         } else {
            this.elements.forEach(el => {
               const opt = el.__vmOptions || this.options;
               this._applyInitialStyle(el, opt);
            });

            this._buildObserver();
            this._observeAll();
         }
      }

      _getOverflowParent(el) {
         let parent = el.parentElement;

         while (
            parent &&
            parent !== document.body &&
            parent !== document.documentElement
         ) {
            const style = getComputedStyle(parent);

            // Hindari parent yang sudah punya overflow sendiri
            if (
               style.overflowX === "visible" &&
               style.overflowY === "visible"
            ) {
               return parent;
            }

            parent = parent.parentElement;
         }

         return null;
      }

      _needsOverflowGuard(opt) {
         const animation = String(opt.animation || "").toLowerCase();

         return [
            "fade-left",
            "fade-right",
            "zoom",
            "zoom-in",
            "zoom-out",
            "rotate",
            "bounce",
            "pop",
            "drop",
            "flip",
            "flip-y",
            "glitch"
         ].includes(animation);
      }

      _applyOverflowGuard(el, opt) {
         if (!this._needsOverflowGuard(opt)) return;

         const parent = this._getOverflowParent(el);
         if (!parent) return;

         if (!parent.__vmOverflowState) {
            parent.__vmOverflowState = {
               overflowX: parent.style.overflowX,
               overflowY: parent.style.overflowY
            };
         }

         parent.style.overflowX = "clip";
         el.__vmOverflowParent = parent;
      }

      _removeOverflowGuard(el) {
         const parent = el.__vmOverflowParent;
         if (!parent || !parent.__vmOverflowState) return;

         parent.style.overflowX = parent.__vmOverflowState.overflowX;
         parent.style.overflowY = parent.__vmOverflowState.overflowY;

         delete parent.__vmOverflowState;
         delete el.__vmOverflowParent;
      }

      // ============ TRIGGER MODE ============
      _buildObserver() {
         const opt = this.options;

         if (typeof IntersectionObserver === "undefined") {
            this.elements.forEach(el => {
               const opt = el.__vmOptions || this.options;

               el.style.opacity = "";
               el.style.transform = "";
               el.style.filter = "";
               el.style.visibility = "";
               el.style.willChange = "auto";

               this._play(el, 0, true, opt);
            });

            return;
         }

         this.observer = new IntersectionObserver(
            entries => {
               entries.forEach(entry => {
                  const el = entry.target;
                  const elOpt = el.__vmOptions || opt;

                  if (entry.isIntersecting) {
                     if (elOpt.once && this.triggered.has(el)) return;

                     const idx = this.elements.indexOf(el);
                     const stagger = elOpt.stagger || 0;
                     const delayExtra =
                        stagger > 0 && idx > -1 ? idx * stagger : 0;

                     this._play(
                        el,
                        (elOpt.delay || 0) + delayExtra,
                        false,
                        elOpt
                     );

                     this.triggered.add(el);

                     if (elOpt.once && this.observer) {
                        this.observer.unobserve(el);
                     }
                  } else {
                     if (!elOpt.once) {
                        this._reset(el);
                     }

                     if (typeof elOpt.onExit === "function") {
                        elOpt.onExit(el);
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

      // ============ SCRUB MODE ============
      _initScrub() {
         this.elements.forEach(el => {
            const elOpt = el.__vmOptions || this.options;
            const preset = PRESETS[elOpt.animation] || PRESETS["fade-up"];
            const keyframes = preset(elOpt);

            el.style.willChange = "transform, opacity, filter";

            const anim = el.animate(keyframes, {
               duration: elOpt.duration,
               easing: elOpt.easing,
               fill: "both"
            });
            anim.pause();
            anim.currentTime = 0;

            if (elOpt.speed && elOpt.speed !== 1) {
               anim.playbackRate = elOpt.speed;
            }

            this.scrubMap.set(el, { anim, opt: elOpt });

            if (elOpt.pin) this._setupPin(el, elOpt);
         });

         this._onScrollBound = () => this._scheduleScrub();
         this._resizeBound = () => {
            this._scheduleScrub();
         };

         window.addEventListener("scroll", this._onScrollBound, {
            passive: true
         });
         window.addEventListener("resize", this._resizeBound, {
            passive: true
         });

         this._scheduleScrub();
      }

      _scheduleScrub() {
         if (this._rafId) return;
         this._rafId = requestAnimationFrame(() => {
            this._rafId = null;
            this._applyScrub();
         });
      }

      _applyInitialStyle(el, opt) {
         const preset = PRESETS[opt.animation] || PRESETS["fade-up"];
         const keyframes = preset(opt);
         const firstFrame = keyframes[0] || {};

         if (firstFrame.opacity !== undefined) {
            el.style.opacity = firstFrame.opacity;
         }

         if (firstFrame.transform !== undefined) {
            el.style.transform = firstFrame.transform;
         }

         if (firstFrame.filter !== undefined) {
            el.style.filter = firstFrame.filter;
         }

         el.style.visibility = "hidden";
         el.style.willChange = "opacity, transform, filter";
      }

      _applyScrub() {
         const vpHeight = window.innerHeight;
         const scrollY = window.scrollY || window.pageYOffset || 0;
         const goingDown = scrollY >= this._lastScrollY;
         this._lastScrollY = scrollY;

         let needsMore = false;

         this.elements.forEach(el => {
            const entry = this.scrubMap.get(el);
            if (!entry) return;
            const { anim, opt } = entry;

            const rect = el.getBoundingClientRect();
            const elTop = rect.top + scrollY;
            const elBottom = rect.bottom + scrollY;

            const startPos = parsePos(opt.start);
            const endPos = parsePos(opt.end);

            const startY = calcScrollY(
               elTop,
               elBottom,
               startPos.el,
               startPos.vp,
               vpHeight
            );
            const endY = calcScrollY(
               elTop,
               elBottom,
               endPos.el,
               endPos.vp,
               vpHeight
            );

            const range = endY - startY;
            let target = range === 0 ? 0 : (scrollY - startY) / range;
            target = Math.max(0, Math.min(1, target));

            // Direction filter
            if (opt.direction === "down" && !goingDown) {
               target = anim.currentTime / opt.duration;
            } else if (opt.direction === "up" && goingDown) {
               target = anim.currentTime / opt.duration;
            }

            // Smoothing (lerp)
            let finalP = target;
            if (opt.smooth > 0) {
               const prev = anim.currentTime / opt.duration;
               const k = Math.min(1, Math.max(0, opt.smooth));
               finalP = prev + (target - prev) * (1 - Math.pow(1 - k, 3));
               if (Math.abs(finalP - target) > 0.001) needsMore = true;
            }

            anim.currentTime = finalP * opt.duration;

            if (typeof opt.onProgress === "function") {
               opt.onProgress(el, target, goingDown ? "down" : "up");
            }
         });

         if (needsMore) this._scheduleScrub();
      }

      _setupPin(el, opt) {
         if (el.__vmPinWrapper) return;

         const rect = el.getBoundingClientRect();
         const scrollY = window.scrollY || window.pageYOffset || 0;
         const elTop = rect.top + scrollY;
         const elBottom = rect.bottom + scrollY;
         const vpHeight = window.innerHeight;

         const startPos = parsePos(opt.start);
         const endPos = parsePos(opt.end);
         const startY = calcScrollY(
            elTop,
            elBottom,
            startPos.el,
            startPos.vp,
            vpHeight
         );
         const endY = calcScrollY(
            elTop,
            elBottom,
            endPos.el,
            endPos.vp,
            vpHeight
         );
         const range = Math.max(0, endY - startY);
         const h = el.offsetHeight;

         const wrapper = document.createElement("div");
         wrapper.className = "vm-pin-wrapper";
         wrapper.style.position = "relative";
         wrapper.style.height = opt.pinSpacing ? range + h + "px" : h + "px";

         el.parentNode.insertBefore(wrapper, el);
         wrapper.appendChild(el);

         el.style.position = "sticky";
         el.style.top = vpToPx(startPos.vp, vpHeight) + "px";
         el.__vmPinWrapper = wrapper;
      }

      // ============ CORE PLAY ============
      _play(el, delay, immediate = false, optsOverride = null) {
         const opt = optsOverride || el.__vmOptions || this.options;
         const preset = PRESETS[opt.animation] || PRESETS["fade-up"];
         const keyframes = preset(opt);

         const run = () => {
            const previousAnimation = el.__vmAnimation;

            if (previousAnimation) {
               try {
                  previousAnimation.cancel();
               } catch (error) {}
            }

            el.style.visibility = "visible";
            this._applyOverflowGuard(el, opt);

            let anim;

            try {
               anim = el.animate(keyframes, {
                  duration: Math.max(0, Number(opt.duration) || 0),
                  delay: 0,
                  easing: opt.easing,
                  fill: "both"
               });
            } catch (error) {
               console.warn("[ViewMotion] Animasi gagal:", error);

               el.style.opacity = "";
               el.style.transform = "";
               el.style.filter = "";
               el.style.visibility = "";
               el.style.willChange = "auto";

               return;
            }

            if (opt.speed && opt.speed !== 1) {
               anim.playbackRate = opt.speed;
            }

            el.__vmAnimation = anim;
            this.started.add(el);

            if (typeof opt.onStart === "function") {
               opt.onStart(el, anim);
            }

            if (typeof opt.onEnter === "function") {
               opt.onEnter(el, anim);
            }

            anim.onfinish = () => {
               if (typeof opt.onFinish === "function") {
                  opt.onFinish(el, anim);
               }

               if (opt.repeat === true) {
                  anim.play();
               } else if (typeof opt.repeat === "number" && opt.repeat > 0) {
                  opt.repeat -= 1;
                  anim.play();
               } else {
                  this._removeOverflowGuard(el);

                  el.style.opacity = "";
                  el.style.transform = "";
                  el.style.filter = "";
                  el.style.visibility = "";
                  el.style.willChange = "auto";
               }
            };
         };

         if (immediate || delay <= 0) {
            run();
         } else {
            setTimeout(run, delay);
         }
      }

      _reset(el) {
         if (el.__vmAnimation) {
            try {
               el.__vmAnimation.cancel();
            } catch (error) {}
         }

         this._removeOverflowGuard(el);

         const opt = el.__vmOptions || this.options;

         this._applyInitialStyle(el, opt);
         this.started.delete(el);
      }

      // ============ PUBLIC METHODS ============
      play() {
         this.elements.forEach((el, i) => {
            const opt = el.__vmOptions || this.options;
            const stagger = opt.stagger || 0;
            this._play(el, (opt.delay || 0) + i * stagger, false, opt);
         });
         return this;
      }

      reset() {
         this.elements.forEach(el => this._reset(el));
         return this;
      }

      add(target) {
         const els = toArray(target);
         els.forEach(el => {
            this.elements.push(el);
            if (this.observer) this.observer.observe(el);
            if (this.options.mode === "scrub") {
               const elOpt = el.__vmOptions || this.options;
               const preset = PRESETS[elOpt.animation] || PRESETS["fade-up"];
               const kf = preset(elOpt);
               const anim = el.animate(kf, {
                  duration: elOpt.duration,
                  easing: elOpt.easing,
                  fill: "both"
               });
               anim.pause();
               anim.currentTime = 0;
               this.scrubMap.set(el, { anim, opt: elOpt });
               if (elOpt.pin) this._setupPin(el, elOpt);
            }
         });
         if (this._scheduleScrub) this._scheduleScrub();
         return this;
      }

      destroy() {
         if (this.observer) {
            this.elements.forEach(el => this.observer.unobserve(el));
            this.observer.disconnect();
            this.observer = null;
         }
         if (this._onScrollBound) {
            window.removeEventListener("scroll", this._onScrollBound);
            this._onScrollBound = null;
         }
         if (this._resizeBound) {
            window.removeEventListener("resize", this._resizeBound);
            this._resizeBound = null;
         }
         if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
         }
         return this;
      }

      refresh() {
         this.destroy();
         if (this.options.mode === "scrub") {
            this._initScrub();
         } else {
            this.elements.forEach(el => {
               const opt = el.__vmOptions || this.options;
               this._applyInitialStyle(el, opt);
            });

            this._buildObserver();
            this._observeAll();
         }
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

   viewMotion.animate = viewMotion;

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
            ),

            // Scroll mode
            mode: el.getAttribute(`${attr}-mode`) || DEFAULTS.mode,
            start: el.getAttribute(`${attr}-start`) || DEFAULTS.start,
            end: el.getAttribute(`${attr}-end`) || DEFAULTS.end,
            smooth: parseNumber(
               el.getAttribute(`${attr}-smooth`),
               DEFAULTS.smooth
            ),
            pin: el.hasAttribute(`${attr}-pin`)
               ? parseBool(el.getAttribute(`${attr}-pin`))
               : DEFAULTS.pin,
            pinSpacing: el.hasAttribute(`${attr}-pin-spacing`)
               ? parseBool(el.getAttribute(`${attr}-pin-spacing`))
               : DEFAULTS.pinSpacing,
            direction:
               el.getAttribute(`${attr}-direction`) || DEFAULTS.direction,
            repeat: (() => {
               if (!el.hasAttribute(`${attr}-repeat`)) return DEFAULTS.repeat;
               const v = el.getAttribute(`${attr}-repeat`);
               if (v === "" || v === "true") return true;
               if (v === "false") return false;
               const n = parseInt(v, 10);
               return isNaN(n) ? false : n;
            })(),
            speed: parseNumber(el.getAttribute(`${attr}-speed`), DEFAULTS.speed)
         };
         el.__vmOptions = opts;

         const inst = new ViewMotionInstance(el, opts);
         el.__vmInstance = inst;
         created.push(inst);
      });

      return created;
   };

   viewMotion.trigger = function (target) {
      toArray(target).forEach(el => {
         if (el.__vmInstance)
            el.__vmInstance._play(el, 0, true, el.__vmOptions);
      });
   };

   viewMotion.reset = function (target) {
      toArray(target).forEach(el => {
         if (el.__vmInstance) el.__vmInstance._reset(el);
      });
   };

   viewMotion.register = function (name, fn) {
      PRESETS[name] = fn;
      return viewMotion;
   };

   viewMotion.presets = function () {
      return Object.keys(PRESETS);
   };

   viewMotion.destroyAll = function () {
      instances.forEach(i => i.destroy());
      instances.length = 0;
   };

   global.viewMotion = viewMotion;

   // Auto init
   if (typeof document !== "undefined") {
      const autoInit = () => {
         if (document.querySelector("[data-vm]")) viewMotion.init();
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
