// pokemonAPI.js
import { BASE_URL } from '../utils/constants.js';
import { capitalizeFirstLetter } from '../utils/helpers.js';

let pokemonCache = new Map();

export async function fetchPokemon(identifier) {
    try {
        if (pokemonCache.has(identifier)) {
            return pokemonCache.get(identifier);
        }

        const response = await fetch(`${BASE_URL}/pokemon/${identifier.toLowerCase()}`);
        if (!response.ok) {
            throw new Error('Pokemon no encontrado');
        }
        const data = await response.json();

        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        const evolutionResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionResponse.json();

        const category = speciesData.genera.find(g => g.language.name === 'es')?.genus || '';

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
            image: data.sprites.front_default,
            description: speciesData.flavor_text_entries.find(entry => entry.language.name === 'es')?.flavor_text || '',
            category: category,
            evolution_chain: evolutionData
        };

        pokemonCache.set(identifier, pokemon);
        return pokemon;
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
        return null;
    }
}
