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

function typewriterAnimateChar(char, animation) {
    const span = document.createElement("span");

    span.textContent = char;

    /*
     * Supaya transform scale hanya
     * mempengaruhi karakter ini.
     */
    span.style.display = "inline-block";

    if (animation === "fade") {
        span.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 200,
            easing: "ease-out",
            fill: "both"
        });
    }

    if (animation === "slideUp") {
        span.animate(
            [
                { opacity: 0, transform: "translateY(20px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            {
                duration: 250,
                easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
                fill: "both"
            }
        );
    }

    if (animation === "slideDown") {
        span.animate(
            [
                { opacity: 0, transform: "translateY(-20px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            {
                duration: 250,
                easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
                fill: "both"
            }
        );
    }

    if (animation === "slideLeft") {
        span.animate(
            [
                { opacity: 0, transform: "translateX(20px)" },
                { opacity: 1, transform: "translateX(0)" }
            ],
            {
                duration: 250,
                easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
                fill: "both"
            }
        );
    }

    if (animation === "slideRight") {
        span.animate(
            [
                { opacity: 0, transform: "translateX(-20px)" },
                { opacity: 1, transform: "translateX(0)" }
            ],
            {
                duration: 250,
                easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
                fill: "both"
            }
        );
    }

    if (animation === "zoom") {
        span.animate(
            [
                { opacity: 0.5, transform: "scale(0.5)" },
                { opacity: 1, transform: "scale(1.1)", offset: 0.7 },
                { opacity: 1, transform: "scale(1)" }
            ],
            {
                duration: 220,
                easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                fill: "both"
            }
        );
    }

    if (animation === "rotate") {
        span.animate(
            [
                { opacity: 0, transform: "rotate(-15deg) scale(0.8)" },
                { opacity: 1, transform: "rotate(0) scale(1)" }
            ],
            {
                duration: 300,
                easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // spring-like
                fill: "both"
            }
        );
    }

    if (animation === "bounce") {
        span.animate(
            [
                { opacity: 0, transform: "scale(0.3)" },
                { opacity: 1, transform: "scale(1.2)", offset: 0.6 },
                { opacity: 1, transform: "scale(0.9)", offset: 0.8 },
                { opacity: 1, transform: "scale(1)" }
            ],
            {
                duration: 400,
                easing: "cubic-bezier(0.28, 1.3, 0.5, 1)",
                fill: "both"
            }
        );
    }

    if (animation === "blur") {
        span.animate(
            [
                { opacity: 0, filter: "blur(6px)" },
                { opacity: 1, filter: "blur(0)" }
            ],
            {
                duration: 250,
                easing: "ease-out",
                fill: "both"
            }
        );
    }

    if (animation === "typewriter") {
        span.animate(
            [
                { opacity: 0, transform: "scaleY(0.2) translateY(8px)" },
                { opacity: 1, transform: "scaleY(1) translateY(0)" }
            ],
            {
                duration: 180,
                easing: "cubic-bezier(0.2, 0.9, 0.4, 1)",
                fill: "both"
            }
        );
    }

    if (animation === "pop") {
        span.animate(
            [
                { opacity: 0, transform: "scale(0) rotate(-10deg)" },
                {
                    opacity: 0.8,
                    transform: "scale(1.15) rotate(2deg)",
                    offset: 0.5
                },
                { opacity: 1, transform: "scale(1) rotate(0)" }
            ],
            {
                duration: 300,
                easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                fill: "both"
            }
        );
    }

    if (animation === "glitch") {
        span.animate(
            [
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
            {
                duration: 350,
                easing: "steps(3, end)",
                fill: "both"
            }
        );
    }

    if (animation === "drop") {
        span.animate(
            [
                { opacity: 0, transform: "translateY(-30px) scale(0.9)" },
                {
                    opacity: 0.6,
                    transform: "translateY(5px) scale(1.05)",
                    offset: 0.7
                },
                { opacity: 1, transform: "translateY(0) scale(1)" }
            ],
            {
                duration: 280,
                easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)",
                fill: "both"
            }
        );
    }

    return span;
}
function typewriterAppendChar(target, char, animation) {
    /*
     * Whitespace:
     * buat text node biasa supaya spacing
     * dan wrapping tetap natural.
     */
    if (/\s/.test(char)) {
        target.appendChild(document.createTextNode(char));

        return;
    }

    /*
     * Cek node terakhir.
     *
     * Kalau node terakhir adalah word container,
     * berarti kita masih berada di kata yang sama.
     */
    let word = target.lastChild;

    if (
        !word ||
        word.nodeType !== Node.ELEMENT_NODE ||
        !word.classList.contains("typewriter-word")
    ) {
        word = document.createElement("span");

        word.className = "typewriter-word";

        /*
         * Satu kata dianggap sebagai satu unit
         * ketika browser melakukan line wrapping.
         */
        word.style.display = "inline-block";

        target.appendChild(word);
    }

    /*
     * Karakter tetap dibuat sebagai span sendiri
     * agar animasi tetap berjalan per huruf.
     */
    const span = typewriterAnimateChar(char, animation);

    word.appendChild(span);
}

async function reserveTextSpace(target, textList, enabled) {
    if (!enabled || !target || !textList.length) {
        return;
    }

    /*
     * Tunggu font selesai dimuat.
     * Penting karena #pgHero menggunakan TikTok Sans.
     */
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    const longestText = textList.reduce(
        (longest, text) => (text.length > longest.length ? text : longest),
        ""
    );

    const originalText = target.textContent;
    const originalMinHeight = target.style.minHeight;

    /*
     * Masukkan teks terpanjang langsung
     * ke element asli agar browser menghitung
     * menggunakan layout sebenarnya.
     */
    target.textContent = longestText;

    /*
     * Paksa browser menghitung layout.
     */
    const height = Math.ceil(target.getBoundingClientRect().height);

    /*
     * Kembalikan teks awal.
     */
    target.textContent = originalText;

    /*
     * Reserve tinggi berdasarkan hasil pengukuran.
     */
    target.style.minHeight = `${height}px`;
}

/* =========================================================
 * V1 - Normal Typewriter
 * ========================================================= */

async function typewriter(element, texts, options = {}) {
    const {
        speed = "0.08s",
        delay = "0s",

        cursor = true,
        cursorChar = "|",

        loop = false,

        deleteSpeed = "0.05s",
        pause = "1s",
        between = "0s",
        reserveSpace = true,
        charAnimation = "zoom"
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

    await reserveTextSpace(target, textList, reserveSpace);

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
            typewriterAppendChar(target, char, charAnimation);

            await typewriterSleep(typingDelay);
        }
    }

    /* Delete */

    async function deleteText(text) {
        for (let i = text.length; i > 1; i--) {
            let word = target.lastElementChild;

            /*
             * Kalau node terakhir bukan word,
             * berarti ada whitespace di belakang.
             */
            if (!word || !word.classList.contains("typewriter-word")) {
                const lastNode = target.lastChild;

                if (lastNode) {
                    lastNode.remove();
                }

                word = target.lastElementChild;
            }

            /*
             * Hapus karakter terakhir dari word.
             */
            if (word) {
                const lastChar = word.lastElementChild;

                if (lastChar) {
                    lastChar.remove();
                }

                /*
                 * Kalau kata sudah kosong,
                 * hapus word container.
                 */
                if (!word.lastElementChild) {
                    word.remove();
                }
            }

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

async function scrollTypewriter(element, texts, options = {}) {
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

        reserveSpace = true,
        charAnimation = "zoom"
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

    await reserveTextSpace(target, textList, reserveSpace);

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

            typewriterAppendChar(target, char, charAnimation);

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

            let word = target.lastElementChild;

            /*
             * Tangani whitespace terakhir.
             */
            if (!word || !word.classList.contains("typewriter-word")) {
                const lastNode = target.lastChild;

                if (lastNode) {
                    lastNode.remove();
                }

                word = target.lastElementChild;
            }

            /*
             * Hapus satu karakter.
             */
            if (word) {
                const lastChar = word.lastElementChild;

                if (lastChar) {
                    lastChar.remove();
                }

                /*
                 * Hapus container kalau kata sudah kosong.
                 */
                if (!word.lastElementChild) {
                    word.remove();
                }
            }

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
