// ==UserScript==
// @name         Bomb Party Suggester (Development)
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Development script for Bomb Party Suggester
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    console.log("[BombPartySuggester] development.user.js loaded (combined version)");
    
    // load all dependencies
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url + '?t=' + new Date().getTime();
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
                // Add refresh button to the BPS panel after initialization
                addRefreshButtonToBPSPanel();
            });
        }
    }
    
    // thorough cleanup function to remove all BPS UI elements and reset state
    function cleanupBPS() {
        console.log("[BombPartySuggester] Cleaning up existing UI elements and state");
        
        // Save references to game elements that we need to preserve
        const gameInput = document.querySelector('.selfTurn input');
        const gameForm = document.querySelector('.selfTurn form');
        
        // Backup any event listeners on game elements
        let gameInputClone = null;
        let gameFormClone = null;
        
        if (gameInput) {
            // Focus the input to ensure it's active
            gameInput.focus();
            // Clone with deep copy to preserve attributes but not event listeners
            gameInputClone = gameInput.cloneNode(false);
        }
        
        if (gameForm) {
            // Clone with deep copy to preserve attributes but not event listeners
            gameFormClone = gameForm.cloneNode(false);
        }
        
        // specific element IDs to remove
        const elementsToRemove = [
            'bombPartyWordSuggesterPanel',
            'bombPartyWordSuggesterContent',
            'bombPartyWordSuggesterResults',
            'bombPartySettingsPanel'
        ];
        
        // remove elements by ID
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Remove refresh button if it's inside this element
                const refreshButton = document.getElementById('bps-refresh-button');
                if (refreshButton && element.contains(refreshButton)) {
                    document.body.appendChild(refreshButton);
                }
                element.remove();
                console.log(`[BombPartySuggester] Removed element: ${id}`);
            }
        });
        
        // remove any other elements with BPS-related IDs or classes
        // but be more careful to avoid affecting game elements
        const bpsElements = document.querySelectorAll('[id^="bps-"], [class^="bps-"], [id*="bombParty"], [class*="bombParty"]');
        bpsElements.forEach(element => {
            // Don't remove our refresh button or any game elements
            if (element.id !== 'bps-refresh-button' && 
                !element.classList.contains('selfTurn') && 
                !element.classList.contains('syllable')) {
                element.remove();
                console.log(`[BombPartySuggester] Removed element: ${element.id || element.className || 'unnamed'}`);
            }
        });
        
        // clear any intervals or timeouts that might be running
        if (typeof window.BPS !== 'undefined') {
            // save the refresh button reference and styles
            const refreshButton = window.BPS.refreshButton;
            const styles = window.BPS.styles;
            const applyStyles = window.BPS.applyStyles;
            
            // clear any timers
            if (window.BPS.timers && Array.isArray(window.BPS.timers)) {
                window.BPS.timers.forEach(timer => {
                    if (typeof timer === 'number') {
                        clearTimeout(timer);
                        clearInterval(timer);
                    }
                });
            }
            
            // reset the BPS object but keep the refresh functionality
            window.BPS = { 
                refreshButton,
                styles,
                applyStyles
            };
        }
        
        // Restore game input elements if they were modified
        if (gameInput && gameInputClone) {
            // Preserve the current value
            gameInputClone.value = gameInput.value;
            // Replace with our clone that doesn't have BPS event listeners
            if (gameInput.parentNode) {
                gameInput.parentNode.replaceChild(gameInputClone, gameInput);
                // Focus the new input
                gameInputClone.focus();
            }
        }
        
        if (gameForm && gameFormClone && gameFormClone.parentNode) {
            // Add the input back to the form
            if (gameInputClone) {
                gameFormClone.appendChild(gameInputClone);
            }
            // Replace the form
            gameForm.parentNode.replaceChild(gameFormClone, gameForm);
        }
        
        console.log("[BombPartySuggester] Cleanup completed");
    }
    
    // create refresh button using BPS styles
    function createRefreshButton() {
        // wait for styles to be loaded
        if (!window.BPS || !window.BPS.styles) {
            console.log("[BombPartySuggester] Waiting for styles to load before creating refresh button");
            setTimeout(createRefreshButton, 500);
            return;
        }
        
        // remove existing button if it exists
        const existingButton = document.getElementById('bps-refresh-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // create new button
        const refreshButton = document.createElement('button');
        refreshButton.id = 'bps-refresh-button';
        refreshButton.textContent = 'Reload BPS';
        
        // use BPS styles with some customizations
        const buttonStyle = {
            ...window.BPS.styles.button,
            position: 'absolute', // Changed from fixed to absolute
            bottom: '10px',
            right: '10px',
            zIndex: '2147483647',
            minWidth: '120px',
            height: '30px',
            textAlign: 'center',
            lineHeight: '20px',
            fontWeight: 'bold',
            background: window.BPS.styles.colors.primary,
            color: window.BPS.styles.colors.background
        };
        
        window.BPS.applyStyles(refreshButton, buttonStyle);
        
        // add hover effect
        refreshButton.onmouseover = function() {
            this.style.backgroundColor = '#45a049';
        };
        refreshButton.onmouseout = function() {
            this.style.backgroundColor = window.BPS.styles.colors.primary;
        };
        
        // add click handler
        refreshButton.onclick = async function(e) {
            // Prevent event from bubbling to game elements
            e.preventDefault();
            e.stopPropagation();
            
            const originalText = this.textContent;
            this.textContent = 'Reloading...';
            this.disabled = true;
            this.style.backgroundColor = '#cccccc';
            
            console.log("[BombPartySuggester] Reloading dependencies...");
            
            // clean up existing UI and state
            cleanupBPS();
            
            // remove all previously loaded scripts
            const oldScripts = document.querySelectorAll('script[src*="localhost:8080"]');
            oldScripts.forEach(script => {
                script.remove();
                console.log(`[BombPartySuggester] Removed script: ${script.src}`);
            });
            
            // reload all dependencies
            await loadAllDependencies();
            
            this.textContent = 'Reloaded!';
            this.disabled = false;
            this.style.backgroundColor = window.BPS.styles.colors.primary;
            
            // reset button text after a delay
            setTimeout(() => {
                this.textContent = originalText;
            }, 2000);
            
            // Focus the game input if it exists
            setTimeout(() => {
                const gameInput = document.querySelector('.selfTurn input');
                if (gameInput) {
                    gameInput.focus();
                    console.log("[BombPartySuggester] Focused game input");
                }
            }, 500);
            
            return false; // Prevent default
        };
        
        // Initially add to body, will be moved to panel later
        document.body.appendChild(refreshButton);
        
        // store reference to the button in the BPS object
        if (typeof window.BPS === 'undefined') {
            window.BPS = {};
        }
        window.BPS.refreshButton = refreshButton;
        
        console.log("[BombPartySuggester] Refresh button created");
        return refreshButton;
    }
    
    // Add the refresh button to the BPS panel instead of body
    function addRefreshButtonToBPSPanel() {
        const panel = document.getElementById('bombPartyWordSuggesterPanel');
        const refreshButton = document.getElementById('bps-refresh-button');
        
        if (panel && refreshButton) {
            // Move the button to the panel
            panel.appendChild(refreshButton);
            console.log("[BombPartySuggester] Moved refresh button to BPS panel");
        } else {
            console.log("[BombPartySuggester] Could not find panel or refresh button");
            // Try again later
            setTimeout(addRefreshButtonToBPSPanel, 1000);
        }
    }
    
    // start loading everything
    loadAllDependencies().then(() => {
        // create refresh button after dependencies are loaded
        createRefreshButton();
    });
    
    // create refresh button after DOM is fully loaded (backup)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(createRefreshButton, 1000);
        });
    } else {
        setTimeout(createRefreshButton, 1000);
    }
})(); 