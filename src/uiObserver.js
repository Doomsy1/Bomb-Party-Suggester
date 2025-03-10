// src/uiObserver.js
window.BPS = window.BPS || {};

(function() {
    'use strict';

    let syllableObserver = null;
    const suggestWords = window.BPS.suggestWords;

    /**
     * Sets up a MutationObserver on the .syllable element
     * and calls suggestWords() whenever the text changes.
     */
    function setupSyllableObserver() {
        if (syllableObserver) return; // avoid double init

        syllableObserver = new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.type === 'childList' || m.type === 'characterData') {
                    const text = m.target.textContent.trim();
                    if (text) {
                        suggestWords(text);
                    }
                }
            }
        });

        function waitForSyllable() {
            const el = document.querySelector('.syllable');
            if (el) {
                syllableObserver.observe(el, { childList: true, characterData: true, subtree: true });
                // Trigger once initially
                if (el.textContent.trim()) {
                    suggestWords(el.textContent.trim());
                }
            } else {
                setTimeout(waitForSyllable, 1000);
            }
        }
        waitForSyllable();
    }

    // Expose
    window.BPS.setupSyllableObserver = setupSyllableObserver;
})();
