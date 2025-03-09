/**
 * ui.js - UI components and functionality for Bomb Party Suggester
 */

; (function() {
    // Only define UI if it doesn't already exist (prevents redeclaration)
    if (!window.ui) {
        // Get references to other modules via window
        const { styles } = window.styles;
        const { applyStyles, makeDraggable } = window.utils;
        const { 
            TYPER_CONFIG, 
            loadSavedSettings, 
            saveSettings, 
            simulateTyping, 
            isPlayerTurn 
        } = window.typer;
        const { 
            dictionaries, 
            currentDictionary, 
            calculateRarityScore, 
            findMatchingWords, 
            sortMatches 
        } = window.dictionaries;

        // Define sort methods
        const sortMethods = {
            frequency: { label: 'Freq', title: 'Sort by frequency (most common first)' },
            length: { label: 'Len', title: 'Sort by length (longest first)' },
            rarity: { label: 'Rare', title: 'Sort by rare letters (rarest first)' }
        };

        // Store UI references
        let panel, resultsDiv, buttons = {}, sortButtons = {};

        // Current sort state
        let currentSort = {
            method: 'frequency',
            direction: 'desc'
        };

        // Create a settings input with slider
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
                Object.assign(TYPER_CONFIG, JSON.parse(JSON.stringify(defaultConfig)));

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

            // Add typing settings
            panel.appendChild(createSettingInput('Base Delay (ms)', 'baseDelay', TYPER_CONFIG.baseDelay, 10, 200, '5'));
            panel.appendChild(createSettingInput('Distance Multiplier', 'distanceMultiplier', TYPER_CONFIG.distanceMultiplier, 0, 50, '0.5'));
            panel.appendChild(createSettingInput('Minimum Delay (ms)', 'minDelay', TYPER_CONFIG.minDelay, 0, 100, '5'));
            panel.appendChild(createSettingInput('Delay Variation', 'delayVariation', TYPER_CONFIG.delayVariation, 0, 0.5, '0.05'));
            panel.appendChild(createSettingInput('Typo Chance (%)', 'typoChance', TYPER_CONFIG.typoChance, 0, 20, '0.5'));
            
            // Add typo timing settings
            panel.appendChild(createSettingInput('Notice Delay (ms)', 'typoNoticeDelay.mean', TYPER_CONFIG.typoNoticeDelay.mean, 50, 1000, '10'));
            panel.appendChild(createSettingInput('Notice Variation', 'typoNoticeDelay.stdDev', TYPER_CONFIG.typoNoticeDelay.stdDev, 0, 200, '5'));
            panel.appendChild(createSettingInput('Backspace Delay (ms)', 'typoBackspaceDelay.mean', TYPER_CONFIG.typoBackspaceDelay.mean, 50, 500, '10'));
            panel.appendChild(createSettingInput('Backspace Variation', 'typoBackspaceDelay.stdDev', TYPER_CONFIG.typoBackspaceDelay.stdDev, 0, 200, '5'));
            panel.appendChild(createSettingInput('Recovery Delay (ms)', 'typoRecoveryDelay.mean', TYPER_CONFIG.typoRecoveryDelay.mean, 50, 500, '10'));
            panel.appendChild(createSettingInput('Recovery Variation', 'typoRecoveryDelay.stdDev', TYPER_CONFIG.typoRecoveryDelay.stdDev, 0, 200, '5'));

            // Make panel draggable
            makeDraggable(panel);

            return panel;
        };

        // Create a dictionary size button
        const createSizeButton = (size) => {
            const btn = document.createElement('button');
            btn.textContent = `${size}`;
            applyStyles(btn, styles.button);

            btn.onclick = () => {
                if (!dictionaries[size].words.length) return; // don't switch if not loaded

                // Update dictionary and buttons
                window.dictionaries.currentDictionary = size;

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

            document.addEventListener('mousemove', function(e) {
                if (isDragging) {
                    const x = e.clientX - offsetX;
                    const y = e.clientY - offsetY;
                    
                    // Keep panel within viewport bounds
                    const boundedX = Math.min(Math.max(0, x), window.innerWidth - panel.offsetWidth);
                    const boundedY = Math.min(Math.max(0, y), window.innerHeight - panel.offsetHeight);
                    
                    panel.style.left = boundedX + 'px';
                    panel.style.top = boundedY + 'px';
                } else if (isResizing && currentResizer) {
                    e.preventDefault();
                    // Calculate new dimensions based on which handle/edge is being dragged
                    let newWidth, newHeight, newLeft, newTop;
                    
                    // Handle corner and edge resizing logic here
                    if (currentResizer.classList.contains('resize-se')) {
                        // Southeast (bottom-right) corner
                        newWidth = startWidth + (e.clientX - startX);
                        newHeight = startHeight + (e.clientY - startY);
                        newLeft = startLeft;
                        newTop = startTop;
                    } else if (currentResizer.classList.contains('resize-sw')) {
                        // Southwest (bottom-left) corner
                        newWidth = startWidth - (e.clientX - startX);
                        newHeight = startHeight + (e.clientY - startY);
                        newLeft = startLeft + startWidth - newWidth;
                        newTop = startTop;
                    } else if (currentResizer.classList.contains('resize-ne')) {
                        // Northeast (top-right) corner
                        newWidth = startWidth + (e.clientX - startX);
                        newHeight = startHeight - (e.clientY - startY);
                        newLeft = startLeft;
                        newTop = startTop + startHeight - newHeight;
                    } else if (currentResizer.classList.contains('resize-nw')) {
                        // Northwest (top-left) corner
                        newWidth = startWidth - (e.clientX - startX);
                        newHeight = startHeight - (e.clientY - startY);
                        newLeft = startLeft + startWidth - newWidth;
                        newTop = startTop + startHeight - newHeight;
                    }
                    
                    // Constrain dimensions
                    const constrained = constrainDimensions(newWidth, newHeight);
                    
                    // Apply constrained dimensions and position
                    panel.style.width = constrained.width + 'px';
                    panel.style.height = constrained.height + 'px';
                    
                    if (newLeft !== undefined) panel.style.left = newLeft + 'px';
                    if (newTop !== undefined) panel.style.top = newTop + 'px';
                    
                    // Update results display to fit new dimensions
                    if (resultsDiv) {
                        resultsDiv.style.height = (constrained.height - 130) + 'px';
                        resultsDiv.style.maxHeight = (constrained.height - 130) + 'px';
                    }
                }
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
                isResizing = false;
                currentResizer = null;
            });
        };

        // Suggest words based on syllable
        function suggestWords(syllable) {
            if (!resultsDiv) return;

            // Clear previous results
            resultsDiv.innerHTML = '';
            
            if (!syllable) {
                resultsDiv.textContent = 'Waiting for syllable...';
                return;
            }

            // Find matching words
            let matches = findMatchingWords(syllable, window.dictionaries.currentDictionary);

            if (matches.length === 0) {
                resultsDiv.textContent = 'No matches found';
                return;
            }

            // Sort matches according to current settings
            matches = sortMatches(matches, currentSort.method, currentSort.direction);

            // Create list of matches
            const list = document.createElement('ul');
            applyStyles(list, styles.resultsList);

            // Add words to the list
            matches.slice(0, 100).forEach(match => {
                const wordStr = typeof match === 'object' ? match.word : match;
                const li = document.createElement('li');
                applyStyles(li, styles.resultsItem);

                // Color the matching syllable
                const syllableIndex = wordStr.toLowerCase().indexOf(syllable.toLowerCase());
                const syllableEnd = syllableIndex + syllable.length;
                let html = '';
                if (syllableIndex !== -1) {
                    html += wordStr.substring(0, syllableIndex);
                    html += `<span style="color: ${styles.colors.highlight}">${wordStr.substring(syllableIndex, syllableEnd)}</span>`;
                    html += wordStr.substring(syllableEnd);
                } else {
                    html = wordStr;
                }

                // Add frequency info if available
                if (typeof match === 'object' && match.freq) {
                    html += ` <small style="color: #888">(${match.freq})</small>`;
                }

                li.innerHTML = html;

                // Add click behavior to type word
                li.onclick = () => {
                    if (isPlayerTurn()) {
                        simulateTyping(wordStr);
                    }
                };

                // Hover effects
                li.onmouseenter = () => {
                    applyStyles(li, styles.resultsItemHover);
                };
                li.onmouseleave = () => {
                    li.style.backgroundColor = '';
                };

                list.appendChild(li);
            });

            resultsDiv.appendChild(list);
        }

        // Setup observer to watch for syllable changes
        function setupSyllableObserver() {
            // Find the game container where the syllable will appear
            const gameContainer = document.getElementById('game') || document.querySelector('.game');
            if (!gameContainer) {
                console.error("[BombPartySuggester] Game container not found, retrying in 2 seconds");
                setTimeout(setupSyllableObserver, 2000);
                return;
            }

            // Function to observe syllable changes
            function observeSyllable() {
                const syllableElement = document.querySelector('.syllable');
                if (syllableElement) {
                    const syllable = syllableElement.textContent.trim();
                    suggestWords(syllable);
                }
            }

            // Set up a MutationObserver to watch for changes
            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    // Check if the syllable element was added or changed
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        observeSyllable();
                    }
                }
            });

            // Start observing
            observer.observe(gameContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });

            // Initial check for existing syllable
            observeSyllable();
            
            console.log("[BombPartySuggester] Syllable observer started");
        }

        // Create the main UI
        function createUI() {
            console.log("[BombPartySuggester] Creating UI");
            
            // Create main panel
            panel = document.createElement('div');
            panel.id = 'bombPartySuggesterPanel';
            applyStyles(panel, styles.panel);

            // Add dictionary size selector
            const sizeSelector = document.createElement('div');
            applyStyles(sizeSelector, styles.sizeSelector);

            // Create dictionary size buttons
            buttons['5k'] = createSizeButton('5k');
            buttons['20k'] = createSizeButton('20k');
            buttons['170k'] = createSizeButton('170k');

            // Default to 5k dictionary as active
            applyStyles(buttons['5k'], {...styles.button, ...styles.activeButton});

            // Add dictionary buttons to selector
            sizeSelector.appendChild(buttons['5k']);
            sizeSelector.appendChild(buttons['20k']);
            sizeSelector.appendChild(buttons['170k']);
            panel.appendChild(sizeSelector);

            // Add sort controls
            const sortControls = document.createElement('div');
            applyStyles(sortControls, styles.sortControls);

            // Create sort buttons
            Object.entries(sortMethods).forEach(([method, details]) => {
                const btn = document.createElement('button');
                btn.textContent = `${details.label} ${method === 'frequency' ? '↓' : '↑'}`;
                btn.title = details.title;
                applyStyles(btn, method === 'frequency' ? 
                    {...styles.sortButton, ...styles.activeSortButton} : 
                    styles.sortButton);

                // Set up click handler for sort direction toggle
                btn.onclick = () => {
                    if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
                        return; // Don't allow frequency sort for dictionaries without frequency
                    }

                    if (currentSort.method === method) {
                        // Toggle direction
                        updateSort(method, currentSort.direction === 'desc' ? 'asc' : 'desc');
                    } else {
                        // Change method, default to descending
                        updateSort(method, 'desc');
                    }
                };

                // Disable frequency sort for 170k dictionary which has no frequency data
                if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
                    btn.disabled = true;
                    btn.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'Frequency sorting not available for 170k dictionary';
                }

                // Store reference and add to controls
                sortButtons[method] = btn;
                sortControls.appendChild(btn);
            });

            panel.appendChild(sortControls);

            // Create and add settings button
            const settingsButton = document.createElement('button');
            settingsButton.textContent = '⚙';
            settingsButton.title = 'Typer Settings';
            applyStyles(settingsButton, styles.settingsButton);

            // Toggle settings panel visibility
            settingsButton.onclick = () => {
                const settingsPanel = document.getElementById('typerSettingsPanel');
                if (settingsPanel) {
                    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
                }
            };

            panel.appendChild(settingsButton);

            // Create results container
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'suggesterResults';
            applyStyles(resultsDiv, {
                ...styles.resultsDiv,
                height: 'calc(100% - 130px)',
                overflowY: 'auto',
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px'
            });
            resultsDiv.innerHTML = 'Waiting for syllable...';
            panel.appendChild(resultsDiv);

            // Create settings panel
            const settingsPanel = createSettingsPanel();
            document.body.appendChild(settingsPanel);

            // Add resize handles
            const resizeSE = document.createElement('div');
            resizeSE.className = 'resize-handle resize-se';
            applyStyles(resizeSE, {
                ...styles.resizeHandle,
                bottom: '0',
                right: '0',
                cursor: 'se-resize'
            });

            // Add resize dot to handle
            const resizeDotSE = document.createElement('div');
            resizeDotSE.className = 'resize-dot';
            applyStyles(resizeDotSE, styles.resizeDot);
            resizeSE.appendChild(resizeDotSE);
            panel.appendChild(resizeSE);

            // Set up draggable and resizable functionality
            setupDraggable(panel);

            // Add panel to body
            document.body.appendChild(panel);

            // Initialize with first load
            if (dictionaries[currentDictionary].words.length > 0) {
                const syllableElement = document.querySelector('.syllable');
                if (syllableElement) {
                    suggestWords(syllableElement.textContent.trim());
                }
            }
            
            console.log("[BombPartySuggester] UI initialized");
        }

        // Expose UI functions to global scope for userscript use
        window.ui = {
            createSettingInput,
            createSettingsPanel,
            createSizeButton,
            updateSort,
            setupDraggable,
            suggestWords,
            setupSyllableObserver,
            createUI
        };
    }
})(); 