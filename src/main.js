// ==UserScript==
// @name         Bomb Party Suggester (Single UI, Frequency-Sorted)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hooks the WebSocket to auto-detect the current syllable, preloads a frequency-based dictionary, and displays suggestions sorted by popularity.
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
// @source       https://github.com/Doomsy1/Bomb-Party-Suggester
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/utils.js
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/styles.js
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/typer.js
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/dictionaries.js
// @require      https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/ui.js
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
    
    // Check if all required modules are loaded
    function areModulesReady() {
        return window.utils && window.styles && window.typer && 
               window.dictionaries && window.ui;
    }
    
    // Initialize the script
    function initScript() {
        console.log("[BombPartySuggester] Initializing script");
        
        // Make sure all modules are loaded before proceeding
        if (!areModulesReady()) {
            console.log("[BombPartySuggester] Waiting for modules to load...");
            setTimeout(initScript, 100);
            return;
        }
        
        // Load saved settings
        window.typer.loadSavedSettings();
        
        // Create the UI
        window.ui.createUI();
        
        // Load all dictionaries in parallel
        Promise.all([
            window.dictionaries.loadDictionary('5k'),
            window.dictionaries.loadDictionary('20k'),
            window.dictionaries.loadDictionary('170k')
        ]).then(() => {
            window.dictionaries.dictionaryLoaded = true;
            // Start observing for syllable changes
            window.ui.setupSyllableObserver();
        }).catch(err => {
            console.error("[BombPartySuggester] Error loading dictionaries:", err);
            // Try to setup observer even if dictionaries fail
            window.ui.setupSyllableObserver();
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScript);
    } else {
        initScript();
    }
})(); 