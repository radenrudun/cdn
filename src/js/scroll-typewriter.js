/**
 * Typewriter.js
 * V2 - Scroll Typewriter
 *
 * V1:
 * typewriter(element, texts, options)
 *
 * V2:
 * scrollTypewriter(element, texts, options)
 */

/* =========================================================
 * Utilities
 * ========================================================= */

function typewriterParseTime(value) {
    if (typeof value === "number") {
        return value * 1000;
    }

    const match = String(value).match(/^([\d.]+)\s*(ms|s)$/);

    if (!match) {
        console.warn(`Typewriter: invalid time "${value}".`);
        return 0;
    }

    const number = parseFloat(match[1]);

    return match[2] === "s" ? number * 1000 : number;
}

function typewriterSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function typewriterGetElement(element) {
    if (typeof element === "string") {
        return document.getElementById(element);
    }

    if (typeof Element !== "undefined" && element instanceof Element) {
        return element;
    }

    return null;
}

function reserveTextSpace(target, textList, enabled) {
    if (!enabled || !target || !textList.length) {
        return;
    }

    const parent = target.parentElement;

    if (!parent) {
        return;
    }

    /*
     * Cari teks terpanjang
     */
    const longestText = textList.reduce(
        (longest, text) => (text.length > longest.length ? text : longest),
        ""
    );

    /*
     * Buat sizer
     */
    const sizer = document.createElement(target.tagName);

    sizer.textContent = longestText;

    /*
     * Copy class asli
     */
    sizer.className = target.className;

    /*
     * Copy semua computed style yang
     * mempengaruhi ukuran teks.
     */
    const style = getComputedStyle(target);

    sizer.style.fontFamily = style.fontFamily;

    sizer.style.fontSize = style.fontSize;

    sizer.style.fontWeight = style.fontWeight;

    sizer.style.fontStyle = style.fontStyle;

    sizer.style.lineHeight = style.lineHeight;

    sizer.style.letterSpacing = style.letterSpacing;

    sizer.style.wordSpacing = style.wordSpacing;

    sizer.style.textTransform = style.textTransform;

    sizer.style.textIndent = style.textIndent;

    sizer.style.whiteSpace = style.whiteSpace;

    sizer.style.wordBreak = style.wordBreak;

    sizer.style.overflowWrap = style.overflowWrap;

    sizer.style.padding = style.padding;

    sizer.style.border = style.border;

    sizer.style.boxSizing = style.boxSizing;

    /*
     * Samakan width dengan target
     */
    sizer.style.width = `${target.getBoundingClientRect().width}px`;

    /*
     * Jangan terlihat
     */
    sizer.style.position = "absolute";
    sizer.style.visibility = "hidden";
    sizer.style.pointerEvents = "none";

    /*
     * Jangan mempengaruhi layout parent
     */
    sizer.style.height = "auto";
    sizer.style.minHeight = "0";
    sizer.style.maxHeight = "none";

    /*
     * Tambahkan ke parent yang sama
     */
    parent.appendChild(sizer);

    /*
     * Paksa browser menghitung layout
     */
    const height = Math.ceil(sizer.getBoundingClientRect().height);

    sizer.remove();

    /*
     * Reserve tinggi
     */
    target.style.minHeight = `${height}px`;
}

/* =========================================================
 * V1 - Normal Typewriter
 * ========================================================= */

function typewriter(element, texts, options = {}) {
    const {
        speed = "0.08s",
        delay = "0s",

        cursor = true,
        cursorChar = "|",

        loop = false,

        deleteSpeed = "0.05s",
        pause = "1s",
        between = "0s",
        reserveSpace = true
    } = options;

    const target = typewriterGetElement(element);

    if (!target) {
        console.error(`Typewriter: element "${element}" not found.`);

        return;
    }

    const textList = Array.isArray(texts) ? texts : [texts];

    if (cursor) {
        target.classList.add("typewriter-cursor");

        target.style.setProperty("--typewriter-cursor", `"${cursorChar}"`);
    }

    reserveTextSpace(target, textList, reserveSpace);

    const typingDelay = typewriterParseTime(speed);

    const startDelay = typewriterParseTime(delay);

    const removeDelay = typewriterParseTime(deleteSpeed);

    const pauseDelay = typewriterParseTime(pause);

    const betweenDelay = typewriterParseTime(between);

    /* Cursor */

    target.textContent = "";

    /* Type */

    async function typeText(text) {
        for (const char of text) {
            target.textContent += char;

            await typewriterSleep(typingDelay);
        }
    }

    /* Delete */

    async function deleteText(text) {
        for (let i = text.length; i > 1; i--) {
            target.textContent = text.slice(0, i - 1);

            await typewriterSleep(removeDelay);
        }
    }

    /* Start */

    async function start() {
        await typewriterSleep(startDelay);

        do {
            for (let i = 0; i < textList.length; i++) {
                const text = String(textList[i]);

                await typeText(text);

                if (i < textList.length - 1) {
                    await typewriterSleep(pauseDelay);

                    await deleteText(text);

                    await typewriterSleep(betweenDelay);

                    target.textContent = "";
                }
            }

            if (!loop) {
                break;
            }

            await typewriterSleep(pauseDelay);

            const lastText = String(textList[textList.length - 1]);

            await deleteText(lastText);

            await typewriterSleep(betweenDelay);

            target.textContent = "";
        } while (loop);
    }

    start();
}

/* =========================================================
 * V2 - Scroll Typewriter
 * ========================================================= */

function scrollTypewriter(element, texts, options = {}) {
    const {
        /*
         * Trigger:
         *
         * "center"
         * "30vh"
         *
         * {
         *     top: "25vh",
         *     bottom: "75vh"
         * }
         */

        trigger = "center",

        /*
         * Tolerance untuk single-point trigger.
         *
         * Contoh:
         *
         * "center"
         * berarti 50vh ± 10vh
         *
         * "30vh"
         * berarti 30vh ± 10vh
         */

        triggerTolerance = "10vh",

        speed = "0.08s",
        delay = "0s",

        cursor = true,
        cursorChar = "|",

        loop = false,

        deleteSpeed = "0.05s",
        pause = "1s",
        between = "0s",

        deleteOnExit = true,

        reserveSpace = true
    } = options;

    const target = typewriterGetElement(element);

    if (!target) {
        console.error(`ScrollTypewriter: element "${element}" not found.`);

        return;
    }

    const textList = Array.isArray(texts) ? texts.map(String) : [String(texts)];

    if (cursor) {
        target.classList.add("typewriter-cursor");

        target.style.setProperty("--typewriter-cursor", `"${cursorChar}"`);
    }

    reserveTextSpace(target, textList, reserveSpace);

    /* =====================================================
     * State
     * ===================================================== */

    let active = false;

    let started = false;

    let destroyed = false;

    let animationId = 0;

    let abortController = null;

    /* =====================================================
     * Cursor
     * ===================================================== */

    /* =====================================================
     * Time
     * ===================================================== */

    const typingDelay = typewriterParseTime(speed);

    const startDelay = typewriterParseTime(delay);

    const removeDelay = typewriterParseTime(deleteSpeed);

    const pauseDelay = typewriterParseTime(pause);

    const betweenDelay = typewriterParseTime(between);

    /* =====================================================
     * Trigger Helpers
     * ===================================================== */

    function parseViewportValue(value, fallback) {
        if (value === undefined) {
            return fallback;
        }

        if (typeof value === "string" && value.endsWith("vh")) {
            return (parseFloat(value) / 100) * window.innerHeight;
        }

        if (typeof value === "string" && value.endsWith("px")) {
            return parseFloat(value);
        }

        if (typeof value === "number") {
            return value;
        }

        return fallback;
    }

    function getTriggerZone() {
        const viewportHeight = window.innerHeight;

        /*
         * Single trigger
         */

        if (typeof trigger === "string" || typeof trigger === "number") {
            let position = trigger;

            if (position === "center") {
                position = "50vh";
            }

            const point = parseViewportValue(position, viewportHeight / 2);

            const tolerance = parseViewportValue(
                triggerTolerance,
                viewportHeight * 0.1
            );

            return {
                top: point - tolerance,

                bottom: point + tolerance,

                single: true
            };
        }

        /*
         * Custom zone
         */

        if (typeof trigger === "object" && trigger !== null) {
            return {
                top: parseViewportValue(trigger.top, 0),

                bottom: parseViewportValue(trigger.bottom, viewportHeight),

                single: false
            };
        }

        return {
            top: 0,

            bottom: viewportHeight,

            single: false
        };
    }

    /* =====================================================
     * Position Check
     * ===================================================== */

    function isInTriggerZone() {
        const rect = target.getBoundingClientRect();

        const zone = getTriggerZone();

        /*
         * Element dianggap aktif jika
         * sebagian element berada di zona.
         */

        return rect.bottom > zone.top && rect.top < zone.bottom;
    }

    /* =====================================================
     * Animation Control
     * ===================================================== */

    function stopAnimation() {
        animationId++;

        if (abortController) {
            abortController.abort();
        }

        abortController = new AbortController();
    }

    function isCancelled(id, signal) {
        return destroyed || id !== animationId || signal.aborted;
    }

    /* =====================================================
     * Type
     * ===================================================== */

    async function typeText(text, id, signal) {
        for (const char of text) {
            if (isCancelled(id, signal)) {
                return false;
            }

            target.textContent += char;

            await typewriterSleep(typingDelay);
        }

        return true;
    }

    /* =====================================================
     * Delete
     * ===================================================== */

    async function deleteText(text, id, signal) {
        for (let i = text.length; i > 1; i--) {
            if (isCancelled(id, signal)) {
                return false;
            }

            target.textContent = text.slice(0, i - 1);

            await typewriterSleep(removeDelay);
        }

        if (!isCancelled(id, signal)) {
            target.textContent = "";
        }

        return true;
    }

    /* =====================================================
     * Run
     * ===================================================== */

    async function runTypewriter() {
        stopAnimation();

        const id = animationId;

        const signal = abortController.signal;

        target.textContent = "";

        await typewriterSleep(startDelay);

        if (isCancelled(id, signal)) {
            return;
        }

        do {
            for (let i = 0; i < textList.length; i++) {
                if (isCancelled(id, signal)) {
                    return;
                }

                const text = textList[i];

                const completed = await typeText(text, id, signal);

                if (!completed) {
                    return;
                }

                /*
                 * Text berikutnya
                 */

                if (i < textList.length - 1) {
                    await typewriterSleep(pauseDelay);

                    if (isCancelled(id, signal)) {
                        return;
                    }

                    const deleted = await deleteText(text, id, signal);

                    if (!deleted) {
                        return;
                    }

                    await typewriterSleep(betweenDelay);
                }
            }

            /*
             * Tidak loop
             */

            if (!loop) {
                started = true;

                return;
            }

            /*
             * Loop
             */

            await typewriterSleep(pauseDelay);

            if (isCancelled(id, signal)) {
                return;
            }

            const lastText = textList[textList.length - 1];

            const deleted = await deleteText(lastText, id, signal);

            if (!deleted) {
                return;
            }

            await typewriterSleep(betweenDelay);
        } while (loop);
    }

    /* =====================================================
     * Enter
     * ===================================================== */

    function enter() {
        if (destroyed) {
            return;
        }

        /*
         * Kalau sudah pernah selesai
         * dan deleteOnExit false,
         * jangan jalankan lagi.
         */

        if (!deleteOnExit && started) {
            return;
        }

        if (active) {
            return;
        }

        active = true;

        runTypewriter();
    }

    /* =====================================================
     * Exit
     * ===================================================== */

    function exit() {
        active = false;

        if (!deleteOnExit) {
            return;
        }

        stopAnimation();

        target.textContent = "";
    }

    /* =====================================================
     * Scroll
     * ===================================================== */

    function checkPosition() {
        if (destroyed) {
            return;
        }

        const inside = isInTriggerZone();

        if (inside && !active) {
            enter();
        }

        if (!inside && active) {
            exit();
        }
    }

    /* =====================================================
     * Events
     * ===================================================== */

    window.addEventListener("scroll", checkPosition, {
        passive: true
    });

    window.addEventListener("resize", checkPosition);

    /*
     * Initial check
     */

    checkPosition();

    /* =====================================================
     * Controller
     * ===================================================== */

    return {
        destroy() {
            destroyed = true;

            stopAnimation();

            window.removeEventListener("scroll", checkPosition);

            window.removeEventListener("resize", checkPosition);
        },

        reset() {
            stopAnimation();

            active = false;

            started = false;

            target.textContent = "";

            checkPosition();
        },

        start() {
            enter();
        },

        stop() {
            exit();
        }
    };
}
