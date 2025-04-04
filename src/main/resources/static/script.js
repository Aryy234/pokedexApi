import { POKEMON_PER_PAGE, BASE_URL, FALLBACK_IMAGE_URL } from './src/utils/constants.js';
import { fetchPokemon, fetchPokemonBatch } from './src/services/pokemonAPI.js';
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
let isLoading = false;
let connectionRetries = 0;
const MAX_CONNECTION_RETRIES = 3;

// Función para mostrar un indicador de carga con estilo retro
function showLoadingIndicator(message = 'Cargando Pokémon...', progress = null) {
    const progressHTML = progress !== null 
        ? `<div class="progress-container"><div class="progress-bar-loader" style="width: ${progress}%"></div></div>`
        : '';
    
    pokemonGrid.innerHTML = `
        <div class="loading-container">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                 alt="Cargando" class="loading-pokeball">
            <p>${message}</p>
            ${progressHTML}
            <p class="loading-tip">Consejo: Los datos provienen de PokeAPI.co</p>
        </div>
    `;
}

// Función para comprobar la conexión a la API
async function checkApiConnection() {
    try {
        showLoadingIndicator('Verificando conexión a PokeAPI...');
        
        const response = await fetch(`${BASE_URL}/pokemon/1`);
        if (!response.ok) {
            throw new Error(`Error de conexión: ${response.status} ${response.statusText}`);
        }
        
        await response.json(); // Intentar parsear la respuesta
        console.log('Conexión a PokeAPI exitosa');
        return true;
    } catch (error) {
        console.error('Error verificando conexión a PokeAPI:', error);
        
        // Mostrar mensaje de error
        pokemonGrid.innerHTML = `
            <div class="error-container">
                <p>No se pudo conectar con PokeAPI</p>
                <p>Error: ${error.message}</p>
                <button id="retryConnectionBtn" class="retry-button">Reintentar conexión</button>
            </div>
        `;
        
        // Añadir evento al botón de reintento
        document.getElementById('retryConnectionBtn')?.addEventListener('click', retryConnection);
        
        return false;
    }
}

// Función para reintentar la conexión
async function retryConnection() {
    connectionRetries++;
    
    if (connectionRetries <= MAX_CONNECTION_RETRIES) {
        showLoadingIndicator(`Reintentando conexión (${connectionRetries}/${MAX_CONNECTION_RETRIES})...`);
        
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const connected = await checkApiConnection();
        if (connected) {
            connectionRetries = 0;
            loadInitialPokemon();
        }
    } else {
        pokemonGrid.innerHTML = `
            <div class="error-container">
                <p>No se pudo establecer conexión después de ${MAX_CONNECTION_RETRIES} intentos</p>
                <p>Por favor, verifica tu conexión a internet y que PokeAPI.co esté disponible</p>
                <p><a href="https://pokeapi.co/api/v2/pokemon/1" target="_blank" rel="noopener noreferrer">Probar PokeAPI directamente</a></p>
                <button id="resetRetryBtn" class="retry-button">Intentar nuevamente</button>
            </div>
        `;
        
        document.getElementById('resetRetryBtn')?.addEventListener('click', () => {
            connectionRetries = 0;
            checkApiConnection();
        });
    }
}

// Main functionality
async function loadInitialPokemon() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        loadDataBtn.disabled = true;
        loadDataBtn.innerHTML = '<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball" class="spinning"> Cargando...';
        
        // Mostrar indicador de carga
        showLoadingIndicator('Inicializando Pokédex...');

        // Verificar conexión primero
        const isConnected = await checkApiConnection();
        if (!isConnected) {
            return; // No continuar si no hay conexión
        }

        // Obtener lista de Pokémon
        showLoadingIndicator('Obteniendo lista de Pokémon...');
        
        const response = await fetch(`${BASE_URL}/pokemon?limit=${POKEMON_PER_PAGE}`);
        if (!response.ok) {
            throw new Error(`Error obteniendo lista de Pokémon: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();

        // Cargar Pokémon en lotes de 30 para mejor rendimiento (reducido de 50)
        let loadedPokemon = [];
        const batchSize = 30;
        
        for (let i = 0; i < data.results.length; i += batchSize) {
            // Actualizar progreso
            const progress = Math.round((i / data.results.length) * 100);
            showLoadingIndicator(`Cargando Pokémon... ${progress}% completado`, progress);
            
            // Preparar lote
            const batch = data.results.slice(i, i + batchSize);
            const pokemonNames = batch.map(pokemon => pokemon.name);
            
            // Cargar lote
            const batchResults = await fetchPokemonBatch(pokemonNames);
            loadedPokemon = [...loadedPokemon, ...batchResults];
        }

        // Si no se cargó ningún Pokémon, mostrar error
        if (loadedPokemon.length === 0) {
            throw new Error('No se pudo cargar ningún Pokémon');
        }

        // Guardar en estado
        currentPokemonList = loadedPokemon;

        // Renderizar y configurar filtros
        renderPokemonGrid(pokemonGrid, loadedPokemon);
        populateFilters(loadedPokemon);

        // Mostrar el primer Pokémon en los detalles si hay alguno
        if (loadedPokemon.length > 0) {
            displayPokemonDetails(loadedPokemon[0]);
        }
    } catch (error) {
        console.error('Error al cargar Pokémon:', error);
        pokemonGrid.innerHTML = `
            <div class="error-container">
                <p>Error al cargar los Pokémon: ${error.message}</p>
                <button id="retryBtn" class="retry-button">Intentar de nuevo</button>
            </div>
        `;
        document.getElementById('retryBtn')?.addEventListener('click', loadInitialPokemon);
    } finally {
        isLoading = false;
        loadDataBtn.disabled = false;
        loadDataBtn.innerHTML = '<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball"> Cargar Data';
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

    // Traducir tipos
    const typeTranslations = {
        normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta',
        electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', 
        poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
        psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma',
        dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
    };

    typeFilter.innerHTML = '<option value="">Tipo</option>';
    Array.from(types).sort().forEach(type => {
        const translatedType = typeTranslations[type] || type;
        typeFilter.innerHTML += `<option value="${type}">${translatedType}</option>`;
    });

    abilityFilter.innerHTML = '<option value="">Habilidad</option>';
    Array.from(abilities).sort().forEach(ability => {
        abilityFilter.innerHTML += `<option value="${ability}">${ability}</option>`;
    });
}

// Search functions
async function searchByName() {
    const searchTerm = nameSearch.value.toLowerCase().trim();
    if (!searchTerm) return;
    
    try {
        pokemonGrid.innerHTML = `<div class="loading-container">Buscando a ${searchTerm}...</div>`;
        
        // Verificar conexión primero
        const isConnected = await checkApiConnection();
        if (!isConnected) return;
        
        const pokemon = await fetchPokemon(searchTerm);
        if (pokemon) {
            displayPokemonDetails(pokemon);
            
            // Crear un array con solo este Pokémon para mostrar en la cuadrícula
            renderPokemonGrid(pokemonGrid, [pokemon]);
            
            // Añadir botón para volver a todos los Pokémon
            if (currentPokemonList.length > 0) {
                const backButton = document.createElement('button');
                backButton.className = 'back-button';
                backButton.textContent = 'Volver a todos los Pokémon';
                backButton.onclick = () => renderPokemonGrid(pokemonGrid, currentPokemonList);
                pokemonGrid.insertBefore(backButton, pokemonGrid.firstChild);
            }
        } else {
            pokemonGrid.innerHTML = `
                <div class="error-container">
                    <p>Pokémon '${searchTerm}' no encontrado</p>
                    <p>Verifica el nombre e intenta de nuevo</p>
                    ${currentPokemonList.length > 0 ? 
                        `<button class="back-button">Volver a todos los Pokémon</button>` : ''}
                </div>
            `;
            
            // Añadir evento al botón de volver
            const backBtn = pokemonGrid.querySelector('.back-button');
            if (backBtn) {
                backBtn.addEventListener('click', () => renderPokemonGrid(pokemonGrid, currentPokemonList));
            }
        }
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        pokemonGrid.innerHTML = `
            <div class="error-container">
                <p>Error al buscar: ${error.message}</p>
                ${currentPokemonList.length > 0 ? 
                    `<button class="back-button">Volver a todos los Pokémon</button>` : ''}
            </div>
        `;
        
        const backBtn = pokemonGrid.querySelector('.back-button');
        if (backBtn) {
            backBtn.addEventListener('click', () => renderPokemonGrid(pokemonGrid, currentPokemonList));
        }
    }
}

async function searchByNumber() {
    const number = numberSearch.value.trim();
    if (!number || isNaN(Number(number))) {
        alert('Por favor, introduce un número válido');
        return;
    }
    
    try {
        pokemonGrid.innerHTML = `<div class="loading-container">Buscando Pokémon #${number}...</div>`;
        
        // Verificar conexión primero
        const isConnected = await checkApiConnection();
        if (!isConnected) return;
        
        const pokemon = await fetchPokemon(number);
        if (pokemon) {
            displayPokemonDetails(pokemon);
            
            // Crear un array con solo este Pokémon para mostrar en la cuadrícula
            renderPokemonGrid(pokemonGrid, [pokemon]);
            
            // Añadir botón para volver a todos los Pokémon
            if (currentPokemonList.length > 0) {
                const backButton = document.createElement('button');
                backButton.className = 'back-button';
                backButton.textContent = 'Volver a todos los Pokémon';
                backButton.onclick = () => renderPokemonGrid(pokemonGrid, currentPokemonList);
                pokemonGrid.insertBefore(backButton, pokemonGrid.firstChild);
            }
        } else {
            pokemonGrid.innerHTML = `
                <div class="error-container">
                    <p>Pokémon con número '${number}' no encontrado</p>
                    <p>Verifica el número e intenta de nuevo</p>
                    ${currentPokemonList.length > 0 ? 
                        `<button class="back-button">Volver a todos los Pokémon</button>` : ''}
                </div>
            `;
            
            // Añadir evento al botón de volver
            const backBtn = pokemonGrid.querySelector('.back-button');
            if (backBtn) {
                backBtn.addEventListener('click', () => renderPokemonGrid(pokemonGrid, currentPokemonList));
            }
        }
    } catch (error) {
        console.error('Error en la búsqueda por número:', error);
        pokemonGrid.innerHTML = `
            <div class="error-container">
                <p>Error al buscar: ${error.message}</p>
                ${currentPokemonList.length > 0 ? 
                    `<button class="back-button">Volver a todos los Pokémon</button>` : ''}
            </div>
        `;
        
        const backBtn = pokemonGrid.querySelector('.back-button');
        if (backBtn) {
            backBtn.addEventListener('click', () => renderPokemonGrid(pokemonGrid, currentPokemonList));
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

    if (filteredPokemon.length === 0) {
        pokemonGrid.innerHTML = `
            <div class="not-found-container">
                <p>No se encontraron Pokémon con los filtros seleccionados</p>
                <button class="back-button">Quitar filtros</button>
            </div>
        `;
        
        // Añadir evento al botón de quitar filtros
        const backBtn = pokemonGrid.querySelector('.back-button');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                typeFilter.value = '';
                abilityFilter.value = '';
                renderPokemonGrid(pokemonGrid, currentPokemonList);
            });
        }
    } else {
        renderPokemonGrid(pokemonGrid, filteredPokemon);
    }
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
document.addEventListener('DOMContentLoaded', () => {
    // Agregar estilos para animaciones de carga
    const style = document.createElement('style');
    style.textContent = `
        .loading-container {
            text-align: center;
            padding: 20px;
            font-family: 'Press Start 2P', monospace;
            font-size: 14px;
        }
        .loading-pokeball {
            width: 60px;
            height: 60px;
            animation: spin 2s linear infinite;
        }
        .loading-tip {
            margin-top: 15px;
            font-size: 10px;
            opacity: 0.7;
        }
        .spinning {
            animation: spin 2s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .progress-container {
            width: 100%;
            height: 20px;
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
            margin: 15px 0;
            border: 2px solid var(--pokedex-border);
            overflow: hidden;
        }
        .progress-bar-loader {
            height: 100%;
            background: linear-gradient(to right, var(--pokedex-blue), var(--pokedex-screen));
            transition: width 0.3s;
        }
        .error-container, .not-found-container {
            text-align: center;
            padding: 20px;
            color: var(--pokedex-black);
            background: rgba(255, 0, 0, 0.1);
            border-radius: 10px;
            border: 2px solid rgba(0,0,0,0.1);
        }
        .retry-button, .back-button {
            margin-top: 15px;
            padding: 8px 15px;
            background: var(--pokedex-blue);
            color: white;
            border: 2px solid var(--pokedex-border);
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            transition: all 0.2s;
        }
        .retry-button:hover, .back-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .retry-button:active, .back-button:active {
            transform: translateY(1px);
        }
        .back-button {
            background: var(--pokedex-dark-red);
            margin-bottom: 10px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);
    
    // Iniciar verificación de conexión y carga
    setTimeout(() => {
        // Verificar conexión antes de cargar
        checkApiConnection().then(connected => {
            if (connected) {
                loadInitialPokemon();
            }
        });
    }, 1000);
});