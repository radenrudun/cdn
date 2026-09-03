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

    if (element instanceof Element) {
        return element;
    }

    return null;
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
        between = "0s"
    } = options;

    const target = typewriterGetElement(element);

    if (!target) {
        console.error(`Typewriter: element "${element}" not found.`);
        return;
    }

    const textList = Array.isArray(texts) ? texts : [texts];

    const typingDelay = typewriterParseTime(speed);
    const startDelay = typewriterParseTime(delay);
    const removeDelay = typewriterParseTime(deleteSpeed);
    const pauseDelay = typewriterParseTime(pause);
    const betweenDelay = typewriterParseTime(between);

    if (cursor) {
        target.classList.add("typewriter-cursor");

        target.style.setProperty("--typewriter-cursor", `"${cursorChar}"`);
    }

    target.textContent = "";

    async function typeText(text) {
        for (const char of text) {
            target.textContent += char;

            await typewriterSleep(typingDelay);
        }
    }

    async function deleteText(text) {
        /*
         * Sisakan 1 huruf saat proses delete
         * agar layout tidak langsung kosong.
         */
        for (let i = text.length; i > 1; i--) {
            target.textContent = text.slice(0, i - 1);

            await typewriterSleep(removeDelay);
        }
    }

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

                    /*
                     * Hilangkan huruf terakhir sebelum
                     * teks berikutnya mulai.
                     */
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

        speed = "0.08s",
        delay = "0s",

        cursor = true,
        cursorChar = "|",

        loop = false,

        deleteSpeed = "0.05s",
        pause = "1s",
        between = "0s",

        /*
         * true:
         * element keluar zona → delete
         * masuk lagi → write lagi
         *
         * false:
         * sekali write → selesai
         */
        deleteOnExit = true
    } = options;

    const target = typewriterGetElement(element);

    if (!target) {
        console.error(`ScrollTypewriter: element "${element}" not found.`);
        return;
    }

    const textList = Array.isArray(texts) ? texts.map(String) : [String(texts)];

    /* =====================================================
     * State
     * ===================================================== */

    let active = false;
    let started = false;
    let destroyed = false;

    let animationId = 0;

    let currentText = "";
    let currentIndex = 0;

    let abortController = null;

    /* =====================================================
     * Cursor
     * ===================================================== */

    if (cursor) {
        target.classList.add("typewriter-cursor");

        target.style.setProperty("--typewriter-cursor", `"${cursorChar}"`);
    }

    /* =====================================================
     * Time
     * ===================================================== */

    const typingDelay = typewriterParseTime(speed);
    const startDelay = typewriterParseTime(delay);
    const removeDelay = typewriterParseTime(deleteSpeed);
    const pauseDelay = typewriterParseTime(pause);
    const betweenDelay = typewriterParseTime(between);

    /* =====================================================
     * Trigger
     * ===================================================== */

    function getTriggerZone() {
        /*
         * Single point:
         *
         * "center"
         * "30vh"
         */

        if (typeof trigger === "string" || typeof trigger === "number") {
            let position = trigger;

            if (position === "center") {
                position = "50vh";
            }

            const viewportHeight = window.innerHeight;

            let px;

            if (typeof position === "string" && position.endsWith("vh")) {
                px = (parseFloat(position) / 100) * viewportHeight;
            } else if (typeof position === "number") {
                px = position;
            } else {
                px = (50 / 100) * viewportHeight;
            }

            /*
             * Single point dibuat sebagai area kecil
             * supaya element bisa "menyentuh" trigger.
             */

            return {
                top: px,
                bottom: px
            };
        }

        /*
         * Custom zone:
         *
         * {
         *     top: "25vh",
         *     bottom: "75vh"
         * }
         */

        if (typeof trigger === "object" && trigger !== null) {
            const viewportHeight = window.innerHeight;

            function convert(value, fallback) {
                if (value === undefined) {
                    return fallback;
                }

                if (typeof value === "string" && value.endsWith("vh")) {
                    return (parseFloat(value) / 100) * viewportHeight;
                }

                if (typeof value === "number") {
                    return value;
                }

                return fallback;
            }

            return {
                top: convert(trigger.top, 0),
                bottom: convert(trigger.bottom, viewportHeight)
            };
        }

        return {
            top: 0,
            bottom: window.innerHeight
        };
    }

    /* =====================================================
     * Check Position
     * ===================================================== */

    function isInTriggerZone() {
        const rect = target.getBoundingClientRect();

        const zone = getTriggerZone();

        /*
         * Untuk single trigger:
         *
         * element dianggap aktif ketika
         * titik tengah element melewati trigger.
         */

        if (zone.top === zone.bottom) {
            const elementCenter = rect.top + rect.height / 2;

            return (
                elementCenter >= zone.top - 1 && elementCenter <= zone.top + 1
            );
        }

        /*
         * Custom zone:
         *
         * element aktif selama sebagian element
         * berada di dalam zona.
         */

        return rect.bottom > zone.top && rect.top < zone.bottom;
    }

    /* =====================================================
     * Abort Current Animation
     * ===================================================== */

    function stopAnimation() {
        animationId++;

        if (abortController) {
            abortController.abort();
        }

        abortController = new AbortController();
    }

    /* =====================================================
     * Check Animation
     * ===================================================== */

    function isCancelled(id, signal) {
        return destroyed || id !== animationId || signal.aborted;
    }

    /* =====================================================
     * Type Text
     * ===================================================== */

    async function typeText(text, id, signal) {
        currentText = text;

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
     * Delete Text
     * ===================================================== */

    async function deleteText(text, id, signal) {
        /*
         * Delete sampai menyisakan 1 karakter.
         */

        for (let i = text.length; i > 1; i--) {
            if (isCancelled(id, signal)) {
                return false;
            }

            target.textContent = text.slice(0, i - 1);

            await typewriterSleep(removeDelay);
        }

        /*
         * Setelah animasi delete selesai,
         * baru benar-benar kosong.
         */

        if (!isCancelled(id, signal)) {
            target.textContent = "";
        }

        return true;
    }

    /* =====================================================
     * Run Typewriter
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

                currentIndex = i;

                const completed = await typeText(text, id, signal);

                if (!completed) {
                    return;
                }

                /*
                 * Kalau masih ada teks berikutnya
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
             * Tidak loop?
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
         * Kalau deleteOnExit false,
         * jangan jalankan ulang setelah
         * animation pernah selesai.
         */

        if (!deleteOnExit && started) {
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

        /*
         * Jangan melakukan apa-apa kalau
         * deleteOnExit dimatikan.
         */

        if (!deleteOnExit) {
            return;
        }

        stopAnimation();

        /*
         * Hapus isi secara langsung.
         *
         * Kita tidak menjalankan delete animation
         * ketika element sudah keluar zona karena
         * user ingin element hilang → delete.
         */

        target.textContent = "";
    }

    /* =====================================================
     * Scroll Handler
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
     * Event
     * ===================================================== */

    window.addEventListener("scroll", checkPosition, { passive: true });

    window.addEventListener("resize", checkPosition);

    /*
     * Initial check
     */

    checkPosition();

    /* =====================================================
     * Return Controller
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

            currentIndex = 0;
            currentText = "";

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
