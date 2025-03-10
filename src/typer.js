// src/typer.js
window.BPS = window.BPS || {};

(function(){
    // Keyboard layout
    const KEYBOARD_LAYOUT = {
        layout: {
            'q': [0, 0], 'w': [0, 1], 'e': [0, 2], 'r': [0, 3], 't': [0, 4], 'y': [0, 5],
            'u': [0, 6], 'i': [0, 7], 'o': [0, 8], 'p': [0, 9],
            'a': [1, 0], 's': [1, 1], 'd': [1, 2], 'f': [1, 3], 'g': [1, 4], 'h': [1, 5],
            'j': [1, 6], 'k': [1, 7], 'l': [1, 8],
            'z': [2, 0], 'x': [2, 1], 'c': [2, 2], 'v': [2, 3], 'b': [2, 4], 'n': [2, 5],
            'm': [2, 6]
        },
        adjacent: {}
    };

    // Compute adjacent keys
    Object.entries(KEYBOARD_LAYOUT.layout).forEach(([key, [row, col]]) => {
        KEYBOARD_LAYOUT.adjacent[key] = Object.entries(KEYBOARD_LAYOUT.layout)
            .filter(([k, [r, c]]) => {
                if (k === key) return false;
                const rowDiff = Math.abs(r - row);
                const colDiff = Math.abs(c - col);
                return rowDiff <= 1 && colDiff <= 1;
            })
            .map(([k]) => k);
    });

    // Typing config
    const TYPER_CONFIG = {
        baseDelay: 60,
        distanceMultiplier: 12.5,
        minDelay: 15,
        delayVariation: 0.2,
        typoChance: 2,
        typoNoticeDelay: { mean: 250, stdDev: 60 },
        typoBackspaceDelay: { mean: 100, stdDev: 40 },
        typoRecoveryDelay: { mean: 200, stdDev: 50 }
    };

    // Load from localStorage
    function loadSavedSettings() {
        const saved = localStorage.getItem('bombPartyTyperSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.assign(TYPER_CONFIG, parsed);
                console.log("[BombPartySuggester] Loaded saved typer settings");
            } catch (e) {
                console.error("[BombPartySuggester] Error loading saved settings:", e);
            }
        }
    }

    // Save to localStorage
    function saveSettings() {
        try {
            localStorage.setItem('bombPartyTyperSettings', JSON.stringify(TYPER_CONFIG));
            console.log("[BombPartySuggester] Saved typer settings");
        } catch (e) {
            console.error("[BombPartySuggester] Error saving settings:", e);
        }
    }

    // Normal random helper
    function normalRandom(mean, stdDev) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); 
        while(v === 0) v = Math.random();
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return Math.floor(num * stdDev + mean);
    }

    function calculateTypingDelay(fromKey, toKey) {
        if (!fromKey) return TYPER_CONFIG.baseDelay;
        fromKey = fromKey.toLowerCase();
        toKey = toKey.toLowerCase();
        const fromPos = KEYBOARD_LAYOUT.layout[fromKey];
        const toPos = KEYBOARD_LAYOUT.layout[toKey];
        if (!fromPos || !toPos) return TYPER_CONFIG.baseDelay;
        const distance = Math.sqrt(
            Math.pow(fromPos[0] - toPos[0], 2) +
            Math.pow(fromPos[1] - toPos[1], 2)
        );
        const meanDelay = TYPER_CONFIG.baseDelay + distance * TYPER_CONFIG.distanceMultiplier;
        const stdDev = meanDelay * TYPER_CONFIG.delayVariation;
        return Math.max(TYPER_CONFIG.minDelay, normalRandom(meanDelay, stdDev));
    }

    async function simulateTypo(inputField, correctChar) {
        const c = correctChar.toLowerCase();
        if (!KEYBOARD_LAYOUT.adjacent[c]) return false;
        if (Math.random() > (TYPER_CONFIG.typoChance / 100)) return false;

        const neighbors = KEYBOARD_LAYOUT.adjacent[c];
        const typoChar = neighbors[Math.floor(Math.random() * neighbors.length)];

        // Type the wrong char
        inputField.value += typoChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(null, typoChar)));

        // Notice delay
        await new Promise(resolve => setTimeout(resolve,
            normalRandom(TYPER_CONFIG.typoNoticeDelay.mean, TYPER_CONFIG.typoNoticeDelay.stdDev)));

        // Backspace
        inputField.value = inputField.value.slice(0, -1);
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve,
            normalRandom(TYPER_CONFIG.typoBackspaceDelay.mean, TYPER_CONFIG.typoBackspaceDelay.stdDev)));

        // Type correct
        inputField.value += correctChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve,
            normalRandom(TYPER_CONFIG.typoRecoveryDelay.mean, TYPER_CONFIG.typoRecoveryDelay.stdDev)));

        return true;
    }

    async function simulateTyping(word) {
        const selfTurn = document.querySelector('.selfTurn');
        const form = document.querySelector('.selfTurn form');
        const inputField = document.querySelector('.selfTurn input');

        if (!inputField || !form || selfTurn.hidden) {
            console.log("[BombPartySuggester] Could not find input field or not your turn");
            return;
        }

        inputField.value = '';
        inputField.focus();

        let lastChar = null;
        for (let i = 0; i < word.length; i++) {
            const madeTypo = await simulateTypo(inputField, word[i]);
            if (!madeTypo) {
                inputField.value += word[i];
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(lastChar, word[i])));
                lastChar = word[i];
            }
        }

        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }

    function isPlayerTurn() {
        const selfTurn = document.querySelector('.selfTurn');
        return selfTurn && !selfTurn.hidden;
    }

    // Load settings once at script start
    loadSavedSettings();

    // Expose
    window.BPS.KEYBOARD_LAYOUT = KEYBOARD_LAYOUT;
    window.BPS.TYPER_CONFIG = TYPER_CONFIG;
    window.BPS.loadSavedSettings = loadSavedSettings;
    window.BPS.saveSettings = saveSettings;
    window.BPS.normalRandom = normalRandom;
    window.BPS.calculateTypingDelay = calculateTypingDelay;
    window.BPS.simulateTyping = simulateTyping;
    window.BPS.isPlayerTurn = isPlayerTurn;
})();
