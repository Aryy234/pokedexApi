// helpers.js
export function formatPokemonNumber(number) {
    return number.toString().padStart(4, '0');
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
