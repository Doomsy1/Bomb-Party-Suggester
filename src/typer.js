/**
 * typer.js - Typing simulation functionality for Bomb Party Suggester
 */

// Use normalRandom from the global utils object
const { normalRandom } = window.utils;

// Keyboard layout and typing simulation helpers
const KEYBOARD_LAYOUT = {
    // each key's position on a standard QWERTY keyboard
    // format: [row, column]
    layout: {
        'q': [0, 0], 'w': [0, 1], 'e': [0, 2], 'r': [0, 3], 't': [0, 4], 'y': [0, 5], 'u': [0, 6], 'i': [0, 7], 'o': [0, 8], 'p': [0, 9],
        'a': [1, 0], 's': [1, 1], 'd': [1, 2], 'f': [1, 3], 'g': [1, 4], 'h': [1, 5], 'j': [1, 6], 'k': [1, 7], 'l': [1, 8],
        'z': [2, 0], 'x': [2, 1], 'c': [2, 2], 'v': [2, 3], 'b': [2, 4], 'n': [2, 5], 'm': [2, 6]
    },
    // cache for adjacent keys
    adjacent: {}
};

// Calculate adjacent keys for each key
Object.entries(KEYBOARD_LAYOUT.layout).forEach(([key, [row, col]]) => {
    KEYBOARD_LAYOUT.adjacent[key] = Object.entries(KEYBOARD_LAYOUT.layout)
        .filter(([k, [r, c]]) => {
            if (k === key) return false;
            const rowDiff = Math.abs(r - row);
            const colDiff = Math.abs(c - col);
            return rowDiff <= 1 && colDiff <= 1; // adjacent if within 1 key in any direction
        })
        .map(([k]) => k);
});

// Typing simulation configuration
const TYPER_CONFIG = {
    // Base typing characteristics
    baseDelay: 60, // base delay between keystrokes in ms
    distanceMultiplier: 12.5, // additional ms per unit of key distance
    minDelay: 15, // minimum delay between keystrokes
    delayVariation: 0.2, // standard deviation as percentage of mean delay

    // Typo characteristics
    typoChance: 2, // probability of making a typo (2%)

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

// Calculate typing delay based on key positions
const calculateTypingDelay = (fromKey, toKey) => {
    // Default to base delay if either key is missing
    if (!KEYBOARD_LAYOUT.layout[fromKey] || !KEYBOARD_LAYOUT.layout[toKey]) {
        return TYPER_CONFIG.baseDelay;
    }

    // Get positions
    const [fromRow, fromCol] = KEYBOARD_LAYOUT.layout[fromKey];
    const [toRow, toCol] = KEYBOARD_LAYOUT.layout[toKey];

    // Calculate Euclidean distance between keys
    const rowDiff = fromRow - toRow;
    const colDiff = fromCol - toCol;
    const distance = Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);

    // Calculate delay with variation
    const baseDelay = TYPER_CONFIG.baseDelay + (distance * TYPER_CONFIG.distanceMultiplier);
    const stdDev = baseDelay * TYPER_CONFIG.delayVariation;
    let delay = normalRandom(baseDelay, stdDev);

    // Ensure minimum delay
    return Math.max(TYPER_CONFIG.minDelay, delay);
};

// Simulate a typo with appropriate recovery
const simulateTypo = async (inputField, correctChar) => {
    // Choose a random adjacent key to the correct key
    const adjacentKeys = KEYBOARD_LAYOUT.adjacent[correctChar.toLowerCase()] || [];
    
    if (adjacentKeys.length === 0) {
        // If no adjacent keys (unusual), just type the correct character
        inputField.value += correctChar;
        return;
    }

    // Pick a random adjacent key for the typo
    const typoChar = adjacentKeys[Math.floor(Math.random() * adjacentKeys.length)];
    
    // Type the wrong character
    inputField.value += typoChar;
    
    // Dispatch input event to trigger game input handling
    inputField.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for the player to "notice" the typo
    await new Promise(resolve => setTimeout(resolve, 
        normalRandom(TYPER_CONFIG.typoNoticeDelay.mean, TYPER_CONFIG.typoNoticeDelay.stdDev)));

    // Backspace to remove the typo
    inputField.value = inputField.value.slice(0, -1);
    inputField.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait before typing the correct character
    await new Promise(resolve => setTimeout(resolve, 
        normalRandom(TYPER_CONFIG.typoRecoveryDelay.mean, TYPER_CONFIG.typoRecoveryDelay.stdDev)));

    // Type the correct character
    inputField.value += correctChar;
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
};

// Simulate realistic typing of a word
const simulateTyping = async (word) => {
    // Find the input field
    const inputField = document.querySelector('input.styled');
    if (!inputField) {
        console.error("[BombPartySuggester] No input field found for typing");
        return;
    }

    let lastChar = null;
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        
        // If not the first character, calculate delay based on key distance
        if (lastChar) {
            const delay = calculateTypingDelay(lastChar.toLowerCase(), char.toLowerCase());
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Decide whether to make a typo
        const makeTypo = Math.random() * 100 < TYPER_CONFIG.typoChance;
        
        if (makeTypo) {
            await simulateTypo(inputField, char);
        } else {
            // Regular typing
            inputField.value += char;
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
        }

        lastChar = char;
    }

    // Submit after typing the word
    inputField.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Enter', 'code': 'Enter', 'keyCode': 13 }));
};

// Is it the player's turn?
const isPlayerTurn = () => {
    const selfTurn = document.querySelector('.selfTurn');
    return !!selfTurn;
};

// Expose typer functions to global scope for userscript use
window.typer = {
    KEYBOARD_LAYOUT,
    TYPER_CONFIG,
    loadSavedSettings,
    saveSettings,
    calculateTypingDelay,
    simulateTypo,
    simulateTyping,
    isPlayerTurn
}; 