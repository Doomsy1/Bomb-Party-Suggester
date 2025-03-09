// ==UserScript==
// @name         Bomb Party Suggester (Single UI, Frequency-Sorted)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hooks the WebSocket to auto-detect the current syllable, preloads a frequency-based dictionary, and displays suggestions sorted by popularity.
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/styles.js
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/config.js
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/dictionary.js
// ==/UserScript==

(function() {
    'use strict';

    // Only run inside the BombParty iframe, not parent
    if (window.self !== window.top) {
        console.log("[BombPartySuggester] Running in iframe. Good!");
    } else {
        console.log("[BombPartySuggester] Top window detected; script will not run here.");
        return;
    }

    // Import dependencies from global scope
    const { styles } = window.BombPartySuggesterStyles;
    const { TYPER_CONFIG, KEYBOARD_LAYOUT, normalRandom } = window.BombPartySuggesterConfig;
    const { dictionaries, loadDictionary, sortMatches } = window.BombPartySuggesterDict;

    // Helper function to apply styles to an element
    const applyStyles = (element, styleObj) => {
        Object.assign(element.style, styleObj);
    };

    // Load saved settings from localStorage
    const loadSavedSettings = () => {
        const savedSettings = localStorage.getItem('bombPartyTyperSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                Object.assign(TYPER_CONFIG, parsed);
                console.log("[BombPartySuggester] Loaded saved typer settings");
            } catch (e) {
                console.error("[BombPartySuggester] Error loading saved settings:", e);
            }
        }
    };

    // Save current settings to localStorage
    const saveSettings = () => {
        try {
            localStorage.setItem('bombPartyTyperSettings', JSON.stringify(TYPER_CONFIG));
            console.log("[BombPartySuggester] Saved typer settings");
        } catch (e) {
            console.error("[BombPartySuggester] Error saving settings:", e);
        }
    };

    // Load saved settings immediately after defining default config
    loadSavedSettings();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScript);
    } else {
        initScript();
    }

    // Main initialization function
    function initScript() {
        // Avoid duplicates by checking if panel already exists
        if (document.getElementById('bombPartyWordSuggesterPanel')) {
            console.log("[BombPartySuggester] UI already exists, skipping.");
            return;
        }

        // Load all dictionaries at startup
        Promise.all([
            loadDictionary('5k'),
            loadDictionary('20k'),
            loadDictionary('170k')
        ]).then(() => {
            // Start observing for syllable changes
            setupSyllableObserver();
        }).catch(err => {
            console.error("[BombPartySuggester] Error loading dictionaries:", err);
            // Try to setup observer even if dictionaries fail
            setupSyllableObserver();
        });
    }

    // Function to find and observe the syllable element
    function setupSyllableObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const syllable = mutation.target.textContent.trim();
                    if (syllable) {
                        suggestWords(syllable);
                    }
                }
            }
        });

        // Function to start observing syllable element
        function observeSyllable() {
            const syllableElement = document.querySelector('.syllable');
            if (syllableElement) {
                observer.observe(syllableElement, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });
                // Initial check
                const syllable = syllableElement.textContent.trim();
                if (syllable) {
                    suggestWords(syllable);
                }
            } else {
                // If element not found, retry after a short delay
                setTimeout(observeSyllable, 1000);
            }
        }

        // Start observing
        observeSyllable();
    }

    // Helper function to check if it's player's turn
    const isPlayerTurn = () => {
        const selfTurn = document.querySelector('.selfTurn');
        return selfTurn && !selfTurn.hidden;
    };

    // Function to simulate typing with delay
    const simulateTyping = async (word) => {
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
    };

    // Update the calculateTypingDelay function to use config
    const calculateTypingDelay = (fromKey, toKey) => {
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
        
        const meanDelay = TYPER_CONFIG.baseDelay + (distance * TYPER_CONFIG.distanceMultiplier);
        const stdDev = meanDelay * TYPER_CONFIG.delayVariation;
        
        return Math.max(TYPER_CONFIG.minDelay, normalRandom(meanDelay, stdDev));
    };

    // Update the simulateTypo function to use config
    const simulateTypo = async (inputField, correctChar) => {
        correctChar = correctChar.toLowerCase();
        if (!KEYBOARD_LAYOUT.adjacent[correctChar]) return false;
        
        if (Math.random() > (TYPER_CONFIG.typoChance / 100)) return false;
        
        const typoChar = KEYBOARD_LAYOUT.adjacent[correctChar][
            Math.floor(Math.random() * KEYBOARD_LAYOUT.adjacent[correctChar].length)
        ];
        
        inputField.value += typoChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(null, typoChar)));
        
        await new Promise(resolve => setTimeout(resolve, 
            normalRandom(TYPER_CONFIG.typoNoticeDelay.mean, TYPER_CONFIG.typoNoticeDelay.stdDev)));
        
        inputField.value = inputField.value.slice(0, -1);
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve,
            normalRandom(TYPER_CONFIG.typoBackspaceDelay.mean, TYPER_CONFIG.typoBackspaceDelay.stdDev)));
        
        inputField.value += correctChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve,
            normalRandom(TYPER_CONFIG.typoRecoveryDelay.mean, TYPER_CONFIG.typoRecoveryDelay.stdDev)));
        
        return true;
    };
})(); 