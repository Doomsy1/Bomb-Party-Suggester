// config.js - Contains configuration and keyboard layout for the Bomb Party Suggester

(function() {
    'use strict';

    // Default typing configuration
    const DEFAULT_CONFIG = {
        // Base typing characteristics
        baseDelay: 60,
        distanceMultiplier: 12.5,
        minDelay: 15,
        delayVariation: 0.2,

        // Typo characteristics
        typoChance: 2,
        
        // Typo correction timing
        typoNoticeDelay: {
            mean: 250,
            stdDev: 60
        },
        typoBackspaceDelay: {
            mean: 100,
            stdDev: 40
        },
        typoRecoveryDelay: {
            mean: 200,
            stdDev: 50
        }
    };

    // Current typing configuration
    let TYPER_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // Keyboard layout configuration
    const KEYBOARD_LAYOUT = {
        // each key's position on a standard QWERTY keyboard
        // format: [row, column]
        layout: {
            'q': [0, 0], 'w': [0, 1], 'e': [0, 2], 'r': [0, 3], 't': [0, 4], 'y': [0, 5], 'u': [0, 6], 'i': [0, 7], 'o': [0, 8], 'p': [0, 9],
            'a': [1, 0], 's': [1, 1], 'd': [1, 2], 'f': [1, 3], 'g': [1, 4], 'h': [1, 5], 'j': [1, 6], 'k': [1, 7], 'l': [1, 8],
            'z': [2, 0], 'x': [2, 1], 'c': [2, 2], 'v': [2, 3], 'b': [2, 4], 'n': [2, 5], 'm': [2, 6]
        },
        adjacent: {}
    };

    // Calculate adjacent keys for each key
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

    // Helper function for normal distribution
    const normalRandom = (mean, stdDev) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z * stdDev;
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

    // Reset settings to defaults
    const resetToDefaults = () => {
        TYPER_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        saveSettings();
    };

    // Get a value from the config
    const getValue = (key) => {
        const path = key.split('.');
        let value = TYPER_CONFIG;
        for (const part of path) {
            value = value[part];
        }
        return value;
    };

    // Set a value in the config
    const setValue = (key, value) => {
        const path = key.split('.');
        let target = TYPER_CONFIG;
        for (let i = 0; i < path.length - 1; i++) {
            target = target[path[i]];
        }
        target[path[path.length - 1]] = value;
    };

    // Load settings on initialization
    loadSavedSettings();

    // Export configuration to global scope
    window.BombPartySuggesterConfig = {
        TYPER_CONFIG,
        KEYBOARD_LAYOUT,
        normalRandom,
        loadSavedSettings,
        saveSettings,
        resetToDefaults,
        getValue,
        setValue
    };
})(); 