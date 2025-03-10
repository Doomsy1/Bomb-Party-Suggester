// src/uiSettings.js
window.BPS = window.BPS || {};

(function() {
    'use strict';

    const styles = window.BPS.styles;
    const applyStyles = window.BPS.applyStyles;
    const TYPER_CONFIG = window.BPS.TYPER_CONFIG;
    const saveSettings = window.BPS.saveSettings;
    const loadSavedSettings = window.BPS.loadSavedSettings;

    // Pull in the shared makeDraggable from uiDragResize.js
    const makeDraggable = window.BPS.makeDraggable;

    /**
     * Builds the entire Typer Settings panel, including the reset button
     * and all slider inputs.
     */
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'typerSettingsPanel';
        applyStyles(panel, styles.settingsPanel);
        panel.style.display = 'none'; // hidden by default

        // Make the panel draggable
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
            refreshSettingsPanel(panel);
            console.log("[BombPartySuggester] Settings reset to defaults.");
        };

        header.appendChild(resetBtn);
        panel.appendChild(header);

        // Add setting inputs
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
        return panel;
    }

    /**
     * Creates a single labeled slider + numeric input for a given TYPER_CONFIG path.
     */
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
            // Traverse TYPER_CONFIG by splitting configPath ("typoNoticeDelay.mean", etc.)
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

    /**
     * After a reset, we update all sliders/inputs to match the fresh TYPER_CONFIG values.
     */
    function refreshSettingsPanel(panel) {
        const groups = panel.querySelectorAll('.settingsGroup');
        groups.forEach(group => {
            const label = group.querySelector('label').textContent;
            const slider = group.querySelector('input[type="range"]');
            const numericInput = group.querySelector('input[type="number"]');

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

            // Walk TYPER_CONFIG
            const parts = path.split('.');
            let val = TYPER_CONFIG;
            for (const p of parts) {
                val = val[p];
            }
            slider.value = val;
            numericInput.value = val;
        });
    }

    // Expose
    window.BPS.createSettingsPanel = createSettingsPanel;
    window.BPS.refreshSettingsPanel = refreshSettingsPanel;
})();
