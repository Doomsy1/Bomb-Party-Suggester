// src/production.user.js
// ==UserScript==
// @name         Bomb Party Suggester
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Production version that references remote GitHub modules
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
//
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/styles.js
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/typer.js
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/dictionaryLoader.js
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiDragResize.js
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiSettings.js
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiSuggester.js
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/uiObserver.js
// @require https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/ui.js
// ==/UserScript==

(function() {
    'use strict';
    console.log("[BombPartySuggester] Production script using remote GitHub links.");
    
    // Initialize the script once all dependencies are loaded
    // All scripts are already loaded via @require, so we can initialize immediately
    if (typeof window.BPS !== 'undefined') {
        console.log("[BombPartySuggester] Initializing script");
        window.BPS.loadAllDictionaries().then(() => {
            window.BPS.initScript();
        });
    } else {
        console.error("[BombPartySuggester] BPS namespace not found. Script dependencies may not have loaded correctly.");
    }
})();
