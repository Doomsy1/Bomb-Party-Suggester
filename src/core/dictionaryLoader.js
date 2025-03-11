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
        const dictionary = dictionaries[size];
        const response = await fetch(dictionary.url);
        const text = await response.text();
        const lines = text.split('\n');
        
        switch(size) {
            case '5k':
                const dataLines = lines.slice(1); // skip header line
                dictionary.words = dataLines.map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return { word: '', freq: 0 };
                    
                    const parts = trimmed.split(',');
                    if (parts.length < 4) return { word: '', freq: 0 };
                    
                    const word = parts[1] || '';
                    const freq = parseInt(parts[3], 10) || 0;
                    return { word, freq };
                });
                break;
                
            case '20k':
                dictionary.words = lines.map((line, idx) => ({
                    word: line.trim(),
                    freq: lines.length - idx  // higher index = less frequent
                }));
                break;
                
            case '273k':
                dictionary.words = lines
                    .filter(line => line.trim().length > 0)
                    .map(line => ({
                        word: line.trim().toLowerCase(),
                        freq: 1  // treat all words equally
                    }));
                break;
                
            default:
                console.error(`[BombPartySuggester] Unknown dictionary size: ${size}`);
                return;
        }

        dictionary.words = dictionary.words.filter(entry => entry.word);
        console.log(`[BombPartySuggester] Loaded dictionary ${size}: ${dictionary.words.length} words.`);
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
