// Script to fetch and parse YAML data from GitHub repository
// Save as github-data-fetcher.js

// import yaml from 'js-yaml';
// No import needed - it's available as jsyaml
// const yamlContent = jsyaml.load(yourYamlString);

// Configuration
const config = {
  owner: 'jimitori',
  repo: 'ophidian',
  branch: 'main', // or master, depending on your repository
  paths: {
    grammar: 'grammar.yaml',
    lexicon: 'lexicon.yaml',
    phonology: 'phonology.yaml'
  }
};

// Fetch data from GitHub
async function fetchYamlFromGitHub(path) {
  const url = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${path}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }
    
    const yamlText = await response.text();
    return jsyaml.load(yamlText);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
}

// Get all language data
export async function getLanguageData() {
  const grammar = await fetchYamlFromGitHub(config.paths.grammar);
  const lexicon = await fetchYamlFromGitHub(config.paths.lexicon);
  const phonology = await fetchYamlFromGitHub(config.paths.phonology);
  
  return { grammar, lexicon, phonology };
}

// Get grammar specific data
export async function getGrammarData() {
  return await fetchYamlFromGitHub(config.paths.grammar);
}

// Get lexicon specific data
export async function getLexiconData() {
  return await fetchYamlFromGitHub(config.paths.lexicon);
}

// Format lexicon data for the dictionary UI
export function formatLexiconForDisplay(lexicon) {
  if (!lexicon || !lexicon.words) return [];
  
  return lexicon.words.map(word => ({
    id: word.id || generateId(word),
    lemma: word.lemma,
    class: word.class,
    type: word.type,
    translation: word.translation,
    etymology: word.etymology || null,
    examples: word.examples || [],
    relatedWords: word.related || []
  }));
}

// Helper to generate ID if none exists
function generateId(word) {
  return `${word.lemma}-${word.class}-${Math.random().toString(36).substr(2, 5)}`;
}

