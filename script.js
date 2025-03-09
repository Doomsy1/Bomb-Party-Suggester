// ==UserScript==
// @name         Bomb Party Suggester (Single UI, Frequency-Sorted)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hooks the WebSocket to auto-detect the current syllable, preloads a frequency-based dictionary, and displays suggestions sorted by popularity.
// @match        *.jklm.fun/games/bombparty*
// @grant        none
// @run-at       document-start
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

    // Define styles centrally for better organization and maintenance
    const styles = {
        colors: {
            primary: '#61dafb',
            background: '#282c34',
            text: '#ffffff',
            highlight: '#2EFF2E', // brighter green
            special: '#FF8C00' // orange for special letters
        },
        panel: {
            position: 'fixed',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(40, 44, 52, 0.5)',
            border: '2px solid #61dafb',
            borderRadius: '8px',
            padding: '10px',
            zIndex: '2147483647',
            maxWidth: '500px',
            minWidth: '200px',
            minHeight: '150px',
            maxHeight: '800px',
            width: '300px', // default width
            height: '400px', // default height
            fontFamily: 'sans-serif',
            fontSize: '14px',
            color: '#fff',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.5)',
            cursor: 'move',
            resize: 'none',
            overflow: 'hidden'
        },
        resizeHandle: {
            position: 'absolute',
            width: '20px', // larger hitbox
            height: '20px', // larger hitbox
            background: 'transparent', // transparent background for larger hitbox
            zIndex: '2147483647',
            cursor: 'nw-resize'
        },
        resizeDot: {
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#61dafb',
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        },
        resizeEdge: {
            position: 'absolute',
            background: 'transparent',
            zIndex: '2147483647'
        },
        sizeSelector: {
            marginBottom: '4px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
        },
        sortControls: {
            marginBottom: '8px',
            display: 'flex',
            gap: '8px', // increased gap for better spacing
            justifyContent: 'center',
            flexWrap: 'wrap'
        },
        sortButton: {
            padding: '4px 8px',
            border: '1px solid #61dafb',
            borderRadius: '4px',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        activeSortButton: {
            background: '#61dafb',
            color: '#282c34'
        },
        button: {
            padding: '4px 8px',
            border: '1px solid #61dafb',
            borderRadius: '4px',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer'
        },
        activeButton: {
            background: '#61dafb',
            color: '#282c34'
        },
        resultsList: {
            listStyle: 'none',
            padding: '0',
            margin: '0'
        },
        resultsItem: {
            padding: '4px 0',
            textAlign: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            borderRadius: '4px'
        },
        resultsItemHover: {
            backgroundColor: 'rgba(97, 218, 251, 0.2)'
        },
        resultsItemDisabled: {
            backgroundColor: 'rgba(220, 53, 69, 0.2)' // dulled red background
        },
        resultsDiv: {
            height: 'auto',
            overflowY: 'visible',
            marginTop: '8px'
        },
        settingsButton: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 8px',
            border: '1px solid #61dafb',
            borderRadius: '4px',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
        },
        settingsPanel: {
            position: 'fixed',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(40, 44, 52, 0.9)',
            border: '2px solid #61dafb',
            borderRadius: '8px',
            padding: '12px',
            zIndex: '2147483647',
            width: '220px',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontSize: '12px',
            cursor: 'move',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.5)'
        },
        settingsGroup: {
            marginBottom: '8px',
            display: 'flex',
            flexDirection: 'column'
        },
        settingsLabel: {
            display: 'block',
            marginBottom: '2px',
            color: '#61dafb',
            fontSize: '11px'
        },
        settingsInputGroup: {
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
        },
        settingsInput: {
            width: '50px',
            padding: '2px 4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid #61dafb',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '11px'
        },
        settingsSlider: {
            flex: 1,
            height: '4px',
            WebkitAppearance: 'none',
            background: 'rgba(97, 218, 251, 0.2)',
            borderRadius: '2px',
            outline: 'none'
        }
    };

    // Helper function to apply styles to an element
    const applyStyles = (element, styleObj) => {
        Object.assign(element.style, styleObj);
    };

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

    // Helper function for normal distribution
    const normalRandom = (mean, stdDev) => {
        // Box-Muller transform for normal distribution
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

    // Load saved settings immediately after defining default config
    loadSavedSettings();

    // Helper function to create a settings input with slider
    const createSettingInput = (label, key, value, min = 0, max = 100, step = '1') => {
        const group = document.createElement('div');
        applyStyles(group, styles.settingsGroup);

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        applyStyles(labelEl, styles.settingsLabel);
        group.appendChild(labelEl);

        const inputGroup = document.createElement('div');
        applyStyles(inputGroup, styles.settingsInputGroup);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        applyStyles(slider, styles.settingsSlider);

        const input = document.createElement('input');
        input.type = 'number';
        input.value = value;
        input.step = step;
        input.min = min;
        input.max = max;
        applyStyles(input, styles.settingsInput);

        const updateValue = (newValue) => {
            const path = key.split('.');
            let target = TYPER_CONFIG;
            for (let i = 0; i < path.length - 1; i++) {
                target = target[path[i]];
            }
            target[path[path.length - 1]] = parseFloat(newValue);
            slider.value = newValue;
            input.value = newValue;
            saveSettings(); // Save settings whenever a value changes
        };

        slider.oninput = () => updateValue(slider.value);
        input.onchange = () => updateValue(input.value);

        inputGroup.appendChild(slider);
        inputGroup.appendChild(input);
        group.appendChild(inputGroup);
        return group;
    };

    // Helper function to make an element draggable
    const makeDraggable = (element) => {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        const dragStart = (e) => {
            // Don't start drag if clicking on a button or input
            if (e.target.tagName.toLowerCase() === 'button' || 
                e.target.tagName.toLowerCase() === 'input') {
                return;
            }
            isDragging = true;
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;
            e.preventDefault();
        };

        const dragEnd = () => {
            isDragging = false;
        };

        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Keep panel within viewport bounds
            currentX = Math.min(Math.max(0, currentX), window.innerWidth - element.offsetWidth);
            currentY = Math.min(Math.max(0, currentY), window.innerHeight - element.offsetHeight);

            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
        };

        element.addEventListener('mousedown', dragStart);
        element.addEventListener('mousemove', drag);
        element.addEventListener('mouseup', dragEnd);
        element.addEventListener('mouseleave', dragEnd);
    };

    // Create settings panel
    const createSettingsPanel = () => {
        const panel = document.createElement('div');
        panel.id = 'typerSettingsPanel';
        applyStyles(panel, styles.settingsPanel);
        panel.style.display = 'none';

        // Create header container
        const headerContainer = document.createElement('div');
        applyStyles(headerContainer, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
        });

        const title = document.createElement('h3');
        title.textContent = 'Typer Settings';
        title.style.margin = '0';
        title.style.color = '#61dafb';
        title.style.fontSize = '14px';
        headerContainer.appendChild(title);

        // Add reset button to header
        const resetButton = document.createElement('button');
        resetButton.textContent = '↺';
        resetButton.title = 'Reset to defaults';
        applyStyles(resetButton, {
            ...styles.button,
            padding: '2px 6px',
            fontSize: '14px',
            marginLeft: '8px',
            backgroundColor: 'transparent'
        });
        
        resetButton.onmouseenter = () => {
            resetButton.style.backgroundColor = 'rgba(97, 218, 251, 0.2)';
        };
        
        resetButton.onmouseleave = () => {
            resetButton.style.backgroundColor = 'transparent';
        };
        
        resetButton.onclick = () => {
            // Define the default configuration
            const defaultConfig = {
                baseDelay: 60,
                distanceMultiplier: 12.5,
                minDelay: 15,
                delayVariation: 0.2,
                typoChance: 2,
                typoNoticeDelay: { mean: 250, stdDev: 60 },
                typoBackspaceDelay: { mean: 100, stdDev: 40 },
                typoRecoveryDelay: { mean: 200, stdDev: 50 }
            };

            // Create a fresh TYPER_CONFIG object
            window.TYPER_CONFIG = JSON.parse(JSON.stringify(defaultConfig));

            // Get all input groups
            const inputGroups = panel.querySelectorAll('.settingsGroup');
            
            // Map of labels to config paths
            const labelToConfigPath = {
                'Base Delay (ms)': ['baseDelay'],
                'Distance Multiplier': ['distanceMultiplier'],
                'Minimum Delay (ms)': ['minDelay'],
                'Delay Variation': ['delayVariation'],
                'Typo Chance (%)': ['typoChance'],
                'Notice Delay (ms)': ['typoNoticeDelay', 'mean'],
                'Notice Variation': ['typoNoticeDelay', 'stdDev'],
                'Backspace Delay (ms)': ['typoBackspaceDelay', 'mean'],
                'Backspace Variation': ['typoBackspaceDelay', 'stdDev'],
                'Recovery Delay (ms)': ['typoRecoveryDelay', 'mean'],
                'Recovery Variation': ['typoRecoveryDelay', 'stdDev']
            };

            // Update each input group
            inputGroups.forEach(group => {
                const label = group.querySelector('label').textContent;
                const slider = group.querySelector('input[type="range"]');
                const input = group.querySelector('input[type="number"]');
                
                // Get the config path for this label
                const configPath = labelToConfigPath[label];
                if (!configPath) return;

                // Get the value from the default config
                let value = defaultConfig;
                for (const key of configPath) {
                    value = value[key];
                }

                // Update the inputs
                if (typeof value === 'number') {
                    slider.value = value;
                    input.value = value;

                    // Trigger events
                    const event = new Event('input', { bubbles: true });
                    slider.dispatchEvent(event);
                    input.dispatchEvent(event);
                }
            });

            // Save to localStorage
            saveSettings();
            
            console.log("[BombPartySuggester] Settings reset to defaults:", TYPER_CONFIG);
        };
        
        headerContainer.appendChild(resetButton);
        panel.appendChild(headerContainer);

        // Add all settings with appropriate min/max values
        panel.appendChild(createSettingInput('Base Delay (ms)', 'baseDelay', TYPER_CONFIG.baseDelay, 0, 100, 1));
        panel.appendChild(createSettingInput('Distance Multiplier', 'distanceMultiplier', TYPER_CONFIG.distanceMultiplier, 0, 20, 0.1));
        panel.appendChild(createSettingInput('Minimum Delay (ms)', 'minDelay', TYPER_CONFIG.minDelay, 0, 50, 1));
        panel.appendChild(createSettingInput('Delay Variation', 'delayVariation', TYPER_CONFIG.delayVariation, 0, 1, 0.01));
        panel.appendChild(createSettingInput('Typo Chance (%)', 'typoChance', TYPER_CONFIG.typoChance, 0, 10, 0.1));
        panel.appendChild(createSettingInput('Notice Delay (ms)', 'typoNoticeDelay.mean', TYPER_CONFIG.typoNoticeDelay.mean, 0, 1000, 10));
        panel.appendChild(createSettingInput('Notice Variation', 'typoNoticeDelay.stdDev', TYPER_CONFIG.typoNoticeDelay.stdDev, 0, 200, 5));
        panel.appendChild(createSettingInput('Backspace Delay (ms)', 'typoBackspaceDelay.mean', TYPER_CONFIG.typoBackspaceDelay.mean, 0, 500, 10));
        panel.appendChild(createSettingInput('Backspace Variation', 'typoBackspaceDelay.stdDev', TYPER_CONFIG.typoBackspaceDelay.stdDev, 0, 100, 5));
        panel.appendChild(createSettingInput('Recovery Delay (ms)', 'typoRecoveryDelay.mean', TYPER_CONFIG.typoRecoveryDelay.mean, 0, 500, 10));
        panel.appendChild(createSettingInput('Recovery Variation', 'typoRecoveryDelay.stdDev', TYPER_CONFIG.typoRecoveryDelay.stdDev, 0, 100, 5));

        document.body.appendChild(panel);
        makeDraggable(panel);
        return panel;
    };

    // Update the calculateTypingDelay function to use config
    const calculateTypingDelay = (fromKey, toKey) => {
        if (!fromKey) return TYPER_CONFIG.baseDelay;
        
        fromKey = fromKey.toLowerCase();
        toKey = toKey.toLowerCase();
        
        const fromPos = KEYBOARD_LAYOUT.layout[fromKey];
        const toPos = KEYBOARD_LAYOUT.layout[toKey];
        
        if (!fromPos || !toPos) return TYPER_CONFIG.baseDelay;
        
        const distance = Math.sqrt(
            Math.pow(fromPos[0] - toPos[0], 2) + 
            Math.pow(fromPos[1] - toPos[1], 2)
        );
        
        const meanDelay = TYPER_CONFIG.baseDelay + (distance * TYPER_CONFIG.distanceMultiplier);
        const stdDev = meanDelay * TYPER_CONFIG.delayVariation;
        
        return Math.max(TYPER_CONFIG.minDelay, normalRandom(meanDelay, stdDev));
    };

    // Update the simulateTypo function to use config
    const simulateTypo = async (inputField, correctChar) => {
        correctChar = correctChar.toLowerCase();
        if (!KEYBOARD_LAYOUT.adjacent[correctChar]) return false;
        
        if (Math.random() > (TYPER_CONFIG.typoChance / 100)) return false;
        
        const typoChar = KEYBOARD_LAYOUT.adjacent[correctChar][
            Math.floor(Math.random() * KEYBOARD_LAYOUT.adjacent[correctChar].length)
        ];
        
        inputField.value += typoChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(null, typoChar)));
        
        await new Promise(resolve => setTimeout(resolve, 
            normalRandom(TYPER_CONFIG.typoNoticeDelay.mean, TYPER_CONFIG.typoNoticeDelay.stdDev)));
        
        inputField.value = inputField.value.slice(0, -1);
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve,
            normalRandom(TYPER_CONFIG.typoBackspaceDelay.mean, TYPER_CONFIG.typoBackspaceDelay.stdDev)));
        
        inputField.value += correctChar;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve,
            normalRandom(TYPER_CONFIG.typoRecoveryDelay.mean, TYPER_CONFIG.typoRecoveryDelay.stdDev)));
        
        return true;
    };

    // Function to simulate typing with delay
    const simulateTyping = async (word) => {
        // find the game's input field and form
        const selfTurn = document.querySelector('.selfTurn');
        const form = document.querySelector('.selfTurn form');
        const inputField = document.querySelector('.selfTurn input');
        
        if (!inputField || !form || selfTurn.hidden) {
            console.log("[BombPartySuggester] Could not find input field or not your turn");
            return;
        }

        // clear the input field
        inputField.value = '';
        inputField.focus();

        let lastChar = null;
        // type each letter with dynamic delay
        for (let i = 0; i < word.length; i++) {
            // Try to make a typo
            const madeTypo = await simulateTypo(inputField, word[i]);
            if (!madeTypo) {
                // If no typo, type normally
                inputField.value += word[i];
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(lastChar, word[i])));
                lastChar = word[i];
            }
        }

        // submit the form (this is how the game actually handles word submission)
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    };

    // Helper function to check if it's player's turn
    const isPlayerTurn = () => {
        const selfTurn = document.querySelector('.selfTurn');
        return selfTurn && !selfTurn.hidden;
    };

    // Wait for DOM to be ready
    function initScript() {
        // Avoid duplicates by checking if panel already exists
        if (document.getElementById('bombPartyWordSuggesterPanel')) {
            console.log("[BombPartySuggester] UI already exists, skipping.");
            return;
        }

        // Dictionary setup
        const dictionaries = {
            '5k': { url: 'https://raw.githubusercontent.com/filiph/english_words/master/data/word-freq-top5000.csv', words: [], hasFrequency: true },
            '20k': { url: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt', words: [], hasFrequency: true },
            '170k': { url: 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt', words: [], hasFrequency: false }
        };
        let currentDictionary = '20k';
        let dictionaryLoaded = false;
        let syllableObserver = null;

        // Create UI components
        const createUI = () => {
            // Main panel
            const panel = document.createElement('div');
            panel.id = 'bombPartyWordSuggesterPanel';
            applyStyles(panel, styles.panel);

            // Add resize handles (corners and edges)
            const positions = [
                // Corners
                { type: 'corner', corner: 'nw', top: '-10px', left: '-10px', cursor: 'nw-resize' },
                { type: 'corner', corner: 'ne', top: '-10px', right: '-10px', cursor: 'ne-resize' },
                { type: 'corner', corner: 'se', bottom: '-10px', right: '-10px', cursor: 'se-resize' },
                { type: 'corner', corner: 'sw', bottom: '-10px', left: '-10px', cursor: 'sw-resize' },
                // Edges
                { type: 'edge', edge: 'n', top: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
                { type: 'edge', edge: 's', bottom: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
                { type: 'edge', edge: 'e', top: '20px', right: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' },
                { type: 'edge', edge: 'w', top: '20px', left: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' }
            ];

            positions.forEach(pos => {
                if (pos.type === 'corner') {
                    const handle = document.createElement('div');
                    handle.className = `resize-handle ${pos.corner}`;
                    applyStyles(handle, {
                        ...styles.resizeHandle,
                        ...pos
                    });
                    
                    // Add visible dot in center of handle
                    const dot = document.createElement('div');
                    applyStyles(dot, styles.resizeDot);
                    handle.appendChild(dot);
                    
                    panel.appendChild(handle);
                } else { // edge
                    const edge = document.createElement('div');
                    edge.className = `resize-edge ${pos.edge}`;
                    applyStyles(edge, {
                        ...styles.resizeEdge,
                        ...pos
                    });
                    panel.appendChild(edge);
                }
            });

            // Content container
            const contentContainer = document.createElement('div');
            contentContainer.id = 'bombPartyWordSuggesterContent';
            panel.appendChild(contentContainer);

            // Dictionary size selector
            const sizeSelector = document.createElement('div');
            applyStyles(sizeSelector, styles.sizeSelector);
            
            // Create size buttons
            const buttons = {};
            ['5k', '20k', '170k'].forEach(size => {
                buttons[size] = createSizeButton(size);
                // Add tooltip for the large dictionary
                if (size === '170k') {
                    buttons[size].title = 'ENABLE dictionary with 170,000 words';
                }
                sizeSelector.appendChild(buttons[size]);
            });
            
            contentContainer.appendChild(sizeSelector);

            // Sort controls
            const sortControls = document.createElement('div');
            applyStyles(sortControls, styles.sortControls);

            // Sort methods
            const sortMethods = {
                frequency: { label: 'Freq' },
                length: { label: 'Len' },
                rarity: { label: 'Rare' }
            };

            // Create sort buttons
            const sortButtons = {};
            Object.entries(sortMethods).forEach(([method, { label }]) => {
                const button = document.createElement('button');
                button.textContent = `${label} ↑`;
                
                applyStyles(button, styles.sortButton);
                
                let isAscending = true;
                button.onclick = () => {
                    // Don't do anything if the button is disabled
                    if (button.disabled) return;
                    
                    // Reset all buttons
                    Object.values(sortButtons).forEach(btn => {
                        applyStyles(btn, styles.sortButton);
                        // Reset arrow for non-active buttons
                        if (btn !== button) {
                            btn.textContent = btn.textContent.replace(/[↑↓]/, '↑');
                        }
                    });
                    
                    // Toggle direction if it's the same method
                    if (currentSort.method === method) {
                        isAscending = !isAscending;
                    } else {
                        isAscending = true;
                    }
                    
                    // Update button text and style
                    button.textContent = `${label} ${isAscending ? '↓' : '↑'}`;
                    applyStyles(button, {...styles.sortButton, ...styles.activeSortButton});
                    
                    // Update sort state
                    updateSort(method, isAscending ? 'desc' : 'asc');
                };
                
                sortButtons[method] = button;
                sortControls.appendChild(button);
                
                // Initially disable frequency button if using the 170k dictionary
                if (method === 'frequency' && currentDictionary === '170k') {
                    button.disabled = true;
                    button.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    button.style.cursor = 'not-allowed';
                    button.title = 'Frequency sorting not available for 170k dictionary';
                }
            });
            
            contentContainer.appendChild(sortControls);

            // Results container
            const resultsDiv = document.createElement('div');
            applyStyles(resultsDiv, styles.resultsDiv);
            resultsDiv.textContent = '(Waiting for syllable...)';
            contentContainer.appendChild(resultsDiv);

            // Add settings button
            const settingsButton = document.createElement('button');
            settingsButton.textContent = '⚙️';
            applyStyles(settingsButton, styles.settingsButton);
            
            const settingsPanel = createSettingsPanel();
            
            settingsButton.onclick = () => {
                settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
            };
            
            panel.appendChild(settingsButton);

            // Add panel to document
            document.body.appendChild(panel);

            // Set initial button states
            applyStyles(buttons['20k'], {...styles.button, ...styles.activeButton});
            applyStyles(sortButtons.frequency, {...styles.sortButton, ...styles.activeSortButton});
            sortButtons.frequency.textContent = 'Freq ↓'; // Set initial arrow

            // Make panel draggable
            setupDraggable(panel);

            return { panel, resultsDiv, buttons, sortButtons };
        };

        // Current sort state
        let currentSort = {
            method: 'frequency',
            direction: 'desc'
        };

        // Letter rarity scoring (1 for most common, 26 for least common)
        const letterScores = {
            'e': 1, 't': 2, 'a': 3, 'o': 4, 'i': 5, 'n': 6, 's': 7, 'h': 8, 'r': 9, 'd': 10,
            'l': 11, 'u': 12, 'c': 13, 'm': 14, 'w': 15, 'f': 16, 'g': 17, 'y': 18, 'p': 19,
            'b': 20, 'v': 21, 'k': 22, 'j': 23, 'x': 24, 'q': 25, 'z': 26
        };

        // Calculate word rarity score
        function calculateRarityScore(word) {
            return word.toLowerCase().split('').reduce((score, letter) => {
                return score + (letterScores[letter] || 13); // default to middle score for unknown characters
            }, 0);
        }

        // Update sort state and UI
        function updateSort(method, direction) {
            // If the current dictionary doesn't have frequency data and method is frequency,
            // switch to length sort
            if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
                console.log("[BombPartySuggester] Switching from frequency to length sort (no frequency data available)");
                method = 'length';
            }
            
            // Update sort state
            currentSort.method = method;
            currentSort.direction = direction;
            
            // Update sort button UI
            Object.entries(sortButtons).forEach(([buttonMethod, button]) => {
                // Always ensure frequency button is hidden for 170k dictionary
                if (buttonMethod === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
                    button.style.display = 'none';
                }
                
                // Update button styles and arrows
                if (buttonMethod === method) {
                    applyStyles(button, {...styles.sortButton, ...styles.activeSortButton});
                    button.textContent = `${sortMethods[buttonMethod].label} ${direction === 'desc' ? '↓' : '↑'}`;
                } else {
                    applyStyles(button, styles.sortButton);
                    button.textContent = `${sortMethods[buttonMethod].label} ↑`;
                }
            });
            
            // Re-sort current results
            const syllableElement = document.querySelector('.syllable');
            if (syllableElement) {
                suggestWords(syllableElement.textContent.trim());
            }
        }

        // Sort matches based on current sort settings
        function sortMatches(matches) {
            const { method, direction } = currentSort;
            
            // If trying to sort by frequency but dictionary doesn't support it,
            // fall back to length sort
            let sortMethod = method;
            if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
                sortMethod = 'length';
            }
            
            const sortFunctions = {
                frequency: (a, b) => b.freq - a.freq,
                length: (a, b) => b.word.length - a.word.length,
                rarity: (a, b) => {
                    const scoreA = calculateRarityScore(a.word);
                    const scoreB = calculateRarityScore(b.word);
                    return scoreB - scoreA;
                }
            };
            
            const sortFn = sortFunctions[sortMethod];
            matches.sort(direction === 'desc' ? sortFn : (a, b) => -sortFn(a, b));
            
            return matches;
        }

        // Create a dictionary size button
        const createSizeButton = (size) => {
            const btn = document.createElement('button');
            btn.textContent = `${size}`;
            applyStyles(btn, styles.button);
            
            btn.onclick = () => {
                if (!dictionaries[size].words.length) return; // don't switch if not loaded
                
                // Update dictionary and buttons
                currentDictionary = size;
                
                // Reset all dictionary buttons first
                Object.values(buttons).forEach(button => {
                    applyStyles(button, styles.button);
                });
                
                // Set only the clicked button as active
                applyStyles(btn, {...styles.button, ...styles.activeButton});
                
                // Update sort buttons visibility based on dictionary frequency support
                const freqButton = sortButtons.frequency;
                if (dictionaries[size].hasFrequency) {
                    freqButton.disabled = false;
                    freqButton.style.backgroundColor = 'transparent';
                    freqButton.style.cursor = 'pointer';
                    freqButton.title = '';
                } else {
                    freqButton.disabled = true;
                    freqButton.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    freqButton.style.cursor = 'not-allowed';
                    freqButton.title = 'Frequency sorting not available for 170k dictionary';
                    if (currentSort.method === 'frequency') {
                        // Reset all sort buttons
                        Object.values(sortButtons).forEach(sortBtn => {
                            applyStyles(sortBtn, styles.sortButton);
                            sortBtn.textContent = sortBtn.textContent.replace(/[↑↓]/, '↑');
                        });
                        
                        // Set length as active
                        applyStyles(sortButtons.length, {...styles.sortButton, ...styles.activeSortButton});
                        sortButtons.length.textContent = 'Len ↓';
                        currentSort.method = 'length';
                        currentSort.direction = 'desc';
                    }
                }
                
                // Update suggestions with new dictionary
                const syllableElement = document.querySelector('.syllable');
                if (syllableElement) {
                    suggestWords(syllableElement.textContent.trim());
                }
            };
            
            // Prevent dragging when interacting with buttons
            btn.onmousedown = (e) => {
                e.stopPropagation();
            };
            
            return btn;
        };

        // Setup draggable functionality for panel
        const setupDraggable = (panel) => {
            let isDragging = false;
            let isResizing = false;
            let offsetX = 0;
            let offsetY = 0;
            let currentResizer = null;
            let startWidth = 0;
            let startHeight = 0;
            let startX = 0;
            let startY = 0;
            let startLeft = 0;
            let startTop = 0;

            const maxWidth = parseInt(styles.panel.maxWidth);
            const minWidth = parseInt(styles.panel.minWidth);
            const minHeight = parseInt(styles.panel.minHeight);
            const maxHeight = parseInt(styles.panel.maxHeight);

            function constrainDimensions(width, height) {
                return {
                    width: Math.min(maxWidth, Math.max(minWidth, width)),
                    height: Math.min(maxHeight, Math.max(minHeight, height))
                };
            }

            // Handle mouse down for dragging
            panel.onmousedown = function(e) {
                if (e.target.classList?.contains('resize-handle') || e.target.classList?.contains('resize-edge')) {
                    return;
                }
                isDragging = true;
                offsetX = e.clientX - panel.getBoundingClientRect().left;
                offsetY = e.clientY - panel.getBoundingClientRect().top;
                e.preventDefault();
            };

            // Handle resize start for both corners and edges
            const resizers = [...panel.querySelectorAll('.resize-handle'), ...panel.querySelectorAll('.resize-edge')];
            resizers.forEach(resizer => {
                resizer.onmousedown = function(e) {
                    isResizing = true;
                    currentResizer = resizer;
                    const rect = panel.getBoundingClientRect();
                    startWidth = rect.width;
                    startHeight = rect.height;
                    startX = e.clientX;
                    startY = e.clientY;
                    startLeft = rect.left;
                    startTop = rect.top;
                    e.preventDefault();
                    e.stopPropagation();
                };
            });

            panel.addEventListener('mousemove', function(e) {
                if (isDragging) {
                    const newLeft = e.clientX - offsetX;
                    const newTop = e.clientY - offsetY;
                    
                    // Keep panel within viewport bounds
                    const maxLeft = window.innerWidth - panel.offsetWidth;
                    const maxTop = window.innerHeight - panel.offsetHeight;
                    
                    panel.style.left = Math.min(maxLeft, Math.max(0, newLeft)) + 'px';
                    panel.style.top = Math.min(maxTop, Math.max(0, newTop)) + 'px';
                    panel.style.right = 'auto';
                }
            });

            document.addEventListener('mousemove', function(e) {
                if (isResizing && currentResizer) {
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    
                    const isCorner = currentResizer.classList.contains('resize-handle');
                    const direction = isCorner ? 
                        currentResizer.classList[1] : 
                        currentResizer.classList[1];

                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    let newLeft = startLeft;
                    let newTop = startTop;

                    if (isCorner) {
                        switch (direction) {
                            case 'nw':
                                newWidth = startWidth - dx;
                                newHeight = startHeight - dy;
                                break;
                            case 'ne':
                                newWidth = startWidth + dx;
                                newHeight = startHeight - dy;
                                break;
                            case 'se':
                                newWidth = startWidth + dx;
                                newHeight = startHeight + dy;
                                break;
                            case 'sw':
                                newWidth = startWidth - dx;
                                newHeight = startHeight + dy;
                                break;
                        }
                    } else {
                        switch (direction) {
                            case 'n':
                                newHeight = startHeight - dy;
                                break;
                            case 's':
                                newHeight = startHeight + dy;
                                break;
                            case 'e':
                                newWidth = startWidth + dx;
                                break;
                            case 'w':
                                newWidth = startWidth - dx;
                                break;
                        }
                    }

                    // Apply constraints
                    const constrained = constrainDimensions(newWidth, newHeight);
                    newWidth = constrained.width;
                    newHeight = constrained.height;

                    // Calculate position adjustments
                    if (direction.includes('w')) {
                        newLeft = startLeft + (startWidth - newWidth);
                    }
                    if (direction.includes('n')) {
                        newTop = startTop + (startHeight - newHeight);
                    }

                    // Keep panel within viewport bounds
                    const maxLeft = window.innerWidth - newWidth;
                    const maxTop = window.innerHeight - newHeight;
                    newLeft = Math.min(maxLeft, Math.max(0, newLeft));
                    newTop = Math.min(maxTop, Math.max(0, newTop));

                    // Apply all changes at once
                    panel.style.width = newWidth + 'px';
                    panel.style.height = newHeight + 'px';
                    panel.style.left = newLeft + 'px';
                    panel.style.top = newTop + 'px';

                    // Scale text to fit
                    const fontSize = Math.max(12, Math.min(18, newWidth / 20));
                    panel.style.fontSize = fontSize + 'px';
                }
            });

            panel.addEventListener('mouseup', function() {
                isDragging = false;
            });

            panel.addEventListener('mouseleave', function() {
                isDragging = false;
            });

            document.addEventListener('mouseup', function() {
                isResizing = false;
                currentResizer = null;
            });

            // Initial size and position
            const rect = panel.getBoundingClientRect();
            const constrained = constrainDimensions(rect.width, rect.height);
            panel.style.width = constrained.width + 'px';
            panel.style.height = constrained.height + 'px';
        };

        // Create UI elements
        const { resultsDiv, buttons, sortButtons } = createUI();

        // Word suggestion function
        function suggestWords(syllable) {
            if (!dictionaries[currentDictionary].words.length) {
                resultsDiv.textContent = 'Dictionary not ready yet...';
                return;
            }
            if (!syllable) {
                resultsDiv.textContent = 'Waiting for syllable...';
                return;
            }

            const lower = syllable.toLowerCase();
            let matches = dictionaries[currentDictionary].words.filter(entry =>
                entry.word.toLowerCase().includes(lower)
            );
            
            // Apply current sort
            matches = sortMatches(matches);

            if (matches.length === 0) {
                resultsDiv.textContent = 'No suggestions found.';
                return;
            }

            const ul = document.createElement('ul');
            applyStyles(ul, styles.resultsList);
            
            matches.slice(0, 15).forEach(({ word }) => {
                const li = document.createElement('li');
                applyStyles(li, styles.resultsItem);
                
                // Add hover effect based on turn state
                li.onmouseenter = () => {
                    if (isPlayerTurn()) {
                        applyStyles(li, styles.resultsItemHover);
                    } else {
                        applyStyles(li, styles.resultsItemDisabled);
                    }
                };
                li.onmouseleave = () => {
                    applyStyles(li, { backgroundColor: 'transparent' });
                };
                
                // Add click handler
                li.onclick = () => {
                    if (isPlayerTurn()) {
                        simulateTyping(word);
                    }
                };
                
                // Highlight the matching syllable and special letters
                const wordLower = word.toLowerCase();
                const syllableLower = lower;
                const index = wordLower.indexOf(syllableLower);
                
                // Special letters to highlight
                const specialLetters = ['v', 'k', 'j', 'x', 'q', 'z', 'w'];
                
                if (index !== -1) {
                    let result = '';
                    let i = 0;
                    while (i < word.length) {
                        if (i === index) {
                            // Highlight matching syllable
                            result += `<span style="color: ${styles.colors.highlight}">${word.slice(index, index + syllableLower.length)}</span>`;
                            i += syllableLower.length;
                        } else {
                            // Check for special letters
                            const currentLetter = word[i].toLowerCase();
                            if (specialLetters.includes(currentLetter)) {
                                result += `<span style="color: ${styles.colors.special}">${word[i]}</span>`;
                            } else {
                                result += word[i];
                            }
                            i++;
                        }
                    }
                    li.innerHTML = result;
                } else {
                    // If no syllable match, still highlight special letters
                    let result = '';
                    for (let i = 0; i < word.length; i++) {
                        const currentLetter = word[i].toLowerCase();
                        if (specialLetters.includes(currentLetter)) {
                            result += `<span style="color: ${styles.colors.special}">${word[i]}</span>`;
                        } else {
                            result += word[i];
                        }
                    }
                    li.innerHTML = result;
                }
                
                ul.appendChild(li);
            });
            
            resultsDiv.innerHTML = '';
            resultsDiv.appendChild(ul);
        }

        // Function to find and observe the syllable element
        function setupSyllableObserver() {
            // Don't create multiple observers
            if (syllableObserver) {
                return;
            }

            // The syllable is typically shown in an element with class 'syllable'
            syllableObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const syllable = mutation.target.textContent.trim();
                        if (syllable) {
                            suggestWords(syllable);
                        }
                    }
                }
            });

            // Function to start observing syllable element
            function observeSyllable() {
                const syllableElement = document.querySelector('.syllable');
                if (syllableElement) {
                    syllableObserver.observe(syllableElement, {
                        childList: true,
                        characterData: true,
                        subtree: true
                    });
                    // Initial check
                    const syllable = syllableElement.textContent.trim();
                    if (syllable) {
                        suggestWords(syllable);
                    }
                } else {
                    // If element not found, retry after a short delay
                    setTimeout(observeSyllable, 1000);
                }
            }

            // Start observing
            observeSyllable();
        }

        // Function to load a single dictionary
        function loadDictionary(size) {
            return fetch(dictionaries[size].url)
                .then(response => response.text())
                .then(text => {
                    const lines = text.split('\n');

                    // Handle different dictionary formats
                    if (dictionaries[size].url.endsWith('.csv')) {
                        // csv format (5k dictionary)
                        const dataLines = lines.slice(1); // skip header
                        dictionaries[size].words = dataLines.map(line => {
                            const trimmed = line.trim();
                            if (!trimmed) return { word: '', freq: 0 };
                            const parts = trimmed.split(',');
                            if (parts.length < 4) return { word: '', freq: 0 };
                            const word = parts[1] || '';
                            const freq = parseInt(parts[3], 10) || 0;
                            return { word, freq };
                        });
                    } else if (size === '170k') {
                        // Efficiently process the large ENABLE dictionary
                        console.log(`[BombPartySuggester] Processing ${size} dictionary with ${lines.length} words...`);
                        
                        // For the large dictionary, we use simpler objects with just the word
                        // to reduce memory usage and improve performance
                        dictionaries[size].words = lines
                            .filter(line => line.trim().length > 0)
                            .map(line => ({
                                word: line.trim().toLowerCase(),
                                freq: 1  // All words have same frequency
                            }));
                    } else {
                        // txt format (20k dictionary)
                        dictionaries[size].words = lines.map((line, index) => ({
                            word: line.trim(),
                            freq: lines.length - index // use reverse index as frequency
                        }));
                    }

                    dictionaries[size].words = dictionaries[size].words.filter(entry =>
                        entry.word && entry.word.length > 0
                    );
                    console.log(`[BombPartySuggester] Dictionary ${size} loaded: ${dictionaries[size].words.length} words.`);
                });
        }

        // Load all dictionaries at startup
        Promise.all([
            loadDictionary('5k'),
            loadDictionary('20k'),
            loadDictionary('170k')
        ]).then(() => {
            dictionaryLoaded = true;
            // Start observing for syllable changes
            setupSyllableObserver();
        }).catch(err => {
            console.error("[BombPartySuggester] Error loading dictionaries:", err);
            // Try to setup observer even if dictionaries fail
            setupSyllableObserver();
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScript);
    } else {
        initScript();
    }
})();