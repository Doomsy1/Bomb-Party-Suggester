/**
 * dictionaries.js - Dictionary loading and management for Bomb Party Suggester
 */

// Dictionary management
const dictionaries = {
    '5k': {
        url: 'https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/dictionaries/5k_with_freq.json',
        words: [],
        hasFrequency: true,
        loaded: false
    },
    '20k': {
        url: 'https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/dictionaries/20k_with_freq.json',
        words: [],
        hasFrequency: true,
        loaded: false
    },
    '170k': {
        url: 'https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/dictionaries/170k.json',
        words: [],
        hasFrequency: false,
        loaded: false
    }
};

// Letter rarity scoring (1 for most common, 26 for least common)
const letterScores = {
    'e': 1, 't': 2, 'a': 3, 'o': 4, 'i': 5, 'n': 6, 's': 7, 'h': 8, 'r': 9, 'd': 10,
    'l': 11, 'u': 12, 'c': 13, 'm': 14, 'w': 15, 'f': 16, 'g': 17, 'y': 18, 'p': 19,
    'b': 20, 'v': 21, 'k': 22, 'j': 23, 'x': 24, 'q': 25, 'z': 26
};

// Calculate word rarity score based on letter frequency
function calculateRarityScore(word) {
    return word.toLowerCase().split('').reduce((score, letter) => {
        return score + (letterScores[letter] || 13); // default to middle score for unknown characters
    }, 0);
}

// Core dictionary functionality 
let dictionaryLoaded = false;
let currentDictionary = '5k'; // default dictionary size

// Load a dictionary from the server
function loadDictionary(size) {
    const dict = dictionaries[size];
    if (!dict) {
        console.error(`[BombPartySuggester] Invalid dictionary size: ${size}`);
        return Promise.reject(`Invalid dictionary size: ${size}`);
    }

    if (dict.loaded) {
        console.log(`[BombPartySuggester] Dictionary already loaded: ${size}`);
        return Promise.resolve();
    }

    return fetch(dict.url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            dict.words = data;
            dict.loaded = true;
            console.log(`[BombPartySuggester] Dictionary loaded: ${size} (${data.length} words)`);
        })
        .catch(error => {
            console.error(`[BombPartySuggester] Error loading dictionary ${size}:`, error);
            throw error;
        });
}

// Find all matching words for a syllable
function findMatchingWords(syllable, dictionarySize = currentDictionary) {
    const dict = dictionaries[dictionarySize];
    if (!dict || !dict.loaded) {
        console.error(`[BombPartySuggester] Dictionary not loaded: ${dictionarySize}`);
        return [];
    }

    if (!syllable) return [];
    
    const syllableRegex = new RegExp(syllable, 'i');
    return dict.words.filter(word => {
        // For dictionaries with frequency data, word is an object {word, freq}
        // For simple dictionaries, word is just a string
        const wordStr = typeof word === 'object' ? word.word : word;
        return syllableRegex.test(wordStr);
    });
}

// Sort matching words based on the specified method and direction
function sortMatches(matches, method, direction) {
    const sortFunctions = {
        frequency: (a, b) => b.freq - a.freq,
        length: (a, b) => b.word.length - a.word.length,
        rarity: (a, b) => {
            const scoreA = calculateRarityScore(a.word);
            const scoreB = calculateRarityScore(b.word);
            return scoreB - scoreA;
        }
    };

    const sortFn = sortFunctions[method];
    matches.sort(direction === 'desc' ? sortFn : (a, b) => -sortFn(a, b));

    return matches;
}

// Expose dictionaries to global scope for userscript use
window.dictionaries = {
    dictionaries,
    letterScores,
    calculateRarityScore,
    dictionaryLoaded,
    currentDictionary,
    loadDictionary,
    findMatchingWords,
    sortMatches
}; 