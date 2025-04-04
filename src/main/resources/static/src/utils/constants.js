export const BASE_URL = 'https://pokeapi.co/api/v2';
export const POKEMON_PER_PAGE = 151;

export const STAT_NAMES = {
    'hp': 'PS',
    'attack': 'Ataque',
    'defense': 'Defensa',
    'special-attack': 'At. Esp.',
    'special-defense': 'Def. Esp.',
    'speed': 'Velocidad'
};

// Funciones de utilidad para manejar errores de API
export const API_TIMEOUT = 30000; // 30 segundos de timeout para peticiones

// URLs alternativas por si la principal falla
export const FALLBACK_IMAGE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
