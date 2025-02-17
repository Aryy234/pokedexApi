package ec.edu.uce.demo.controllers;

import ec.edu.uce.demo.models.Pokemon;
import ec.edu.uce.demo.models.Type;
import ec.edu.uce.demo.models.Ability;
import ec.edu.uce.demo.service.PokeApiService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/pokemon")
public class PokemonController {

    private final PokeApiService pokeApiService;

    public PokemonController(PokeApiService pokeApiService) {
        this.pokeApiService = pokeApiService;
    }

    // Endpoint para disparar la carga y guardado de todos los Pokémon.
    @GetMapping("/fetch")
    public Flux<Pokemon> fetchAndSaveAllPokemon() {
        return pokeApiService.fetchAndSaveAllPokemon();
    }

    @GetMapping("/searchByName")
    public Mono<Pokemon> searchPokemonByName(@RequestParam("name") String name) {
        return pokeApiService.findPokemonByName(name).next();
    }

    // Buscar por número de Pokémon (usando su id) (ej: /api/pokemon/25)
    @GetMapping("/{id}")
    public Mono<Pokemon> getPokemonById(@PathVariable("id") Long id) {
        return pokeApiService.findPokemonById(id);
    }

    // Mostrar todos los tipos de Pokémon
    @GetMapping("/types")
    public Flux<Type> getDistinctTypes() {
        return pokeApiService.findAllDistinctTypes();
    }

    // Listado de todas las habilidades de Pokémon
    @GetMapping("/abilities")
    public Flux<Ability> getDistinctAbilities() {
        return pokeApiService.findAllDistinctAbilities();
    }
}
