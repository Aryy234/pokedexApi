
import { POKEMON_PER_PAGE, BASE_URL } from './src/utils/constants.js';
import { fetchPokemon } from './src/services/pokemonAPI.js';
import { renderPokemonGrid, displayPokemonDetails } from './src/components/pokemonUI.js';

// Cache DOM elements
const pokemonGrid = document.getElementById('pokemonGrid');
const nameSearch = document.getElementById('nameSearch');
const numberSearch = document.getElementById('numberSearch');
const typeFilter = document.getElementById('typeFilter');
const abilityFilter = document.getElementById('abilityFilter');
const loadDataBtn = document.getElementById('loadData');
const searchNameBtn = document.getElementById('searchNameBtn');
const searchNumberBtn = document.getElementById('searchNumberBtn');

// State management
let currentPokemonList = [];

// Main functionality
async function loadInitialPokemon() {
    try {
        // Mostrar indicador de carga
        pokemonGrid.innerHTML = '<div>Cargando Pokémon... Esto puede tomar un momento</div>';

        const response = await fetch(`${BASE_URL}/pokemon?limit=${POKEMON_PER_PAGE}`);
        const data = await response.json();

        // Cargar Pokémon en lotes de 50 para mejor rendimiento
        const pokemonPromises = [];
        for (let i = 0; i < data.results.length; i += 50) {
            const batch = data.results.slice(i, i + 50);
            const batchPromises = batch.map(pokemon => fetchPokemon(pokemon.name));
            const batchResults = await Promise.all(batchPromises);
            pokemonPromises.push(...batchResults);

            // Actualizar la interfaz con el progreso
            const progress = Math.round((i + 50) / data.results.length * 100);
            pokemonGrid.innerHTML = `<div>Cargando Pokémon... ${progress}% completado</div>`;
        }

        currentPokemonList = pokemonPromises;

        // Filtrar los null y renderizar
        const validPokemon = currentPokemonList.filter(pokemon => pokemon !== null);
        renderPokemonGrid(pokemonGrid, validPokemon);
        populateFilters(validPokemon);

        // Mostrar el primer Pokémon en los detalles
        if (validPokemon.length > 0) {
            displayPokemonDetails(validPokemon[0]);
        }
    } catch (error) {
        console.error('Error loading initial Pokemon:', error);
        pokemonGrid.innerHTML = '<div>Error al cargar los Pokémon. Por favor, intenta de nuevo.</div>';
    }
}

function populateFilters(pokemonList) {
    const types = new Set();
    const abilities = new Set();

    pokemonList.forEach(pokemon => {
        if (pokemon) {
            pokemon.types.forEach(type => types.add(type));
            pokemon.abilities.forEach(ability => abilities.add(ability));
        }
    });

    typeFilter.innerHTML = '<option value="">Tipo</option>';
    Array.from(types).sort().forEach(type => {
        typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
    });

    abilityFilter.innerHTML = '<option value="">Habilidad</option>';
    Array.from(abilities).sort().forEach(ability => {
        abilityFilter.innerHTML += `<option value="${ability}">${ability}</option>`;
    });
}

// Search functions
async function searchByName() {
    const searchTerm = nameSearch.value.toLowerCase().trim();
    if (searchTerm) {
        const pokemon = await fetchPokemon(searchTerm);
        if (pokemon) {
            displayPokemonDetails(pokemon);
        } else {
            alert('Pokémon no encontrado');
        }
    }
}

async function searchByNumber() {
    const number = numberSearch.value.trim();
    if (number) {
        const pokemon = await fetchPokemon(number);
        if (pokemon) {
            displayPokemonDetails(pokemon);
        } else {
            alert('Pokémon no encontrado');
        }
    }
}

// Filter functions
function filterPokemon() {
    const selectedType = typeFilter.value;
    const selectedAbility = abilityFilter.value;

    let filteredPokemon = currentPokemonList.filter(pokemon => pokemon !== null);

    if (selectedType) {
        filteredPokemon = filteredPokemon.filter(pokemon =>
            pokemon.types.includes(selectedType)
        );
    }

    if (selectedAbility) {
        filteredPokemon = filteredPokemon.filter(pokemon =>
            pokemon.abilities.includes(selectedAbility)
        );
    }

    renderPokemonGrid(pokemonGrid, filteredPokemon);
}

// Event listeners
loadDataBtn.addEventListener('click', loadInitialPokemon);
searchNameBtn.addEventListener('click', searchByName);
searchNumberBtn.addEventListener('click', searchByNumber);
nameSearch.addEventListener('keyup', (e) => e.key === 'Enter' && searchByName());
numberSearch.addEventListener('keyup', (e) => e.key === 'Enter' && searchByNumber());
typeFilter.addEventListener('change', filterPokemon);
abilityFilter.addEventListener('change', filterPokemon);

// Cargar los Pokémon inmediatamente cuando la página se carga
document.addEventListener('DOMContentLoaded', loadInitialPokemon);