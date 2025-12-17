// Global State
let savedWords = [];
let currentWord = null;
let isDarkMode = false;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchButtonText = document.getElementById('searchButtonText');
const themeToggle = document.getElementById('themeToggle');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingIndicator = document.getElementById('loadingIndicator');
const wordDataContainer = document.getElementById('wordDataContainer');
const welcomeMessage = document.getElementById('welcomeMessage');
const savedWordsContainer = document.getElementById('savedWordsContainer');
const savedWordsList = document.getElementById('savedWordsList');
const wordTitle = document.getElementById('wordTitle');
const wordPhonetic = document.getElementById('wordPhonetic');
const saveWordButton = document.getElementById('saveWordButton');
const audioContainer = document.getElementById('audioContainer');
const meaningsContainer = document.getElementById('meaningsContainer');
const sourceContainer = document.getElementById('sourceContainer');
const sourceLinks = document.getElementById('sourceLinks');

// API Configuration
const API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

// Event Listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});
themeToggle.addEventListener('click', toggleTheme);
saveWordButton.addEventListener('click', handleSaveWord);

// Initialize
init();

function init() {
    // Load saved words from memory (in a real app, this could be localStorage)
    updateSavedWordsDisplay();
}

// Search Functionality
async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        return;
    }

    // Reset UI
    hideElement(errorMessage);
    hideElement(wordDataContainer);
    hideElement(welcomeMessage);
    showElement(loadingIndicator);
    
    // Update button state
    searchButton.disabled = true;
    searchButtonText.textContent = 'Searching...';

    try {
        const response = await fetch(`${API_BASE_URL}/${searchTerm}`);
        
        if (!response.ok) {
            throw new Error('Word not found. Please try another word.');
        }

        const data = await response.json();
        currentWord = data[0];
        
        displayWordData(currentWord);
        hideElement(loadingIndicator);
        showElement(wordDataContainer);
        
    } catch (error) {
        hideElement(loadingIndicator);
        showError(error.message || 'Failed to fetch word definition. Please check your connection and try again.');
    } finally {
        searchButton.disabled = false;
        searchButtonText.textContent = 'Search';
    }
}

// Display Word Data
function displayWordData(data) {
    // Word Title and Phonetic
    wordTitle.textContent = data.word;
    wordPhonetic.textContent = data.phonetic || '';
    
    // Update save button state
    updateSaveButtonState();
    
    // Update container highlight if word is saved
    if (savedWords.includes(data.word)) {
        wordDataContainer.classList.add('saved-highlight');
    } else {
        wordDataContainer.classList.remove('saved-highlight');
    }
    
    // Audio Pronunciation
    displayAudioPronunciation(data.phonetics);
    
    // Meanings
    displayMeanings(data.meanings);
    
    // Source URLs
    displaySources(data.sourceUrls);
}

// Display Audio Pronunciation
function displayAudioPronunciation(phonetics) {
    audioContainer.innerHTML = '';
    
    if (!phonetics || phonetics.length === 0) {
        hideElement(audioContainer);
        return;
    }
    
    const audioPhonetics = phonetics.filter(p => p.audio && p.audio.trim() !== '');
    
    if (audioPhonetics.length === 0) {
        hideElement(audioContainer);
        return;
    }
    
    audioPhonetics.forEach(phonetic => {
        const button = document.createElement('button');
        button.className = 'audio-button';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            <span>${phonetic.text || 'Play Audio'}</span>
        `;
        button.addEventListener('click', () => playAudio(phonetic.audio));
        audioContainer.appendChild(button);
    });
    
    showElement(audioContainer);
}

// Play Audio
function playAudio(audioUrl) {
    // Handle protocol-relative URLs
    let fullUrl = audioUrl;
    if (audioUrl.startsWith('//')) {
        fullUrl = 'https:' + audioUrl;
    }
    
    const audio = new Audio(fullUrl);
    audio.play().catch(err => {
        console.error('Error playing audio:', err);
        showError('Unable to play audio pronunciation.');
    });
}

// Display Meanings
function displayMeanings(meanings) {
    meaningsContainer.innerHTML = '';
    
    if (!meanings || meanings.length === 0) {
        return;
    }
    
    meanings.forEach(meaning => {
        const meaningSection = document.createElement('div');
        meaningSection.className = 'meaning-section';
        
        // Part of Speech
        const partOfSpeech = document.createElement('h3');
        partOfSpeech.className = 'part-of-speech';
        partOfSpeech.textContent = meaning.partOfSpeech;
        meaningSection.appendChild(partOfSpeech);
        
        // Definitions
        if (meaning.definitions && meaning.definitions.length > 0) {
            const definitionsSection = document.createElement('div');
            definitionsSection.className = 'definitions-section';
            
            const title = document.createElement('h4');
            title.className = 'section-title';
            title.textContent = 'Definitions:';
            definitionsSection.appendChild(title);
            
            const list = document.createElement('ul');
            list.className = 'definitions-list';
            
            meaning.definitions.forEach(def => {
                const item = document.createElement('li');
                item.className = 'definition-item';
                
                const defText = document.createElement('p');
                defText.className = 'definition-text';
                defText.textContent = '• ' + def.definition;
                item.appendChild(defText);
                
                if (def.example) {
                    const example = document.createElement('p');
                    example.className = 'definition-example';
                    example.textContent = `Example: "${def.example}"`;
                    item.appendChild(example);
                }
                
                list.appendChild(item);
            });
            
            definitionsSection.appendChild(list);
            meaningSection.appendChild(definitionsSection);
        }
        
        // Synonyms
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            const synonymsSection = document.createElement('div');
            synonymsSection.className = 'synonyms-section';
            
            const title = document.createElement('h4');
            title.className = 'section-title';
            title.textContent = 'Synonyms:';
            synonymsSection.appendChild(title);
            
            const tags = document.createElement('div');
            tags.className = 'word-tags';
            
            meaning.synonyms.forEach(syn => {
                const tag = document.createElement('span');
                tag.className = 'synonym-tag';
                tag.textContent = syn;
                tags.appendChild(tag);
            });
            
            synonymsSection.appendChild(tags);
            meaningSection.appendChild(synonymsSection);
        }
        
        // Antonyms
        if (meaning.antonyms && meaning.antonyms.length > 0) {
            const antonymsSection = document.createElement('div');
            antonymsSection.className = 'antonyms-section';
            
            const title = document.createElement('h4');
            title.className = 'section-title';
            title.textContent = 'Antonyms:';
            antonymsSection.appendChild(title);
            
            const tags = document.createElement('div');
            tags.className = 'word-tags';
            
            meaning.antonyms.forEach(ant => {
                const tag = document.createElement('span');
                tag.className = 'antonym-tag';
                tag.textContent = ant;
                tags.appendChild(tag);
            });
            
            antonymsSection.appendChild(tags);
            meaningSection.appendChild(antonymsSection);
        }
        
        meaningsContainer.appendChild(meaningSection);
    });
}

// Display Sources
function displaySources(sourceUrls) {
    sourceLinks.innerHTML = '';
    
    if (!sourceUrls || sourceUrls.length === 0) {
        hideElement(sourceContainer);
        return;
    }
    
    sourceUrls.forEach(url => {
        const link = document.createElement('a');
        link.className = 'source-link';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            ${url}
        `;
        sourceLinks.appendChild(link);
    });
    
    showElement(sourceContainer);
}

// Save Word Functionality
function handleSaveWord() {
    if (!currentWord || savedWords.includes(currentWord.word)) {
        return;
    }
    
    savedWords.push(currentWord.word);
    updateSaveButtonState();
    updateSavedWordsDisplay();
    wordDataContainer.classList.add('saved-highlight');
}

function updateSaveButtonState() {
    if (currentWord && savedWords.includes(currentWord.word)) {
        saveWordButton.textContent = 'Saved';
        saveWordButton.classList.add('saved');
        saveWordButton.disabled = true;
    } else {
        saveWordButton.textContent = 'Save Word';
        saveWordButton.classList.remove('saved');
        saveWordButton.disabled = false;
    }
}

function updateSavedWordsDisplay() {
    savedWordsList.innerHTML = '';
    
    if (savedWords.length === 0) {
        hideElement(savedWordsContainer);
        return;
    }
    
    savedWords.forEach(word => {
        const tag = document.createElement('span');
        tag.className = 'saved-word-tag';
        tag.textContent = word;
        savedWordsList.appendChild(tag);
    });
    
    showElement(savedWordsContainer);
}

// Theme Toggle
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    if (isDarkMode) {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

// Error Handling
function showError(message) {
    errorText.textContent = message;
    showElement(errorMessage);
    hideElement(wordDataContainer);
    hideElement(welcomeMessage);
}

// Utility Functions
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}
