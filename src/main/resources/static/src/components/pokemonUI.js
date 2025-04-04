// pokemonUI.js
import { formatPokemonNumber, capitalizeFirstLetter } from '../utils/helpers.js';
import { STAT_NAMES, FALLBACK_IMAGE_URL } from '../utils/constants.js';
import { fetchPokemon } from '../services/pokemonAPI.js';

// Manejar errores de carga de imágenes
function handleImageError(img) {
    img.onerror = () => {
        console.warn(`Error cargando imagen: ${img.src}`);
        img.src = FALLBACK_IMAGE_URL;
        img.classList.add('image-fallback');
    };
    return img;
}

/**
 * Crea una tarjeta de Pokémon para la cuadrícula
 * @param {Object} pokemon - Datos del Pokémon
 * @returns {HTMLElement} Elemento de tarjeta
 */
export function createPokemonCard(pokemon) {
    if (!pokemon || !pokemon.id) {
        console.error('Datos de Pokémon inválidos para crear tarjeta', pokemon);
        return document.createElement('div'); // Devolver div vacío en caso de error
    }

    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.dataset.id = pokemon.id;
    
    // Usar artwork oficial si está disponible para las tarjetas
    const imageUrl = pokemon.sprites?.artwork || pokemon.image || FALLBACK_IMAGE_URL;
    
    card.innerHTML = `
        <div class="card-image-container">
            <img src="${imageUrl}" alt="${pokemon.name}" loading="lazy">
        </div>
        <div class="number">Nro ${formatPokemonNumber(pokemon.id)}</div>
        <div class="name">${pokemon.name}</div>
        <div class="types">
            ${pokemon.types.map(type => `<span class="type ${type}">${capitalizeFirstLetter(type)}</span>`).join('')}
        </div>
    `;
    
    // Manejar errores de carga de imagen
    const imgElement = card.querySelector('img');
    handleImageError(imgElement);
    
    // Efecto de clic con animación
    card.addEventListener('click', () => {
        // Añadir clase para efecto de selección
        document.querySelectorAll('.pokemon-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        // Mostrar detalles con animación
        displayPokemonDetails(pokemon);
    });
    
    return card;
}

/**
 * Renderiza la cuadrícula de Pokémon
 * @param {HTMLElement} container - Contenedor de la cuadrícula
 * @param {Array} pokemonList - Lista de Pokémon para mostrar
 */
export function renderPokemonGrid(container, pokemonList) {
    // Validar parámetros para evitar errores
    if (!container || !pokemonList) {
        console.error('Contenedor o lista de Pokémon no válidos', { container, pokemonList });
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Si la lista está vacía o tiene solo elementos nulos/undefined
    const validPokemon = pokemonList.filter(p => p && p.id);
    if (validPokemon.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <p>No se encontraron Pokémon.</p>
            </div>
        `;
        return;
    }
    
    // Crear y agregar tarjetas con efecto de aparición progresiva
    validPokemon.forEach((pokemon, index) => {
        try {
            const card = createPokemonCard(pokemon);
            // Añadir delay progresivo para efecto de aparición
            card.style.animationDelay = `${index * 0.05}s`;
            container.appendChild(card);
        } catch (error) {
            console.error(`Error creando tarjeta para Pokémon ${pokemon?.id || 'desconocido'}:`, error);
        }
    });
    
    // Agregar estilos de animación si no existen
    if (!document.getElementById('card-animations')) {
        const style = document.createElement('style');
        style.id = 'card-animations';
        style.textContent = `
            .pokemon-card {
                animation: fadeIn 0.5s ease forwards;
                opacity: 0;
                transform: translateY(20px);
            }
            @keyframes fadeIn {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .pokemon-card.selected {
                box-shadow: 0 0 0 3px var(--pokedex-blue);
                transform: translateY(-5px) scale(1.05);
            }
            .image-fallback {
                opacity: 0.7;
                filter: grayscale(30%);
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Muestra los detalles de un Pokémon seleccionado
 * @param {Object} pokemon - Datos del Pokémon a mostrar
 */
export async function displayPokemonDetails(pokemon) {
    // Validar que pokemon es un objeto válido
    if (!pokemon || !pokemon.id) {
        console.error('Datos de Pokémon inválidos para mostrar detalles', pokemon);
        return;
    }
    
    try {
        // Obtener los elementos necesarios del DOM
        const detailsContainer = document.querySelector('.pokemon-details');
        if (!detailsContainer) {
            console.error('No se encontró el contenedor de detalles');
            return;
        }
        
        // Animación de transición
        detailsContainer.classList.add('updating');
        
        // Actualizar título y descripción
        document.getElementById('pokemonTitle').textContent = `${pokemon.name} Nro ${formatPokemonNumber(pokemon.id)}`;
        
        const description = document.getElementById('pokemonDescription');
        if (description) {
            description.textContent = pokemon.description?.replace(/[\f\n]/g, ' ') || 'No hay descripción disponible.';
        }
        
        // Usar la imagen de mayor calidad disponible
        const imageElement = document.getElementById('pokemonImage');
        if (imageElement) {
            imageElement.src = pokemon.sprites?.artwork || pokemon.image || FALLBACK_IMAGE_URL;
            imageElement.classList.add('loading');
            imageElement.onload = () => {
                imageElement.classList.remove('loading');
            };
            // Manejar errores de carga
            handleImageError(imageElement);
        }
        
        // Actualizar estadísticas básicas
        const heightEl = document.getElementById('height');
        const weightEl = document.getElementById('weight');
        const categoryEl = document.getElementById('category');
        const abilitiesEl = document.getElementById('abilities');
        
        if (heightEl) heightEl.textContent = `${pokemon.height}m`;
        if (weightEl) weightEl.textContent = `${pokemon.weight}kg`;
        if (categoryEl) categoryEl.textContent = pokemon.category || 'Desconocido';
        
        // Actualizar habilidades
        if (abilitiesEl) {
            const abilitiesText = pokemon.abilities?.join(', ') || 'Desconocido';
            abilitiesEl.textContent = abilitiesText;
        }
        
        // Actualizar tipos
        const typesContainer = document.getElementById('types');
        if (typesContainer) {
            typesContainer.innerHTML = pokemon.types
                .map(type => `<span class="type ${type}" title="${capitalizeFirstLetter(type)}">${capitalizeFirstLetter(type)}</span>`)
                .join('');
        }
        
        // Actualizar barras de estadísticas con animación
        const statBars = document.querySelectorAll('.stat-bar');
        if (pokemon.stats && statBars.length > 0) {
            pokemon.stats.forEach(stat => {
                const statName = STAT_NAMES[stat.name];
                if (!statName) return;
                
                statBars.forEach(bar => {
                    const label = bar.querySelector('span:first-child');
                    if (label && label.textContent === statName) {
                        const progressBar = bar.querySelector('.progress');
                        const valueSpan = bar.querySelector('span:last-child');
                        
                        if (progressBar && valueSpan) {
                            // Resetear para animación
                            progressBar.style.width = '0%';
                            valueSpan.textContent = '0';
                            
                            // Animar con pequeño retraso
                            setTimeout(() => {
                                const percentage = Math.min((stat.value / 255) * 100, 100);
                                progressBar.style.width = `${percentage}%`;
                                
                                // Animar valor numérico
                                let startValue = 0;
                                const duration = 1000;
                                const increment = stat.value / (duration / 16);
                                const updateValue = () => {
                                    startValue += increment;
                                    if (startValue >= stat.value) {
                                        valueSpan.textContent = stat.value;
                                    } else {
                                        valueSpan.textContent = Math.floor(startValue);
                                        requestAnimationFrame(updateValue);
                                    }
                                };
                                updateValue();
                            }, 300);
                        }
                    }
                });
            });
        }
        
        // Actualizar cadena evolutiva
        if (pokemon.evolution_chain) {
            await updateEvolutionChain(pokemon.evolution_chain);
        }
        
        // Quitar clase de animación
        setTimeout(() => {
            detailsContainer.classList.remove('updating');
        }, 300);
        
    } catch (error) {
        console.error('Error al mostrar detalles del Pokémon:', error);
        // Intentar quitar clase de animación en caso de error
        document.querySelector('.pokemon-details')?.classList.remove('updating');
    }
    
    // Añadir estilos de animación si no existen
    if (!document.getElementById('details-animations')) {
        const style = document.createElement('style');
        style.id = 'details-animations';
        style.textContent = `
            .pokemon-details.updating {
                opacity: 0.7;
                transform: scale(0.98);
                transition: all 0.3s ease;
            }
            .pokemon-details {
                opacity: 1;
                transform: scale(1);
                transition: all 0.3s ease;
            }
            #pokemonImage.loading {
                opacity: 0.5;
            }
            #pokemonImage {
                transition: all 0.3s ease;
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Actualiza la cadena evolutiva con animaciones
 * @param {Object} evolutionData - Datos de evolución del Pokémon
 */
export async function updateEvolutionChain(evolutionData) {
    try {
        const evolutionRow = document.querySelector('.evolution-row');
        if (!evolutionRow) {
            console.error('No se encontró el contenedor de evoluciones');
            return;
        }
        
        evolutionRow.innerHTML = '';
        
        // Verificar que evolutionData es un objeto válido
        if (!evolutionData || !evolutionData.chain) {
            evolutionRow.innerHTML = `<p class="no-evolution">No hay datos de evolución disponibles.</p>`;
            return;
        }
        
        // Añadir clase para animación
        evolutionRow.classList.add('updating');
        
        // Extraer cadena evolutiva
        let evoChain = [];
        let currentEvo = evolutionData.chain;
        let maxEvolutions = 10; // Límite para evitar bucles infinitos
        let count = 0;
        
        while (currentEvo && count < maxEvolutions) {
            count++; // Incrementar contador para evitar bucles infinitos
            
            const pokemonName = currentEvo.species?.name;
            if (!pokemonName) {
                break;
            }
            
            try {
                const pokemon = await fetchPokemon(pokemonName);
                if (pokemon) {
                    evoChain.push(pokemon);
                }
            } catch (error) {
                console.warn(`Error cargando evolución ${pokemonName}:`, error);
            }
            
            // Manejo de múltiples evoluciones
            if (currentEvo.evolves_to?.length > 1) {
                // Si hay múltiples evoluciones, tomar la primera por ahora
                currentEvo = currentEvo.evolves_to[0];
            } else if (currentEvo.evolves_to?.length === 1) {
                currentEvo = currentEvo.evolves_to[0];
            } else {
                break; // No hay más evoluciones
            }
        }
        
        // Si no hay evoluciones
        if (evoChain.length === 0) {
            evolutionRow.innerHTML = `<p class="no-evolution">Este Pokémon no tiene evoluciones conocidas.</p>`;
            evolutionRow.classList.remove('updating');
            return;
        }
        
        // Crear elementos de evolución con retraso para animación
        evoChain.forEach((pokemon, index) => {
            const evolutionItem = document.createElement('div');
            evolutionItem.className = 'evolution-item';
            evolutionItem.style.animationDelay = `${index * 0.2}s`;
            
            // Usar mejor imagen disponible
            const imageUrl = pokemon.sprites?.artwork || pokemon.image || FALLBACK_IMAGE_URL;
            
            evolutionItem.innerHTML = `
                <img src="${imageUrl}" alt="${pokemon.name}" style="cursor: pointer;">
                <span>${pokemon.name}</span>
                <span class="evolution-number">Nro. ${formatPokemonNumber(pokemon.id)}</span>
            `;
            
            // Manejar errores de carga de imagen
            const imgElement = evolutionItem.querySelector('img');
            handleImageError(imgElement);
            
            // Evento al hacer clic en una evolución
            const img = evolutionItem.querySelector('img');
            img.addEventListener('click', () => {
                // Buscar la tarjeta correspondiente y hacer clic en ella si existe
                const card = document.querySelector(`.pokemon-card[data-id="${pokemon.id}"]`);
                if (card) {
                    card.click();
                    // Desplazar hacia la tarjeta
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    // Si no hay tarjeta, mostrar los detalles directamente
                    displayPokemonDetails(pokemon);
                }
            });
            
            evolutionRow.appendChild(evolutionItem);
            
            // Añadir flecha entre evoluciones
            if (index < evoChain.length - 1) {
                const arrow = document.createElement('span');
                arrow.className = 'evolution-arrow';
                arrow.innerHTML = `<span>→</span>`;
                arrow.style.animationDelay = `${index * 0.2 + 0.1}s`;
                evolutionRow.appendChild(arrow);
            }
        });
        
        // Quitar clase de animación
        setTimeout(() => {
            evolutionRow.classList.remove('updating');
        }, 300);
        
    } catch (error) {
        console.error('Error al actualizar la cadena evolutiva:', error);
        // Intentar quitar clase de animación en caso de error
        document.querySelector('.evolution-row')?.classList.remove('updating');
        document.querySelector('.evolution-row').innerHTML = 
            `<p class="error-evolution">Error al cargar la cadena evolutiva: ${error.message}</p>`;
    }
    
    // Añadir estilos de animación si no existen
    if (!document.getElementById('evolution-animations')) {
        const style = document.createElement('style');
        style.id = 'evolution-animations';
        style.textContent = `
            .evolution-row.updating {
                opacity: 0.5;
            }
            .evolution-item, .evolution-arrow {
                animation: fadeInUp 0.5s ease forwards;
                opacity: 0;
                transform: translateY(20px);
            }
            @keyframes fadeInUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .evolution-number {
                display: block;
                font-size: 12px;
                opacity: 0.7;
            }
            .no-evolution {
                font-style: italic;
                opacity: 0.7;
            }
            .error-evolution {
                color: #cc0000;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }
}
