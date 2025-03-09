// ui.js - Contains UI components and functionality

(function() {
    'use strict';

    let currentDictionary = '20k';
    let currentSort = {
        method: 'frequency',
        direction: 'desc'
    };

    let buttons = {};
    let sortButtons = {};
    let resultsDiv;

    // Create UI components
    const createUI = () => {
        // Main panel
        const panel = document.createElement('div');
        panel.id = 'bombPartyWordSuggesterPanel';
        BombPartySuggesterStyles.applyStyles(panel, BombPartySuggesterStyles.styles.panel);

        // Add resize handles
        setupResizeHandles(panel);

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.id = 'bombPartyWordSuggesterContent';
        panel.appendChild(contentContainer);

        // Dictionary size selector
        const sizeSelector = document.createElement('div');
        BombPartySuggesterStyles.applyStyles(sizeSelector, BombPartySuggesterStyles.styles.sizeSelector);
        
        // Create size buttons
        ['5k', '20k', '170k'].forEach(size => {
            buttons[size] = createSizeButton(size);
            if (size === '170k') {
                buttons[size].title = 'ENABLE dictionary with 170,000 words';
            }
            sizeSelector.appendChild(buttons[size]);
        });
        
        contentContainer.appendChild(sizeSelector);

        // Sort controls
        const sortControls = document.createElement('div');
        BombPartySuggesterStyles.applyStyles(sortControls, BombPartySuggesterStyles.styles.sortControls);

        // Sort methods
        const sortMethods = {
            frequency: { label: 'Freq' },
            length: { label: 'Len' },
            rarity: { label: 'Rare' }
        };

        // Create sort buttons
        sortButtons = createSortButtons(sortMethods);
        Object.values(sortButtons).forEach(button => sortControls.appendChild(button));
        
        contentContainer.appendChild(sortControls);

        // Results container
        resultsDiv = document.createElement('div');
        BombPartySuggesterStyles.applyStyles(resultsDiv, BombPartySuggesterStyles.styles.resultsDiv);
        resultsDiv.textContent = '(Waiting for syllable...)';
        contentContainer.appendChild(resultsDiv);

        // Add settings button and panel
        const { settingsButton, settingsPanel } = createSettingsPanel();
        panel.appendChild(settingsButton);
        document.body.appendChild(settingsPanel);

        // Add panel to document
        document.body.appendChild(panel);

        // Set initial button states
        BombPartySuggesterStyles.applyStyles(buttons['20k'], 
            {...BombPartySuggesterStyles.styles.button, ...BombPartySuggesterStyles.styles.activeButton});
        BombPartySuggesterStyles.applyStyles(sortButtons.frequency, 
            {...BombPartySuggesterStyles.styles.sortButton, ...BombPartySuggesterStyles.styles.activeSortButton});
        sortButtons.frequency.textContent = 'Freq ↓';

        // Make panel draggable
        setupDraggable(panel);

        return { panel, resultsDiv, buttons, sortButtons };
    };

    // Create size button
    const createSizeButton = (size) => {
        const btn = document.createElement('button');
        btn.textContent = size;
        BombPartySuggesterStyles.applyStyles(btn, BombPartySuggesterStyles.styles.button);
        
        btn.onclick = () => {
            if (!BombPartySuggesterDict.dictionaries[size].words.length) return;
            
            currentDictionary = size;
            
            // Update buttons
            Object.values(buttons).forEach(button => {
                BombPartySuggesterStyles.applyStyles(button, BombPartySuggesterStyles.styles.button);
            });
            
            BombPartySuggesterStyles.applyStyles(btn, 
                {...BombPartySuggesterStyles.styles.button, ...BombPartySuggesterStyles.styles.activeButton});
            
            updateSortButtonsVisibility(size);
            updateSuggestions();
        };
        
        btn.onmousedown = (e) => e.stopPropagation();
        
        return btn;
    };

    // Create sort buttons
    const createSortButtons = (sortMethods) => {
        const buttons = {};
        Object.entries(sortMethods).forEach(([method, { label }]) => {
            const button = document.createElement('button');
            button.textContent = `${label} ↑`;
            
            BombPartySuggesterStyles.applyStyles(button, BombPartySuggesterStyles.styles.sortButton);
            
            let isAscending = true;
            button.onclick = () => {
                if (button.disabled) return;
                
                Object.values(buttons).forEach(btn => {
                    BombPartySuggesterStyles.applyStyles(btn, BombPartySuggesterStyles.styles.sortButton);
                    if (btn !== button) {
                        btn.textContent = btn.textContent.replace(/[↑↓]/, '↑');
                    }
                });
                
                isAscending = currentSort.method === method ? !isAscending : true;
                button.textContent = `${label} ${isAscending ? '↓' : '↑'}`;
                BombPartySuggesterStyles.applyStyles(button, 
                    {...BombPartySuggesterStyles.styles.sortButton, ...BombPartySuggesterStyles.styles.activeSortButton});
                
                updateSort(method, isAscending ? 'desc' : 'asc');
            };
            
            buttons[method] = button;
            
            if (method === 'frequency' && currentDictionary === '170k') {
                button.disabled = true;
                button.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                button.style.cursor = 'not-allowed';
                button.title = 'Frequency sorting not available for 170k dictionary';
            }
        });
        
        return buttons;
    };

    // Update sort state and UI
    const updateSort = (method, direction) => {
        if (method === 'frequency' && !BombPartySuggesterDict.dictionaries[currentDictionary].hasFrequency) {
            method = 'length';
        }
        
        currentSort.method = method;
        currentSort.direction = direction;
        
        updateSortButtonsUI();
        updateSuggestions();
    };

    // Update suggestions based on current syllable
    const updateSuggestions = () => {
        const syllableElement = document.querySelector('.syllable');
        if (syllableElement) {
            suggestWords(syllableElement.textContent.trim());
        }
    };

    // Setup draggable functionality
    const setupDraggable = (panel) => {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        panel.onmousedown = function(e) {
            if (e.target.classList?.contains('resize-handle') || 
                e.target.classList?.contains('resize-edge')) {
                return;
            }
            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            e.preventDefault();
        };

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            
            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;
            
            panel.style.left = Math.min(maxLeft, Math.max(0, newLeft)) + 'px';
            panel.style.top = Math.min(maxTop, Math.max(0, newTop)) + 'px';
            panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    };

    // Setup resize handles
    const setupResizeHandles = (panel) => {
        const positions = [
            { type: 'corner', corner: 'nw', top: '-10px', left: '-10px', cursor: 'nw-resize' },
            { type: 'corner', corner: 'ne', top: '-10px', right: '-10px', cursor: 'ne-resize' },
            { type: 'corner', corner: 'se', bottom: '-10px', right: '-10px', cursor: 'se-resize' },
            { type: 'corner', corner: 'sw', bottom: '-10px', left: '-10px', cursor: 'sw-resize' },
            { type: 'edge', edge: 'n', top: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
            { type: 'edge', edge: 's', bottom: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
            { type: 'edge', edge: 'e', top: '20px', right: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' },
            { type: 'edge', edge: 'w', top: '20px', left: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' }
        ];

        positions.forEach(pos => {
            if (pos.type === 'corner') {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${pos.corner}`;
                BombPartySuggesterStyles.applyStyles(handle, {
                    ...BombPartySuggesterStyles.styles.resizeHandle,
                    ...pos
                });
                
                const dot = document.createElement('div');
                BombPartySuggesterStyles.applyStyles(dot, BombPartySuggesterStyles.styles.resizeDot);
                handle.appendChild(dot);
                
                panel.appendChild(handle);
            } else {
                const edge = document.createElement('div');
                edge.className = `resize-edge ${pos.edge}`;
                BombPartySuggesterStyles.applyStyles(edge, {
                    ...BombPartySuggesterStyles.styles.resizeEdge,
                    ...pos
                });
                panel.appendChild(edge);
            }
        });
    };

    // Create settings panel
    const createSettingsPanel = () => {
        const panel = document.createElement('div');
        panel.id = 'typerSettingsPanel';
        BombPartySuggesterStyles.applyStyles(panel, BombPartySuggesterStyles.styles.settingsPanel);
        panel.style.display = 'none';

        // Create header container
        const headerContainer = document.createElement('div');
        BombPartySuggesterStyles.applyStyles(headerContainer, {
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

        // Add reset button
        const resetButton = document.createElement('button');
        resetButton.textContent = '↺';
        resetButton.title = 'Reset to defaults';
        BombPartySuggesterStyles.applyStyles(resetButton, {
            ...BombPartySuggesterStyles.styles.button,
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
            BombPartySuggesterConfig.resetToDefaults();
            updateSettingsUI();
        };
        
        headerContainer.appendChild(resetButton);
        panel.appendChild(headerContainer);

        // Add settings inputs
        addSettingsInputs(panel);

        // Create settings button
        const settingsButton = document.createElement('button');
        settingsButton.textContent = '⚙️';
        BombPartySuggesterStyles.applyStyles(settingsButton, BombPartySuggesterStyles.styles.settingsButton);
        
        settingsButton.onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };

        return { settingsButton, settingsPanel: panel };
    };

    // Add settings inputs to panel
    const addSettingsInputs = (panel) => {
        const settings = [
            { label: 'Base Delay (ms)', key: 'baseDelay', min: 0, max: 100, step: 1 },
            { label: 'Distance Multiplier', key: 'distanceMultiplier', min: 0, max: 20, step: 0.1 },
            { label: 'Minimum Delay (ms)', key: 'minDelay', min: 0, max: 50, step: 1 },
            { label: 'Delay Variation', key: 'delayVariation', min: 0, max: 1, step: 0.01 },
            { label: 'Typo Chance (%)', key: 'typoChance', min: 0, max: 10, step: 0.1 },
            { label: 'Notice Delay (ms)', key: 'typoNoticeDelay.mean', min: 0, max: 1000, step: 10 },
            { label: 'Notice Variation', key: 'typoNoticeDelay.stdDev', min: 0, max: 200, step: 5 },
            { label: 'Backspace Delay (ms)', key: 'typoBackspaceDelay.mean', min: 0, max: 500, step: 10 },
            { label: 'Backspace Variation', key: 'typoBackspaceDelay.stdDev', min: 0, max: 100, step: 5 },
            { label: 'Recovery Delay (ms)', key: 'typoRecoveryDelay.mean', min: 0, max: 500, step: 10 },
            { label: 'Recovery Variation', key: 'typoRecoveryDelay.stdDev', min: 0, max: 100, step: 5 }
        ];

        settings.forEach(setting => {
            panel.appendChild(createSettingInput(setting));
        });
    };

    // Create a setting input with slider
    const createSettingInput = ({ label, key, min, max, step }) => {
        const group = document.createElement('div');
        BombPartySuggesterStyles.applyStyles(group, BombPartySuggesterStyles.styles.settingsGroup);

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        BombPartySuggesterStyles.applyStyles(labelEl, BombPartySuggesterStyles.styles.settingsLabel);
        group.appendChild(labelEl);

        const inputGroup = document.createElement('div');
        BombPartySuggesterStyles.applyStyles(inputGroup, BombPartySuggesterStyles.styles.settingsInputGroup);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = BombPartySuggesterConfig.getValue(key);
        slider.dataset.settingKey = key;
        BombPartySuggesterStyles.applyStyles(slider, BombPartySuggesterStyles.styles.settingsSlider);

        const input = document.createElement('input');
        input.type = 'number';
        input.value = slider.value;
        input.step = step;
        input.min = min;
        input.max = max;
        input.dataset.settingKey = key;
        BombPartySuggesterStyles.applyStyles(input, BombPartySuggesterStyles.styles.settingsInput);

        const updateValue = (newValue) => {
            BombPartySuggesterConfig.setValue(key, parseFloat(newValue));
            slider.value = newValue;
            input.value = newValue;
            BombPartySuggesterConfig.saveSettings();
        };

        slider.oninput = () => updateValue(slider.value);
        input.onchange = () => updateValue(input.value);

        inputGroup.appendChild(slider);
        inputGroup.appendChild(input);
        group.appendChild(inputGroup);
        return group;
    };

    // Update settings UI with current values
    const updateSettingsUI = () => {
        const panel = document.getElementById('typerSettingsPanel');
        if (!panel) return;

        const inputs = panel.querySelectorAll('input');
        inputs.forEach(input => {
            const group = input.closest('.settingsGroup');
            if (!group) return;

            const label = group.querySelector('label');
            if (!label) return;

            // Get the key from the input's data attribute
            const key = input.dataset.settingKey;
            if (!key) return;

            input.value = BombPartySuggesterConfig.getValue(key);
        });
    };

    // Update sort buttons visibility
    const updateSortButtonsVisibility = (dictionary) => {
        const freqButton = sortButtons.frequency;
        if (BombPartySuggesterDict.dictionaries[dictionary].hasFrequency) {
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
                updateSort('length', 'desc');
            }
        }
    };

    // Display matches in the UI
    const displayMatches = (matches, syllable) => {
        const ul = document.createElement('ul');
        BombPartySuggesterStyles.applyStyles(ul, BombPartySuggesterStyles.styles.resultsList);
        
        matches.slice(0, 15).forEach(({ word }) => {
            const li = document.createElement('li');
            BombPartySuggesterStyles.applyStyles(li, BombPartySuggesterStyles.styles.resultsItem);
            
            li.onmouseenter = () => {
                if (BombPartySuggesterTyping.isPlayerTurn()) {
                    BombPartySuggesterStyles.applyStyles(li, BombPartySuggesterStyles.styles.resultsItemHover);
                } else {
                    BombPartySuggesterStyles.applyStyles(li, BombPartySuggesterStyles.styles.resultsItemDisabled);
                }
            };

            li.onmouseleave = () => {
                BombPartySuggesterStyles.applyStyles(li, { backgroundColor: 'transparent' });
            };
            
            li.onclick = () => {
                if (BombPartySuggesterTyping.isPlayerTurn()) {
                    BombPartySuggesterTyping.simulateTyping(word);
                }
            };
            
            li.innerHTML = highlightWord(word, syllable.toLowerCase());
            ul.appendChild(li);
        });
        
        resultsDiv.innerHTML = '';
        resultsDiv.appendChild(ul);
    };

    // Highlight syllable and special letters in word
    const highlightWord = (word, syllable) => {
        const specialLetters = ['v', 'k', 'j', 'x', 'q', 'z', 'w'];
        const wordLower = word.toLowerCase();
        const index = wordLower.indexOf(syllable);
        
        if (index === -1) {
            return word.split('').map(char => 
                specialLetters.includes(char.toLowerCase()) 
                    ? `<span style="color: ${BombPartySuggesterStyles.styles.colors.special}">${char}</span>` 
                    : char
            ).join('');
        }

        let result = '';
        let i = 0;
        while (i < word.length) {
            if (i === index) {
                result += `<span style="color: ${BombPartySuggesterStyles.styles.colors.highlight}">` +
                    word.slice(index, index + syllable.length) + '</span>';
                i += syllable.length;
            } else {
                const char = word[i];
                result += specialLetters.includes(char.toLowerCase())
                    ? `<span style="color: ${BombPartySuggesterStyles.styles.colors.special}">${char}</span>`
                    : char;
                i++;
            }
        }
        return result;
    };

    // Export UI functionality to global scope
    window.BombPartySuggesterUI = {
        createUI,
        updateSort,
        updateSuggestions,
        getCurrentDictionary: () => currentDictionary,
        getCurrentSort: () => currentSort
    };
})(); 