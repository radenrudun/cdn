(function (window, document) {
   "use strict";

   const VERSION = "1.0.0";

   const DEFAULTS = {
      animation: "fade-up",
      duration: 700,
      delay: 0,
      easing: "ease-out",
      threshold: 0.2,
      distance: "40px",
      once: true,
      root: null,
      rootMargin: "0px",
      fill: "both"
   };

   const ANIMATIONS = {
      fade: {
         from: {
            opacity: 0
         },
         to: {
            opacity: 1
         }
      },

      "fade-up": {
         from: {
            opacity: 0,
            transform: "translateY(var(--vm-distance))"
         },
         to: {
            opacity: 1,
            transform: "translateY(0)"
         }
      },

      "fade-down": {
         from: {
            opacity: 0,
            transform: "translateY(calc(var(--vm-distance) * -1))"
         },
         to: {
            opacity: 1,
            transform: "translateY(0)"
         }
      },

      "fade-left": {
         from: {
            opacity: 0,
            transform: "translateX(var(--vm-distance))"
         },
         to: {
            opacity: 1,
            transform: "translateX(0)"
         }
      },

      "fade-right": {
         from: {
            opacity: 0,
            transform: "translateX(calc(var(--vm-distance) * -1))"
         },
         to: {
            opacity: 1,
            transform: "translateX(0)"
         }
      },

      "slide-up": {
         from: {
            transform: "translateY(var(--vm-distance))"
         },
         to: {
            transform: "translateY(0)"
         }
      },

      "slide-down": {
         from: {
            transform: "translateY(calc(var(--vm-distance) * -1))"
         },
         to: {
            transform: "translateY(0)"
         }
      },

      "slide-left": {
         from: {
            transform: "translateX(var(--vm-distance))"
         },
         to: {
            transform: "translateX(0)"
         }
      },

      "slide-right": {
         from: {
            transform: "translateX(calc(var(--vm-distance) * -1))"
         },
         to: {
            transform: "translateX(0)"
         }
      },

      zoom: {
         from: {
            opacity: 0,
            transform: "scale(0.8)"
         },
         to: {
            opacity: 1,
            transform: "scale(1)"
         }
      },

      "zoom-in": {
         from: {
            opacity: 0,
            transform: "scale(0.5)"
         },
         to: {
            opacity: 1,
            transform: "scale(1)"
         }
      },

      "zoom-out": {
         from: {
            opacity: 0,
            transform: "scale(1.2)"
         },
         to: {
            opacity: 1,
            transform: "scale(1)"
         }
      },

      rotate: {
         from: {
            opacity: 0,
            transform: "rotate(-12deg) scale(0.95)"
         },
         to: {
            opacity: 1,
            transform: "rotate(0deg) scale(1)"
         }
      },

      blur: {
         from: {
            opacity: 0,
            filter: "blur(12px)"
         },
         to: {
            opacity: 1,
            filter: "blur(0)"
         }
      },

      flip: {
         from: {
            opacity: 0,
            transform: "perspective(800px) rotateX(-90deg)"
         },
         to: {
            opacity: 1,
            transform: "perspective(800px) rotateX(0)"
         }
      },

      pop: {
         from: {
            opacity: 0,
            transform: "scale(0.7)"
         },
         "50%": {
            opacity: 1,
            transform: "scale(1.08)"
         },
         to: {
            opacity: 1,
            transform: "scale(1)"
         }
      }
   };

   const state = {
      observer: null,
      initialized: false,
      globalOptions: {
         ...DEFAULTS
      },
      elements: new Map(),
      animations: new Map()
   };

   function isElement(value) {
      return value instanceof Element;
   }

   function resolveElements(target) {
      if (!target) {
         return [];
      }

      if (isElement(target)) {
         return [target];
      }

      if (target instanceof NodeList || target instanceof HTMLCollection) {
         return Array.from(target);
      }

      if (Array.isArray(target)) {
         return target.filter(isElement);
      }

      if (typeof target === "string") {
         try {
            return Array.from(document.querySelectorAll(target));
         } catch (error) {
            console.warn("[ViewMotion] Selector tidak valid:", target);
            return [];
         }
      }

      return [];
   }

   function parseValue(value, fallback) {
      if (value === undefined || value === null || value === "") {
         return fallback;
      }

      const number = Number(value);

      return Number.isFinite(number) ? number : value;
   }

   function getDataOptions(element) {
      const dataset = element.dataset;

      return {
         animation: dataset.vm || undefined,
         duration: parseValue(dataset.vmDuration, undefined),
         delay: parseValue(dataset.vmDelay, undefined),
         easing: dataset.vmEasing || undefined,
         threshold: parseValue(dataset.vmThreshold, undefined),
         distance: dataset.vmDistance || undefined,
         once:
            dataset.vmOnce === undefined
               ? undefined
               : dataset.vmOnce !== "false",
         rootMargin: dataset.vmRootMargin || undefined
      };
   }

   function normalizeOptions(options = {}) {
      return {
         ...state.globalOptions,
         ...options
      };
   }

   function getElementOptions(element, options = {}) {
      return {
         ...normalizeOptions(options),
         ...getDataOptions(element)
      };
   }

   function setDistance(element, distance) {
      element.style.setProperty(
         "--vm-distance",
         typeof distance === "number" ? `${distance}px` : distance
      );
   }

   function getKeyframes(animationName) {
      const animation = ANIMATIONS[animationName];

      if (!animation) {
         console.warn(
            `[ViewMotion] Animasi "${animationName}" tidak ditemukan. Menggunakan fade-up.`
         );

         return ANIMATIONS["fade-up"];
      }

      return animation;
   }

   function prepareElement(element, options) {
      setDistance(element, options.distance);

      element.dataset.vmReady = "true";
      element.dataset.vmAnimation = options.animation;

      if (options.once && element.dataset.vmAnimated === "true") {
         return;
      }

      element.style.willChange = "opacity, transform, filter";
   }

   function animateElement(element, options) {
      if (!isElement(element)) {
         return;
      }

      if (
         window.matchMedia &&
         window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
         element.style.opacity = "1";
         element.style.transform = "none";
         element.style.filter = "none";
         element.dataset.vmAnimated = "true";
         return;
      }

      const previousAnimation = state.animations.get(element);

      if (previousAnimation) {
         previousAnimation.cancel();
      }

      prepareElement(element, options);

      const keyframes = getKeyframes(options.animation);

      const animation = element.animate(keyframes, {
         duration: Math.max(0, Number(options.duration) || 0),
         delay: Math.max(0, Number(options.delay) || 0),
         easing: options.easing,
         fill: options.fill
      });

      state.animations.set(element, animation);

      animation.finished
         .then(() => {
            element.dataset.vmAnimated = "true";
            element.style.willChange = "auto";

            if (options.once) {
               state.elements.delete(element);
            }
         })
         .catch(() => {
            // Animasi dibatalkan atau dihentikan.
         });
   }

   function resetElement(element, options) {
      const animation = state.animations.get(element);

      if (animation) {
         animation.cancel();
         state.animations.delete(element);
      }

      const keyframes = getKeyframes(options.animation);
      const from = keyframes.from || keyframes[0] || {};

      Object.keys(from).forEach(property => {
         if (property === "transform") {
            element.style.transform = "";
         } else if (property === "opacity") {
            element.style.opacity = "";
         } else if (property === "filter") {
            element.style.filter = "";
         }
      });

      element.dataset.vmAnimated = "false";
   }

   function handleIntersection(entries) {
      entries.forEach(entry => {
         const element = entry.target;
         const options = state.elements.get(element);

         if (!options) {
            return;
         }

         if (entry.isIntersecting) {
            animateElement(element, options);

            if (options.once) {
               state.observer.unobserve(element);
            }
         } else if (!options.once) {
            resetElement(element, options);
         }
      });
   }

   function createObserver(options = {}) {
      if (state.observer) {
         state.observer.disconnect();
      }

      state.observer = new IntersectionObserver(handleIntersection, {
         root: options.root || null,
         rootMargin: options.rootMargin || "0px",
         threshold: options.threshold
      });

      return state.observer;
   }

   function observeElement(element, options) {
      if (!isElement(element)) {
         return;
      }

      const finalOptions = getElementOptions(element, options);

      prepareElement(element, finalOptions);

      state.elements.set(element, finalOptions);

      if (!state.observer) {
         createObserver(finalOptions);
      }

      state.observer.observe(element);
   }

   function reveal(target, options = {}) {
      const elements = resolveElements(target);

      elements.forEach(element => {
         observeElement(element, options);
      });

      return elements;
   }

   function stagger(target, options = {}) {
      const elements = resolveElements(target);
      const baseDelay = Number(options.delay ?? state.globalOptions.delay) || 0;
      const staggerDelay = Number(options.stagger ?? 100) || 0;

      elements.forEach((element, index) => {
         observeElement(element, {
            ...options,
            delay: baseDelay + index * staggerDelay
         });
      });

      return elements;
   }

   function init(options = {}) {
      state.globalOptions = {
         ...DEFAULTS,
         ...options
      };

      createObserver(state.globalOptions);

      const elements = document.querySelectorAll("[data-vm]");

      elements.forEach(element => {
         observeElement(element);
      });

      state.initialized = true;

      return ViewMotion;
   }

   function refresh() {
      if (!state.initialized) {
         return init(state.globalOptions);
      }

      document.querySelectorAll("[data-vm]").forEach(element => {
         if (!state.elements.has(element)) {
            observeElement(element);
         }
      });

      return ViewMotion;
   }

   function destroy() {
      if (state.observer) {
         state.observer.disconnect();
         state.observer = null;
      }

      state.animations.forEach(animation => {
         animation.cancel();
      });

      state.animations.clear();
      state.elements.clear();
      state.initialized = false;

      return ViewMotion;
   }

   const ViewMotion = {
      version: VERSION,
      animations: Object.keys(ANIMATIONS),
      init,
      reveal,
      stagger,
      refresh,
      destroy
   };

   window.ViewMotion = ViewMotion;
})(window, document);
