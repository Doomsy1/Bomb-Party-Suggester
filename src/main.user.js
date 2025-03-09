// ==UserScript==
// @name         Bomb Party Suggester
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Hooks the WebSocket to auto-detect the current syllable, preloads a frequency-based dictionary, and displays suggestions sorted by popularity.
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start

// Core Modules
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/styles.js
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/typer.js
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/dictionaryLoader.js

// UI Modules (Modularized)
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiDragResize.js
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiSettings.js
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiSuggester.js
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiObserver.js
// @require  https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/ui.js
// ==/UserScript==

(function() {
    'use strict';

    // Only run inside the BombParty iframe
    if (window.self === window.top) {
        console.log("[BombPartySuggester] Script is running in top window, exiting.");
        return;
    }

    console.log("[BombPartySuggester] Script is running inside the game iframe.");

    // Load dictionaries first, then initialize the UI
    window.BPS.loadAllDictionaries().then(() => {
        console.log("[BombPartySuggester] Dictionaries loaded. Initializing UI...");
        window.BPS.initScript();
    }).catch(err => {
        console.error("[BombPartySuggester] Dictionary load failed:", err);
        // Still initialize the UI even if dictionaries fail to load
        window.BPS.initScript();
    });
})();
