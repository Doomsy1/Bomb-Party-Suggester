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

/**
 * Module loading order is important!
 * 1. utils.js - Contains utility functions used by other modules
 * 2. styles.js - Contains styling definitions
 * 3. typer.js - Contains typing simulation logic (depends on utils.js)
 * 4. dictionaries.js - Contains dictionary management
 * 5. ui.js - Contains UI creation (depends on all other modules)
 */

(function() {
    'use strict';

    // Only run inside the BombParty iframe, not parent
    if (window.self !== window.top) {
        console.log("[BombPartySuggester] Running in iframe. Good!");
    } else {
        console.log("[BombPartySuggester] Top window detected; script will not run here.");
        return;
    }
    
    // Ensure all modules are loaded
    const ensureModulesLoaded = () => {
        const requiredModules = ['utils', 'styles', 'typer', 'dictionaries', 'ui'];
        const missingModules = requiredModules.filter(module => !window[module]);
        
        if (missingModules.length > 0) {
            console.warn(`[BombPartySuggester] Some modules are missing: ${missingModules.join(', ')}. Retrying in 100ms.`);
            setTimeout(ensureModulesLoaded, 100);
            return false;
        }
        
        return true;
    };
    
    // Initialize the script
    function initScript() {
        console.log("[BombPartySuggester] Initializing script");
        
        // Make sure all modules are loaded before proceeding
        if (!ensureModulesLoaded()) {
            setTimeout(initScript, 200);
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