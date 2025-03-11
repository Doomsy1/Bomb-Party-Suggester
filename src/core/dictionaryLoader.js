// src/core/dictionaryLoader.js
window.BPS = window.BPS || {};

(function(){
    // Store all dictionaries in a single object
    const dictionaries = {
        '5k': {
            url: 'https://raw.githubusercontent.com/filiph/english_words/master/data/word-freq-top5000.csv',
            words: [],
            hasFrequency: true
        },
        '20k': {
            url: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt',
            words: [],
            hasFrequency: true
        },
        '273k': {
            url: 'https://raw.githubusercontent.com/kli512/bombparty-assist/refs/heads/main/bombparty/dictionaries/en.txt',
            words: [],
            hasFrequency: false
        }
    };

    async function loadDictionary(size) {
        const response = await fetch(dictionaries[size].url);
        const text = await response.text();
        const lines = text.split('\n');

        if (dictionaries[size].url.endsWith('.csv')) {
            // For the 5k CSV
            const dataLines = lines.slice(1); // skip header line
            dictionaries[size].words = dataLines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return { word: '', freq: 0 };
                const parts = trimmed.split(',');
                if (parts.length < 4) return { word: '', freq: 0 };
                const word = parts[1] || '';
                const freq = parseInt(parts[3], 10) || 0;
                return { word, freq };
            });
        } else if (size === '273k') {
            // Big dictionary
            dictionaries[size].words = lines
                .filter(line => line.trim().length > 0)
                .map(line => ({
                    word: line.trim().toLowerCase(),
                    freq: 1  // treat them all equally
                }));
        } else {
            // 20k dictionary
            dictionaries[size].words = lines.map((line, idx) => ({
                word: line.trim(),
                freq: lines.length - idx  // so top lines are 'most common'
            }));
        }

        dictionaries[size].words = dictionaries[size].words.filter(e => e.word);
        console.log(`[BombPartySuggester] Loaded dictionary ${size}: ${dictionaries[size].words.length} words.`);
    }

    async function loadAllDictionaries() {
        try {
            await Promise.all([
                loadDictionary('5k'),
                loadDictionary('20k'),
                loadDictionary('273k')
            ]);
            console.log("[BombPartySuggester] All dictionaries loaded.");
        } catch (err) {
            console.error("[BombPartySuggester] Error loading dictionaries:", err);
        }
    }

    // Expose globally
    window.BPS.dictionaries = dictionaries;
    window.BPS.loadAllDictionaries = loadAllDictionaries;
})();
