// ui.js
window.BPS = window.BPS || {};

(function(){
    const styles = window.BPS.styles;
    const applyStyles = window.BPS.applyStyles;
    const dictionaries = window.BPS.dictionaries;
    const simulateTyping = window.BPS.simulateTyping;
    const isPlayerTurn = window.BPS.isPlayerTurn;
    const TYPER_CONFIG = window.BPS.TYPER_CONFIG;
    const normalRandom = window.BPS.normalRandom;
    const saveSettings = window.BPS.saveSettings;
    const loadSavedSettings = window.BPS.loadSavedSettings;

    // Current dictionary and sort config
    let currentDictionary = '20k';
    let currentSort = { method: 'frequency', direction: 'desc' };

    // For the observer that watches the "syllable" element
    let syllableObserver = null;

    // Letter frequency for 'rarity' sorting
    const letterScores = {
        'e': 1, 't': 2, 'a': 3, 'o': 4, 'i': 5, 'n': 6, 's': 7, 'h': 8, 'r': 9,
        'd': 10, 'l': 11, 'u': 12, 'c': 13, 'm': 14, 'w': 15, 'f': 16, 'g': 17,
        'y': 18, 'p': 19, 'b': 20, 'v': 21, 'k': 22, 'j': 23, 'x': 24, 'q': 25, 'z': 26
    };

    function calculateRarityScore(word) {
        return word.toLowerCase().split('').reduce((score, letter) => {
            return score + (letterScores[letter] || 13);
        }, 0);
    }

    // Sort matches in-place
    function sortMatches(matches) {
        let { method, direction } = currentSort;

        // If dictionary has no frequency data but method = frequency, default to length
        if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
            method = 'length';
        }

        const sortFn = {
            frequency: (a, b) => b.freq - a.freq,
            length: (a, b) => b.word.length - a.word.length,
            rarity: (a, b) => calculateRarityScore(b.word) - calculateRarityScore(a.word)
        }[method];

        matches.sort(direction === 'desc' ? sortFn : (a, b) => -sortFn(a, b));
        return matches;
    }

    // Syllable -> suggestion
    function suggestWords(syllable) {
        const resultsDiv = document.getElementById('bombPartyWordSuggesterResults');
        if (!resultsDiv) return;

        if (!syllable) {
            resultsDiv.textContent = '(Waiting for syllable...)';
            return;
        }

        const dictObj = dictionaries[currentDictionary];
        if (!dictObj.words.length) {
            resultsDiv.textContent = 'Dictionary not ready yet...';
            return;
        }

        const lower = syllable.toLowerCase();
        let matches = dictObj.words.filter(e => e.word.toLowerCase().includes(lower));
        if (!matches.length) {
            resultsDiv.textContent = 'No suggestions found.';
            return;
        }

        sortMatches(matches);

        const ul = document.createElement('ul');
        applyStyles(ul, styles.resultsList);

        // Only show top 15
        matches.slice(0, 15).forEach(({ word }) => {
            const li = document.createElement('li');
            applyStyles(li, styles.resultsItem);

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
            li.onclick = () => {
                if (isPlayerTurn()) {
                    simulateTyping(word);
                }
            };

            // Highlight the syllable portion
            const idx = word.toLowerCase().indexOf(lower);
            if (idx >= 0) {
                const before = word.slice(0, idx);
                const match = word.slice(idx, idx + lower.length);
                const after = word.slice(idx + lower.length);

                li.innerHTML = `${before}<span style="color:${styles.colors.highlight}">${match}</span>${after}`;
            } else {
                li.textContent = word;
            }

            ul.appendChild(li);
        });

        resultsDiv.innerHTML = '';
        resultsDiv.appendChild(ul);
    }

    // Create the Typer Settings Panel
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'typerSettingsPanel';
        applyStyles(panel, styles.settingsPanel);
        panel.style.display = 'none'; // hidden by default

        // Draggable
        makeDraggable(panel);

        // Header container
        const header = document.createElement('div');
        applyStyles(header, {
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
        header.appendChild(title);

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '↺';
        resetBtn.title = 'Reset to defaults';
        applyStyles(resetBtn, {
            ...styles.button,
            padding: '2px 6px',
            fontSize: '14px',
            marginLeft: '8px',
            backgroundColor: 'transparent'
        });
        resetBtn.onmouseenter = () => { resetBtn.style.backgroundColor = 'rgba(97, 218, 251, 0.2)'; };
        resetBtn.onmouseleave = () => { resetBtn.style.backgroundColor = 'transparent'; };

        resetBtn.onclick = () => {
            const defaults = {
                baseDelay: 60,
                distanceMultiplier: 12.5,
                minDelay: 15,
                delayVariation: 0.2,
                typoChance: 2,
                typoNoticeDelay: { mean: 250, stdDev: 60 },
                typoBackspaceDelay: { mean: 100, stdDev: 40 },
                typoRecoveryDelay: { mean: 200, stdDev: 50 }
            };
            Object.assign(TYPER_CONFIG, JSON.parse(JSON.stringify(defaults)));
            saveSettings();
            // Refresh panel UI
            refreshSettingsPanel(panel);
            console.log("[BombPartySuggester] Settings reset to defaults.");
        };

        header.appendChild(resetBtn);
        panel.appendChild(header);

        // Add inputs
        panel.appendChild(
            createSettingInput('Base Delay (ms)', 'baseDelay', TYPER_CONFIG.baseDelay, 0, 100, 1)
        );
        panel.appendChild(
            createSettingInput('Distance Multiplier', 'distanceMultiplier', TYPER_CONFIG.distanceMultiplier, 0, 20, 0.1)
        );
        panel.appendChild(
            createSettingInput('Minimum Delay (ms)', 'minDelay', TYPER_CONFIG.minDelay, 0, 50, 1)
        );
        panel.appendChild(
            createSettingInput('Delay Variation', 'delayVariation', TYPER_CONFIG.delayVariation, 0, 1, 0.01)
        );
        panel.appendChild(
            createSettingInput('Typo Chance (%)', 'typoChance', TYPER_CONFIG.typoChance, 0, 10, 0.1)
        );
        panel.appendChild(
            createSettingInput('Notice Delay (ms)', 'typoNoticeDelay.mean', TYPER_CONFIG.typoNoticeDelay.mean, 0, 1000, 10)
        );
        panel.appendChild(
            createSettingInput('Notice Variation', 'typoNoticeDelay.stdDev', TYPER_CONFIG.typoNoticeDelay.stdDev, 0, 200, 5)
        );
        panel.appendChild(
            createSettingInput('Backspace Delay (ms)', 'typoBackspaceDelay.mean', TYPER_CONFIG.typoBackspaceDelay.mean, 0, 500, 10)
        );
        panel.appendChild(
            createSettingInput('Backspace Variation', 'typoBackspaceDelay.stdDev', TYPER_CONFIG.typoBackspaceDelay.stdDev, 0, 100, 5)
        );
        panel.appendChild(
            createSettingInput('Recovery Delay (ms)', 'typoRecoveryDelay.mean', TYPER_CONFIG.typoRecoveryDelay.mean, 0, 500, 10)
        );
        panel.appendChild(
            createSettingInput('Recovery Variation', 'typoRecoveryDelay.stdDev', TYPER_CONFIG.typoRecoveryDelay.stdDev, 0, 100, 5)
        );

        document.body.appendChild(panel);
        return panel;
    }

    // Helper to create a labeled slider + number input
    function createSettingInput(labelText, configPath, initialValue, min, max, step) {
        const group = document.createElement('div');
        group.className = 'settingsGroup';
        applyStyles(group, styles.settingsGroup);

        const labelEl = document.createElement('label');
        labelEl.textContent = labelText;
        applyStyles(labelEl, styles.settingsLabel);
        group.appendChild(labelEl);

        const inputGroup = document.createElement('div');
        applyStyles(inputGroup, styles.settingsInputGroup);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initialValue;
        applyStyles(slider, styles.settingsSlider);

        const numericInput = document.createElement('input');
        numericInput.type = 'number';
        numericInput.value = initialValue;
        numericInput.min = min;
        numericInput.max = max;
        numericInput.step = step;
        applyStyles(numericInput, styles.settingsInput);

        const updateValue = (val) => {
            // Drill into TYPER_CONFIG using configPath like "typoNoticeDelay.mean"
            const keys = configPath.split('.');
            let target = TYPER_CONFIG;
            for (let i = 0; i < keys.length - 1; i++) {
                target = target[keys[i]];
            }
            target[keys[keys.length - 1]] = parseFloat(val);

            slider.value = val;
            numericInput.value = val;
            saveSettings();
        };

        slider.addEventListener('input', () => updateValue(slider.value));
        numericInput.addEventListener('change', () => updateValue(numericInput.value));

        inputGroup.appendChild(slider);
        inputGroup.appendChild(numericInput);
        group.appendChild(inputGroup);
        return group;
    }

    // Refresh all sliders/inputs to match TYPER_CONFIG (useful after reset)
    function refreshSettingsPanel(panel) {
        const groups = panel.querySelectorAll('.settingsGroup');
        groups.forEach(group => {
            const label = group.querySelector('label').textContent;
            const slider = group.querySelector('input[type="range"]');
            const numericInput = group.querySelector('input[type="number"]');

            // Mapping from label -> config path
            const labelToPath = {
                'Base Delay (ms)': 'baseDelay',
                'Distance Multiplier': 'distanceMultiplier',
                'Minimum Delay (ms)': 'minDelay',
                'Delay Variation': 'delayVariation',
                'Typo Chance (%)': 'typoChance',
                'Notice Delay (ms)': 'typoNoticeDelay.mean',
                'Notice Variation': 'typoNoticeDelay.stdDev',
                'Backspace Delay (ms)': 'typoBackspaceDelay.mean',
                'Backspace Variation': 'typoBackspaceDelay.stdDev',
                'Recovery Delay (ms)': 'typoRecoveryDelay.mean',
                'Recovery Variation': 'typoRecoveryDelay.stdDev'
            };
            const path = labelToPath[label];
            if (!path) return;

            const parts = path.split('.');
            let val = TYPER_CONFIG;
            for (const p of parts) {
                val = val[p];
            }
            slider.value = val;
            numericInput.value = val;
        });
    }

    // Basic draggable for panels
    function makeDraggable(element) {
        let isDragging = false, offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            if (e.target.tagName.toLowerCase() === 'button' ||
                e.target.tagName.toLowerCase() === 'input') {
                return; // don't drag if clicking button/input
            }
            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                element.style.left = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, x)) + 'px';
                element.style.top = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, y)) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    // Create the main “word suggester” panel with resizing, dictionary buttons, etc.
    function createUI() {
        const panel = document.createElement('div');
        panel.id = 'bombPartyWordSuggesterPanel';
        applyStyles(panel, styles.panel);

        // Make it draggable/resizable
        setupDraggableResize(panel);

        // Content container
        const content = document.createElement('div');
        content.id = 'bombPartyWordSuggesterContent';
        panel.appendChild(content);

        // Dictionary size selector
        const sizeSelector = document.createElement('div');
        applyStyles(sizeSelector, styles.sizeSelector);

        ['5k','20k','170k'].forEach(dictSize => {
            const btn = document.createElement('button');
            btn.textContent = dictSize;
            applyStyles(btn, styles.button);

            btn.onclick = () => {
                // Only switch if dictionary is loaded
                if (!dictionaries[dictSize].words.length) return;

                currentDictionary = dictSize;
                // Reset UI
                [...sizeSelector.querySelectorAll('button')].forEach(b => {
                    applyStyles(b, styles.button);
                });
                applyStyles(btn, {...styles.button, ...styles.activeButton});

                // If frequency sort is chosen but dictionary lacks freq data, revert to length
                if (currentSort.method === 'frequency' && !dictionaries[dictSize].hasFrequency) {
                    currentSort.method = 'length';
                    currentSort.direction = 'desc';
                }

                // Update the syllable if we already have one
                const sEl = document.querySelector('.syllable');
                if (sEl) suggestWords(sEl.textContent.trim());
            };

            // Prevent dragging when clicking the button
            btn.onmousedown = (e) => { e.stopPropagation(); };
            sizeSelector.appendChild(btn);
        });
        content.appendChild(sizeSelector);

        // Sort controls
        const sortControls = document.createElement('div');
        applyStyles(sortControls, styles.sortControls);
        const sortDefs = {
            frequency: 'Freq',
            length: 'Len',
            rarity: 'Rare'
        };

        Object.entries(sortDefs).forEach(([method, label]) => {
            const btn = document.createElement('button');
            btn.textContent = label + ' ↑';
            applyStyles(btn, styles.sortButton);

            let isAscending = true;

            btn.onclick = () => {
                // If dictionary doesn't have freq but user clicked freq, skip
                if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) return;

                // Toggle direction if same method
                if (currentSort.method === method) {
                    isAscending = !isAscending;
                } else {
                    isAscending = true;
                }
                currentSort.method = method;
                currentSort.direction = isAscending ? 'desc' : 'asc';

                // Update all sort buttons
                [...sortControls.querySelectorAll('button')].forEach(b => {
                    applyStyles(b, styles.sortButton);
                    // Reset arrow to ↑
                    const txt = b.textContent.replace(/[↑↓]/, '↑');
                    b.textContent = txt;
                });

                // Mark this one as active
                applyStyles(btn, {...styles.sortButton, ...styles.activeSortButton});
                btn.textContent = `${label} ${isAscending ? '↓':'↑'}`;

                // Re-suggest
                const sEl = document.querySelector('.syllable');
                if (sEl) suggestWords(sEl.textContent.trim());
            };

            // Prevent drag
            btn.onmousedown = (e) => { e.stopPropagation(); };

            sortControls.appendChild(btn);
        });
        content.appendChild(sortControls);

        // Results container
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'bombPartyWordSuggesterResults';
        applyStyles(resultsDiv, styles.resultsDiv);
        resultsDiv.textContent = '(Waiting for syllable...)';
        content.appendChild(resultsDiv);

        // Settings panel
        const settingsPanel = createSettingsPanel();

        // Settings button
        const settingsButton = document.createElement('button');
        settingsButton.textContent = '⚙️';
        applyStyles(settingsButton, styles.settingsButton);
        settingsButton.onclick = () => {
            settingsPanel.style.display = (settingsPanel.style.display === 'none') ? 'block' : 'none';
        };
        // Prevent drag
        settingsButton.onmousedown = (e) => { e.stopPropagation(); };
        panel.appendChild(settingsButton);

        document.body.appendChild(panel);

        // Mark default dictionary 20k as active
        const defaultButton = sizeSelector.querySelector('button:nth-child(2)'); 
        if (defaultButton) {
            applyStyles(defaultButton, {...styles.button, ...styles.activeButton});
        }

        // Mark default sort = frequency descending
        const freqBtn = sortControls.querySelector('button:first-child');
        if (freqBtn) {
            applyStyles(freqBtn, {...styles.sortButton, ...styles.activeSortButton});
            freqBtn.textContent = 'Freq ↓';
        }
    }

    // Sets up draggable + resizable corners
    function setupDraggableResize(panel) {
        // Add corner handles & edges
        const cornerPositions = [
            { corner: 'nw', top: '-10px', left: '-10px', cursor: 'nw-resize' },
            { corner: 'ne', top: '-10px', right: '-10px', cursor: 'ne-resize' },
            { corner: 'se', bottom: '-10px', right: '-10px', cursor: 'se-resize' },
            { corner: 'sw', bottom: '-10px', left: '-10px', cursor: 'sw-resize' }
        ];
        cornerPositions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos.corner}`;
            applyStyles(handle, { ...styles.resizeHandle, ...pos });
            const dot = document.createElement('div');
            applyStyles(dot, styles.resizeDot);
            handle.appendChild(dot);
            panel.appendChild(handle);
        });

        const edgePositions = [
            { edge: 'n', top: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
            { edge: 's', bottom: '-5px', left: '20px', right: '20px', height: '10px', cursor: 'ns-resize' },
            { edge: 'e', top: '20px', right: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' },
            { edge: 'w', top: '20px', left: '-5px', bottom: '20px', width: '10px', cursor: 'ew-resize' }
        ];
        edgePositions.forEach(pos => {
            const edge = document.createElement('div');
            edge.className = `resize-edge ${pos.edge}`;
            applyStyles(edge, { ...styles.resizeEdge, ...pos });
            panel.appendChild(edge);
        });

        // Draggable
        let isDragging = false;
        let startX = 0, startY = 0, offsetX = 0, offsetY = 0;

        panel.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle') ||
                e.target.classList.contains('resize-edge')) {
                return; 
            }
            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            e.preventDefault();
        });

        panel.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            panel.style.left = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, newLeft)) + 'px';
            panel.style.top = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, newTop)) + 'px';
        });

        panel.addEventListener('mouseup', () => { isDragging = false; });
        panel.addEventListener('mouseleave', () => { isDragging = false; });

        // Resizable
        let isResizing = false;
        let currentResizer = null;
        let startWidth, startHeight, panelLeft, panelTop;

        const resizers = [...panel.querySelectorAll('.resize-handle'), ...panel.querySelectorAll('.resize-edge')];
        resizers.forEach(r => {
            r.addEventListener('mousedown', (e) => {
                isResizing = true;
                currentResizer = r;
                startX = e.clientX;
                startY = e.clientY;
                const rect = panel.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;
                panelLeft = rect.left;
                panelTop = rect.top;
                e.preventDefault();
                e.stopPropagation();
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !currentResizer) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const maxW = parseInt(styles.panel.maxWidth, 10) || 500;
            const minW = parseInt(styles.panel.minWidth, 10) || 200;
            const maxH = parseInt(styles.panel.maxHeight, 10) || 800;
            const minH = parseInt(styles.panel.minHeight, 10) || 150;

            let newW = startWidth, newH = startHeight;
            let newL = panelLeft, newT = panelTop;

            const corner = currentResizer.classList[1]; // "nw", "ne", etc.

            // If it's a corner handle
            if (currentResizer.classList.contains('resize-handle')) {
                switch (corner) {
                    case 'nw':
                        newW = startWidth - dx;
                        newH = startHeight - dy;
                        newL = panelLeft + (startWidth - newW);
                        newT = panelTop + (startHeight - newH);
                        break;
                    case 'ne':
                        newW = startWidth + dx;
                        newH = startHeight - dy;
                        newT = panelTop + (startHeight - newH);
                        break;
                    case 'se':
                        newW = startWidth + dx;
                        newH = startHeight + dy;
                        break;
                    case 'sw':
                        newW = startWidth - dx;
                        newH = startHeight + dy;
                        newL = panelLeft + (startWidth - newW);
                        break;
                }
            } else {
                // Edge handle
                const edge = corner; // "n","s","e","w"
                switch (edge) {
                    case 'n':
                        newH = startHeight - dy;
                        newT = panelTop + (startHeight - newH);
                        break;
                    case 's':
                        newH = startHeight + dy;
                        break;
                    case 'e':
                        newW = startWidth + dx;
                        break;
                    case 'w':
                        newW = startWidth - dx;
                        newL = panelLeft + (startWidth - newW);
                        break;
                }
            }

            // Constrain
            newW = Math.min(maxW, Math.max(minW, newW));
            newH = Math.min(maxH, Math.max(minH, newH));
            // Keep in viewport
            newL = Math.min(window.innerWidth - newW, Math.max(0, newL));
            newT = Math.min(window.innerHeight - newH, Math.max(0, newT));

            panel.style.width = newW + 'px';
            panel.style.height = newH + 'px';
            panel.style.left = newL + 'px';
            panel.style.top = newT + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            currentResizer = null;
        });
    }

    // Observe the syllable element
    function setupSyllableObserver() {
        if (syllableObserver) return; // only once
        syllableObserver = new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.type === 'childList' || m.type === 'characterData') {
                    const text = m.target.textContent.trim();
                    if (text) suggestWords(text);
                }
            }
        });

        function waitForSyllable() {
            const el = document.querySelector('.syllable');
            if (el) {
                syllableObserver.observe(el, { childList: true, characterData: true, subtree: true });
                if (el.textContent.trim()) suggestWords(el.textContent.trim());
            } else {
                setTimeout(waitForSyllable, 1000);
            }
        }
        waitForSyllable();
    }

    // The main initialization function
    function initScript() {
        // Build the UI panel
        createUI();

        // Observe the syllable element for changes
        setupSyllableObserver();
    }

    // Expose
    window.BPS.initScript = initScript;
})();
