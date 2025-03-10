// src/uiSuggester.js
window.BPS = window.BPS || {};

(function() {
    'use strict';

    const styles = window.BPS.styles;
    const applyStyles = window.BPS.applyStyles;
    const dictionaries = window.BPS.dictionaries;
    const simulateTyping = window.BPS.simulateTyping;
    const isPlayerTurn = window.BPS.isPlayerTurn;

    // We'll track current dictionary and sort in this file
    let currentDictionary = '20k';
    let currentSort = { method: 'frequency', direction: 'desc' };

    // For letter-based 'rarity' scoring
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

    function sortMatches(matches) {
        let { method, direction } = currentSort;
        // If the dictionary doesn't have freq data, default to length
        if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
            method = 'length';
        }
        const sortFns = {
            frequency: (a, b) => b.freq - a.freq,
            length: (a, b) => b.word.length - a.word.length,
            rarity: (a, b) => calculateRarityScore(b.word) - calculateRarityScore(a.word)
        };
        const sortFn = sortFns[method] || sortFns['length'];
        matches.sort(direction === 'desc' ? sortFn : (a, b) => -sortFn(a, b));
        return matches;
    }

    /**
     * Takes the current syllable text, finds matching words from the
     * current dictionary, sorts them, and displays them.
     */
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

            // Highlight the matching syllable portion
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

    /**
     * Create the dictionary size selector UI (5k, 20k, 273k), 
     * hooking up the button logic to switch dictionaries.
     */
    function createDictionarySizeSelector() {
        const container = document.createElement('div');
        applyStyles(container, styles.sizeSelector);

        ['5k','20k','273k'].forEach(dictSize => {
            const btn = document.createElement('button');
            btn.textContent = dictSize;
            applyStyles(btn, styles.button);

            btn.onclick = () => {
                if (!dictionaries[dictSize].words.length) return; // not loaded yet

                currentDictionary = dictSize;
                // Reset button styles
                [...container.querySelectorAll('button')].forEach(b => {
                    applyStyles(b, styles.button);
                });
                applyStyles(btn, { ...styles.button, ...styles.activeButton });

                // If freq sorting is chosen but new dictionary lacks freq, switch to length
                if (currentSort.method === 'frequency' && !dictionaries[dictSize].hasFrequency) {
                    currentSort.method = 'length';
                    currentSort.direction = 'desc';
                }

                // Re-suggest if we already see a syllable
                const sEl = document.querySelector('.syllable');
                if (sEl) suggestWords(sEl.textContent.trim());
            };

            // Prevent dragging while clicking the button
            btn.onmousedown = (e) => e.stopPropagation();

            container.appendChild(btn);
        });

        return container;
    }

    /**
     * Create the sort controls (Freq, Len, Rare).
     */
    function createSortControls() {
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
                // If dictionary doesn't have freq data but user clicked freq, ignore
                if (method === 'frequency' && !dictionaries[currentDictionary].hasFrequency) {
                    return;
                }

                // Toggle direction if same method
                if (currentSort.method === method) {
                    isAscending = !isAscending;
                } else {
                    isAscending = true;
                }
                currentSort.method = method;
                currentSort.direction = isAscending ? 'desc' : 'asc';

                // Reset all sort buttons
                [...sortControls.querySelectorAll('button')].forEach(b => {
                    applyStyles(b, styles.sortButton);
                    b.textContent = b.textContent.replace(/[↑↓]/, '↑');
                });

                // Mark this one active
                applyStyles(btn, { ...styles.sortButton, ...styles.activeSortButton });
                btn.textContent = `${label} ${isAscending ? '↓' : '↑'}`;

                // Re-suggest
                const sEl = document.querySelector('.syllable');
                if (sEl) suggestWords(sEl.textContent.trim());
            };

            // Prevent drag
            btn.onmousedown = (e) => e.stopPropagation();

            sortControls.appendChild(btn);
        });

        return sortControls;
    }

    /**
     * Gets or sets the current dictionary key (e.g. '20k', '5k', etc.)
     */
    function getCurrentDictionary() {
        return currentDictionary;
    }
    function getCurrentSort() {
        return currentSort;
    }

    // Expose this module's functions
    window.BPS.suggestWords = suggestWords;
    window.BPS.createDictionarySizeSelector = createDictionarySizeSelector;
    window.BPS.createSortControls = createSortControls;
    window.BPS.getCurrentDictionary = getCurrentDictionary;
    window.BPS.getCurrentSort = getCurrentSort;
})();
