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

    const target =
        typeof element === "string"
            ? document.getElementById(element)
            : element;

    if (!target) {
        console.error(`Typewriter: element "${element}" not found.`);
        return;
    }

    const textList = Array.isArray(texts) ? texts : [texts];

    const parseTime = value => {
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
    };

    const typingDelay = parseTime(speed);
    const startDelay = parseTime(delay);
    const removeDelay = parseTime(deleteSpeed);
    const pauseDelay = parseTime(pause);
    const betweenDelay = parseTime(between);

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    if (cursor) {
        target.classList.add("typewriter-cursor");
        target.style.setProperty("--typewriter-cursor", `"${cursorChar}"`);
    }

    target.textContent = "";

    async function typeText(text) {
        for (const char of text) {
            target.textContent += char;
            await sleep(typingDelay);
        }
    }

    async function deleteText(text) {
        for (let i = text.length; i > 1; i--) {
            target.textContent = text.slice(0, i - 1);
            await sleep(removeDelay);
        }
    }

    async function start() {
        await sleep(startDelay);

        do {
            for (let i = 0; i < textList.length; i++) {
                const text = String(textList[i]);

                await typeText(text);

                if (i < textList.length - 1) {
                    await sleep(pauseDelay);
                    await deleteText(text);
                    await sleep(betweenDelay);
                    target.textContent = "";
                }
            }

            if (!loop) {
                break;
            }

            await sleep(pauseDelay);

            const lastText = String(textList[textList.length - 1]);

            await deleteText(lastText);

            await sleep(betweenDelay);

            target.textContent = "";
        } while (loop);
    }

    start();
}
