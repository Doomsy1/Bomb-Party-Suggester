// src/ui/main.js
window.BPS = window.BPS || {};

(function() {
    'use strict';

    const styles = window.BPS.styles;
    const applyStyles = window.BPS.applyStyles;
    const setupDraggableResize = window.BPS.setupDraggableResize;
    const createSettingsPanel = window.BPS.createSettingsPanel;
    const createDictionarySizeSelector = window.BPS.createDictionarySizeSelector;
    const createSortControls = window.BPS.createSortControls;

    /**
     * Builds the main word suggester panel in the DOM,
     * including dictionary size controls, sort controls,
     * results container, and the settings panel button.
     */
    function createUI() {
        // Main panel
        const panel = document.createElement('div');
        panel.id = 'bombPartyWordSuggesterPanel';
        applyStyles(panel, styles.panel);

        // Make it draggable & resizable
        setupDraggableResize(panel);

        // Container for dictionary & sort controls
        const content = document.createElement('div');
        content.id = 'bombPartyWordSuggesterContent';
        panel.appendChild(content);

        // Dictionary size selector
        const sizeSelector = createDictionarySizeSelector();
        content.appendChild(sizeSelector);

        // Sort controls
        const sortControls = createSortControls();
        content.appendChild(sortControls);

        // Results container
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'bombPartyWordSuggesterResults';
        applyStyles(resultsDiv, styles.resultsDiv);
        resultsDiv.textContent = '(Waiting for syllable...)';
        content.appendChild(resultsDiv);

        // Create the settings panel (hidden by default)
        const settingsPanel = createSettingsPanel();

        // A settings button on the main panel
        const settingsButton = document.createElement('button');
        settingsButton.textContent = '⚙️';
        applyStyles(settingsButton, styles.settingsButton);
        settingsButton.onclick = () => {
            settingsPanel.style.display =
                (settingsPanel.style.display === 'none') ? 'block' : 'none';
        };
        // Prevent dragging on mousedown
        settingsButton.onmousedown = (e) => e.stopPropagation();
        panel.appendChild(settingsButton);

        document.body.appendChild(panel);

        // Mark default dictionary (20k) & default sort (Freq ↓) as active
        const dictButtons = sizeSelector.querySelectorAll('button');
        if (dictButtons[1]) {
            applyStyles(dictButtons[1], { ...styles.button, ...styles.activeButton });
        }
        const sortButtons = sortControls.querySelectorAll('button');
        if (sortButtons[0]) {
            applyStyles(sortButtons[0], { ...styles.sortButton, ...styles.activeSortButton });
            sortButtons[0].textContent = 'Freq ↓';
        }
    }

    /**
     * The main initialization function:
     * 1) Builds the UI
     * 2) Sets up the syllable observer
     */
    function initScript() {
        createUI();
        window.BPS.setupSyllableObserver();
    }

    // Expose
    window.BPS.initScript = initScript;
})();
