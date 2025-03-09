// typing.js - Contains typing simulation functionality

(function() {
    'use strict';

    // Helper function to check if it's player's turn
    const isPlayerTurn = () => {
        const selfTurn = document.querySelector('.selfTurn');
        return selfTurn && !selfTurn.hidden;
    };

    // Function to simulate typing with delay
    const simulateTyping = async (word) => {
        const selfTurn = document.querySelector('.selfTurn');
        const form = document.querySelector('.selfTurn form');
        const inputField = document.querySelector('.selfTurn input');
        
        if (!inputField || !form || selfTurn.hidden) {
            console.log("[BombPartySuggester] Could not find input field or not your turn");
            return;
        }

        inputField.value = '';
        inputField.focus();

        let lastChar = null;
        for (let i = 0; i < word.length; i++) {
            const madeTypo = await simulateTypo(inputField, word[i]);
            if (!madeTypo) {
                inputField.value += word[i];
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(lastChar, word[i])));
                lastChar = word[i];
            }
        }

        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    };

    // Calculate typing delay based on keyboard distance
    const calculateTypingDelay = (fromKey, toKey) => {
        if (!fromKey) return BombPartySuggesterConfig.TYPER_CONFIG.baseDelay;
        
        fromKey = fromKey.toLowerCase();
        toKey = toKey.toLowerCase();
        
        const fromPos = BombPartySuggesterConfig.KEYBOARD_LAYOUT.layout[fromKey];
        const toPos = BombPartySuggesterConfig.KEYBOARD_LAYOUT.layout[toKey];
        
        if (!fromPos || !toPos) return BombPartySuggesterConfig.TYPER_CONFIG.baseDelay;
        
        const distance = Math.sqrt(
            Math.pow(fromPos[0] - toPos[0], 2) + 
            Math.pow(fromPos[1] - toPos[1], 2)
        );
        
        const meanDelay = BombPartySuggesterConfig.TYPER_CONFIG.baseDelay + 
            (distance * BombPartySuggesterConfig.TYPER_CONFIG.distanceMultiplier);
        const stdDev = meanDelay * BombPartySuggesterConfig.TYPER_CONFIG.delayVariation;
        
        return Math.max(BombPartySuggesterConfig.TYPER_CONFIG.minDelay, 
            BombPartySuggesterConfig.normalRandom(meanDelay, stdDev));
    };

    // Simulate typos for more realistic typing
    const simulateTypo = async (inputField, correctChar) => {
        correctChar = correctChar.toLowerCase();
        if (!BombPartySuggesterConfig.KEYBOARD_LAYOUT.adjacent[correctChar]) return false;
        
        if (Math.random() > (BombPartySuggesterConfig.TYPER_CONFIG.typoChance / 100)) return false;
        
        const typoChar = BombPartySuggesterConfig.KEYBOARD_LAYOUT.adjacent[correctChar][
            Math.floor(Math.random() * BombPartySuggesterConfig.KEYBOARD_LAYOUT.adjacent[correctChar].length)
        ];
        
        inputField.value += typoChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(null, typoChar)));
        
        await new Promise(resolve => setTimeout(resolve, 
            BombPartySuggesterConfig.normalRandom(
                BombPartySuggesterConfig.TYPER_CONFIG.typoNoticeDelay.mean, 
                BombPartySuggesterConfig.TYPER_CONFIG.typoNoticeDelay.stdDev
            )));
        
        inputField.value = inputField.value.slice(0, -1);
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve,
            BombPartySuggesterConfig.normalRandom(
                BombPartySuggesterConfig.TYPER_CONFIG.typoBackspaceDelay.mean,
                BombPartySuggesterConfig.TYPER_CONFIG.typoBackspaceDelay.stdDev
            )));
        
        inputField.value += correctChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve,
            BombPartySuggesterConfig.normalRandom(
                BombPartySuggesterConfig.TYPER_CONFIG.typoRecoveryDelay.mean,
                BombPartySuggesterConfig.TYPER_CONFIG.typoRecoveryDelay.stdDev
            )));
        
        return true;
    };

    // Export typing functionality to global scope
    window.BombPartySuggesterTyping = {
        isPlayerTurn,
        simulateTyping,
        calculateTypingDelay,
        simulateTypo
    };
})(); 