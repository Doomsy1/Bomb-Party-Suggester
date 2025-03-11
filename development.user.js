// ==UserScript==
// @name         Bomb Party Suggester (Development)
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Combined development script for Bomb Party Suggester
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    console.log("[BombPartySuggester] development.user.js loaded (combined version)");
    
    // load all our dependencies
    // we need to use the proper way to dynamically load scripts in the browser
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }
    
    // define all our dependencies
    const dependencies = [
        'http://localhost:8080/src/ui/styles.js',
        'http://localhost:8080/src/core/typer.js',
        'http://localhost:8080/src/core/dictionaryLoader.js',
        'http://localhost:8080/src/ui/dragResize.js',
        'http://localhost:8080/src/ui/settings.js',
        'http://localhost:8080/src/ui/suggester.js',
        'http://localhost:8080/src/ui/observer.js',
        'http://localhost:8080/src/ui/main.js'
    ];
    
    // load all dependencies in sequence
    async function loadAllDependencies() {
        for (const dep of dependencies) {
            try {
                await loadScript(dep);
                console.log(`[BombPartySuggester] Loaded: ${dep}`);
            } catch (err) {
                console.error(`[BombPartySuggester] Failed to load: ${dep}`, err);
            }
        }
        console.log("[BombPartySuggester] All dependencies loaded");
        
        // initialize the script once all dependencies are loaded
        if (typeof window.BPS !== 'undefined') {
            console.log("[BombPartySuggester] Initializing script");
            window.BPS.loadAllDictionaries().then(() => {
                window.BPS.initScript();
            });
        }
    }
    
    // start loading everything
    loadAllDependencies();
})(); 