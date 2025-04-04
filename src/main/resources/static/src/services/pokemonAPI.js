// pokemonAPI.js
import { BASE_URL, API_TIMEOUT, FALLBACK_IMAGE_URL } from '../utils/constants.js';
import { capitalizeFirstLetter } from '../utils/helpers.js';

// Cache para optimizar las peticiones y evitar llamadas repetidas
let pokemonCache = new Map();

/**
 * Realiza una petición fetch con tiempo de espera
 * @param {string} url - URL a la que hacer la petición
 * @returns {Promise} Promesa resuelta con los datos JSON o rechazada con un error
 */
async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error en fetchWithTimeout: ${error.message} para URL: ${url}`);
        throw error;
    }
}

/**
 * Obtiene los datos de un Pokémon desde la PokeAPI
 * @param {string|number} identifier - Nombre o número del Pokémon
 * @returns {Promise<Object|null>} Datos del Pokémon o null en caso de error
 */
export async function fetchPokemon(identifier) {
    if (!identifier) return null;
    
    try {
        // Normalizar el identificador
        const normalizedId = identifier.toString().toLowerCase().trim();
        
        // Verificar si ya tenemos el Pokémon en caché
        if (pokemonCache.has(normalizedId)) {
            console.log(`Usando caché para ${normalizedId}`);
            return pokemonCache.get(normalizedId);
        }

        // Indicar que está cargando
        console.log(`Cargando datos de ${normalizedId}...`);

        // Obtener datos básicos del Pokémon
        const data = await fetchWithTimeout(`${BASE_URL}/pokemon/${normalizedId}`);
        
        // Obtener datos de la especie
        let speciesData = null;
        let evolutionData = null;
        
        try {
            speciesData = await fetchWithTimeout(data.species.url);
            
            // Obtener cadena evolutiva
            try {
                evolutionData = await fetchWithTimeout(speciesData.evolution_chain.url);
            } catch (evoError) {
                console.warn(`No se pudo cargar la cadena evolutiva para ${normalizedId}: ${evoError.message}`);
                evolutionData = { chain: { species: { name: data.name }, evolves_to: [] } };
            }
        } catch (speciesError) {
            console.warn(`No se pudo cargar datos de especie para ${normalizedId}: ${speciesError.message}`);
            // Crear objetos por defecto para evitar errores
            speciesData = { 
                genera: [], 
                flavor_text_entries: [] 
            };
            evolutionData = { chain: { species: { name: data.name }, evolves_to: [] } };
        }

        // Buscar categoría en español o inglés
        const category = speciesData?.genera?.find(g => g.language.name === 'es')?.genus || 
                         speciesData?.genera?.find(g => g.language.name === 'en')?.genus || 
                         'Desconocido';

        // Buscar descripción en español o inglés
        const description = speciesData?.flavor_text_entries?.find(entry => entry.language.name === 'es')?.flavor_text || 
                            speciesData?.flavor_text_entries?.find(entry => entry.language.name === 'en')?.flavor_text || 
                            'No hay descripción disponible.';

        // Seleccionar la mejor imagen disponible
        const image = getBestPokemonImage(data) || FALLBACK_IMAGE_URL;

        // Construir objeto Pokémon con toda la información
        const pokemon = {
            id: data.id,
            name: capitalizeFirstLetter(data.name),
            height: data.height / 10,
            weight: data.weight / 10,
            types: data.types.map(type => type.type.name),
            abilities: data.abilities.map(ability => capitalizeFirstLetter(ability.ability.name)),
            stats: data.stats.map(stat => ({
                name: stat.stat.name,
                value: stat.base_stat
            })),
            image: image,
            sprites: {
                default: data.sprites.front_default || FALLBACK_IMAGE_URL,
                shiny: data.sprites.front_shiny,
                animated: getAnimatedSprite(data),
                artwork: data.sprites.other?.['official-artwork']?.front_default || FALLBACK_IMAGE_URL
            },
            description: description?.replace(/[\f\n]/g, ' ') || 'No hay descripción disponible.', // Limpiar caracteres de formato
            category: category || 'Pokémon',
            evolution_chain: evolutionData || { chain: { species: { name: data.name }, evolves_to: [] } }
        };

        // Guardar en caché y retornar
        pokemonCache.set(normalizedId, pokemon);
        return pokemon;
    } catch (error) {
        console.error(`Error obteniendo datos del Pokémon ${identifier}:`, error);
        return null;
    }
}

/**
 * Obtiene la mejor imagen disponible para un Pokémon
 * @param {Object} data - Datos del Pokémon de la API
 * @returns {string} URL de la imagen
 */
function getBestPokemonImage(data) {
    // Prioridad: artwork oficial > generación V animado > sprite normal
    return data.sprites?.other?.['official-artwork']?.front_default || 
           getAnimatedSprite(data) || 
           data.sprites?.front_default || 
           FALLBACK_IMAGE_URL;
}

/**
 * Obtiene el sprite animado de la generación V si está disponible
 * @param {Object} data - Datos del Pokémon de la API
 * @returns {string|null} URL del sprite animado o null
 */
function getAnimatedSprite(data) {
    try {
        return data.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default || null;
    } catch (error) {
        return null;
    }
}

/**
 * Obtiene un lote de Pokémon en paralelo con reintentos
 * @param {Array} identifiers - Array de identificadores de Pokémon
 * @returns {Promise<Array>} Array de objetos Pokémon
 */
export async function fetchPokemonBatch(identifiers) {
    if (!identifiers || identifiers.length === 0) return [];
    
    console.log(`Cargando lote de ${identifiers.length} Pokémon`);
    
    const promises = identifiers.map(id => 
        fetchPokemonWithRetry(id, 2) // Intentar hasta 2 veces
    );
    
    try {
        const results = await Promise.all(promises);
        return results.filter(pokemon => pokemon !== null);
    } catch (error) {
        console.error('Error cargando lote de Pokémon:', error);
        return [];
    }
}

/**
 * Intenta obtener un Pokémon con reintentos en caso de fallo
 * @param {string|number} identifier - Identificador del Pokémon
 * @param {number} maxRetries - Número máximo de reintentos
 * @returns {Promise<Object|null>} Datos del Pokémon o null
 */
async function fetchPokemonWithRetry(identifier, maxRetries) {
    let retries = 0;
    let lastError = null;
    
    while (retries <= maxRetries) {
        try {
            const pokemon = await fetchPokemon(identifier);
            if (pokemon) return pokemon;
            
            // Si el resultado es null (no error), intentamos de nuevo
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Esperar más tiempo entre reintentos
        } catch (error) {
            lastError = error;
            retries++;
            console.warn(`Reintento ${retries}/${maxRetries} para ${identifier} debido a: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
    }
    
    console.error(`Todos los reintentos fallaron para ${identifier}`, lastError);
    return null;
}
