// ==UserScript==
// @name         Bomb Party Suggester (Modularized)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hooks the WebSocket to auto-detect the current syllable, preloads a frequency-based dictionary, and displays suggestions sorted by popularity.
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
//
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/styles.js
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/typer.js
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/dictionaryLoader.js
// @require      https://raw.githubusercontent.com/Doomsy1/Bomb-Party-Suggester/main/src/ui.js
//
// ==/UserScript==

(function() {
    'use strict';

    // If script is running in top window, do nothing:
    if (window.self === window.top) {
        console.log("[BombPartySuggester] Top window detected; not running.");
        return;
    }

    // Otherwise, run the rest of the logic.
    // 1) Load all dictionaries
    window.BPS.loadAllDictionaries()
      .then(() => {
         console.log("[BombPartySuggester] Dictionaries finished loading.");
         // 2) Initialize UI logic
         window.BPS.initScript();
      })
      .catch(err => {
         console.error("[BombPartySuggester] Dictionary load failed:", err);
         // Even if dictionaries fail, we can still init
         window.BPS.initScript();
      });
})();
