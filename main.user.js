// ==UserScript==
// @name         Bomb Party Suggester (Single UI, Frequency-Sorted)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hooks the WebSocket to auto-detect the current syllable, preloads a frequency-based dictionary, and displays suggestions sorted by popularity.
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/styles.js
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/config.js
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/dictionary.js
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/ui.js
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/typing.js
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

    // Main initialization function
    const init = () => {
        // Create UI components
        const { resultsDiv } = BombPartySuggesterUI.createUI();

        // Load dictionaries and setup observers
        Promise.all([
            BombPartySuggesterDict.loadDictionary('5k'),
            BombPartySuggesterDict.loadDictionary('20k'),
            BombPartySuggesterDict.loadDictionary('170k')
        ]).then(() => {
            // Start observing for syllable changes
            setupSyllableObserver(resultsDiv);
        }).catch(err => {
            console.error("[BombPartySuggester] Error loading dictionaries:", err);
            setupSyllableObserver(resultsDiv);
        });
    };

    // Function to find and observe the syllable element
    const setupSyllableObserver = (resultsDiv) => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const syllable = mutation.target.textContent.trim();
                    if (syllable) {
                        BombPartySuggesterUI.updateSuggestions(syllable);
                    }
                }
            }
        });

        // Function to start observing syllable element
        const observeSyllable = () => {
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
                    BombPartySuggesterUI.updateSuggestions(syllable);
                }
            } else {
                // If element not found, retry after a short delay
                setTimeout(observeSyllable, 1000);
            }
        };

        // Start observing
        observeSyllable();
    };

    // Export initialization function
    window.BombPartySuggester = { init };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 