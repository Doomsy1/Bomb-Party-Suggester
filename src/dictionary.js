// dictionary.js - Contains dictionary loading and word suggestion functionality

(function() {
    'use strict';

    // Dictionary setup
    const dictionaries = {
        '5k': { url: 'https://raw.githubusercontent.com/filiph/english_words/master/data/word-freq-top5000.csv', words: [], hasFrequency: true },
        '20k': { url: 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt', words: [], hasFrequency: true },
        '170k': { url: 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt', words: [], hasFrequency: false }
    };

    // Letter rarity scoring (1 for most common, 26 for least common)
    const letterScores = {
        'e': 1, 't': 2, 'a': 3, 'o': 4, 'i': 5, 'n': 6, 's': 7, 'h': 8, 'r': 9, 'd': 10,
        'l': 11, 'u': 12, 'c': 13, 'm': 14, 'w': 15, 'f': 16, 'g': 17, 'y': 18, 'p': 19,
        'b': 20, 'v': 21, 'k': 22, 'j': 23, 'x': 24, 'q': 25, 'z': 26
    };

    // Calculate word rarity score
    const calculateRarityScore = (word) => {
        return word.toLowerCase().split('').reduce((score, letter) => {
            return score + (letterScores[letter] || 13); // default to middle score for unknown characters
        }, 0);
    };

    // Function to load a single dictionary
    const loadDictionary = (size) => {
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
    };

    // Find matches for a syllable
    const findMatches = (syllable, currentDictionary, currentSort) => {
        if (!syllable || !dictionaries[currentDictionary].words.length) {
            return [];
        }

        const lower = syllable.toLowerCase();
        let matches = dictionaries[currentDictionary].words.filter(entry =>
            entry.word.toLowerCase().includes(lower)
        );

        // Sort matches based on current sort settings
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
    };

    // Export dictionary functionality to global scope
    window.BombPartySuggesterDict = {
        dictionaries,
        loadDictionary,
        findMatches,
        calculateRarityScore
    };
})(); 