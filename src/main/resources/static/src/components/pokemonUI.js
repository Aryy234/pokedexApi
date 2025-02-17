// pokemonUI.js
import { formatPokemonNumber, capitalizeFirstLetter } from '../utils/helpers.js';
import { STAT_NAMES } from '../utils/constants.js';
import { fetchPokemon } from '../services/pokemonAPI.js';

export function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.innerHTML = `
        <img src="${pokemon.image}" alt="${pokemon.name}">
        <div class="number">Nro ${formatPokemonNumber(pokemon.id)}</div>
        <div class="name">${pokemon.name}</div>
        <div class="types">
            ${pokemon.types.map(type => `<span class="type ${type}">${capitalizeFirstLetter(type)}</span>`).join('')}
        </div>
    `;
    card.addEventListener('click', () => displayPokemonDetails(pokemon));
    return card;
}

export function renderPokemonGrid(pokemonGrid, pokemonList) {
    pokemonGrid.innerHTML = '';
    pokemonList.forEach(pokemon => {
        if (pokemon) {
            pokemonGrid.appendChild(createPokemonCard(pokemon));
        }
    });
}

export async function displayPokemonDetails(pokemon) {
    document.getElementById('pokemonTitle').textContent = `${pokemon.name} Nro ${formatPokemonNumber(pokemon.id)}`;
    document.getElementById('pokemonDescription').textContent = pokemon.description;
    document.getElementById('pokemonImage').src = pokemon.image;
    document.getElementById('height').textContent = `${pokemon.height}m`;
    document.getElementById('weight').textContent = `${pokemon.weight}kg`;
    document.getElementById('category').textContent = pokemon.category;

    const abilitiesText = pokemon.abilities.join(', ');
    document.getElementById('abilities').textContent = abilitiesText;

    const typesContainer = document.getElementById('types');
    typesContainer.innerHTML = pokemon.types
        .map(type => `<span class="type ${type}">${capitalizeFirstLetter(type)}</span>`)
        .join('');

    const statBars = document.querySelectorAll('.stat-bar');
    pokemon.stats.forEach(stat => {
        const statName = STAT_NAMES[stat.name];

        statBars.forEach(bar => {
            const label = bar.querySelector('span:first-child');
            if (label && label.textContent === statName) {
                const progressBar = bar.querySelector('.progress');
                const valueSpan = bar.querySelector('span:last-child');
                if (progressBar && valueSpan) {
                    const percentage = (stat.value / 255) * 100;
                    progressBar.style.width = `${percentage}%`;
                    valueSpan.textContent = stat.value;
                }
            }
        });
    });

    await updateEvolutionChain(pokemon.evolution_chain);
}

export async function updateEvolutionChain(evolutionData) {
    const evolutionRow = document.querySelector('.evolution-row');
    evolutionRow.innerHTML = '';

    let evoChain = [];
    let currentEvo = evolutionData.chain;

    while (currentEvo) {
        const pokemonName = currentEvo.species.name;
        const pokemon = await fetchPokemon(pokemonName);
        if (pokemon) {
            evoChain.push(pokemon);
        }
        currentEvo = currentEvo.evolves_to[0];
    }

    evoChain.forEach((pokemon, index) => {
        const evolutionItem = document.createElement('div');
        evolutionItem.className = 'evolution-item';
        evolutionItem.innerHTML = `
            <img src="${pokemon.image}" alt="${pokemon.name}" style="cursor: pointer;">
            <span>${pokemon.name} Nro. ${formatPokemonNumber(pokemon.id)}</span>
        `;

        const img = evolutionItem.querySelector('img');
        img.addEventListener('click', () => displayPokemonDetails(pokemon));

        evolutionRow.appendChild(evolutionItem);

        if (index < evoChain.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'evolution-arrow';
            arrow.textContent = '→';
            evolutionRow.appendChild(arrow);
        }
    });
}
