package ec.edu.uce.demo.service;

import ec.edu.uce.demo.dto.*;
import ec.edu.uce.demo.models.*;
import ec.edu.uce.demo.repository.PokemonRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PokeApiService {

    private final WebClient webClient;
    private final PokemonRepository pokemonRepository;

    public PokeApiService(WebClient webClient, PokemonRepository pokemonRepository) {
        this.webClient = webClient;
        this.pokemonRepository = pokemonRepository;
    }

    public Flux<Pokemon> fetchAndSaveAllPokemon() {
        return Flux.defer(() -> {
            long startTime = System.currentTimeMillis();
            return webClient.get()
                    .uri("/pokemon?limit=1000")
                    .retrieve()
                    .bodyToMono(PokemonListResponse.class)
                    .flatMapMany(response -> Flux.fromIterable(response.getResults()))
                    .flatMap(pokemonRef ->
                            webClient.get()
                                    .uri(pokemonRef.getUrl())
                                    .retrieve()
                                    .bodyToMono(PokemonDto.class)
                                    // Convertimos el DTO a entidad incluyendo la evolución
                                    .flatMap(this::convertDtoToEntity)
                                    // Se cambia de contexto para operaciones bloqueantes (JPA)
                                    .publishOn(Schedulers.boundedElastic())
                                    .doOnNext(pokemon -> {
                                        pokemonRepository.save(pokemon);
                                        System.out.println("Guardado: " + pokemon.getName());
                                    })
                    )
                    .doOnComplete(() -> {
                        long elapsedTime = System.currentTimeMillis() - startTime;
                        double seconds = elapsedTime / 1000.0;
                        System.out.println("Tiempo de carga: " + seconds + " s");
                    })
                    .doOnError(error -> System.err.println("Error en la carga: " + error.getMessage()));
        });
    }

    /**
     * Convierte el DTO de Pokémon a la entidad y consulta los endpoints necesarios
     * para asignar la evolución.
     */
    private Mono<Pokemon> convertDtoToEntity(PokemonDto dto) {
        Pokemon pokemon = new Pokemon();
        pokemon.setId(dto.getId());
        pokemon.setName(dto.getName());
        pokemon.setBaseExperience(dto.getBaseExperience());

        // Mapear habilidades
        Set<Ability> abilities = dto.getAbilities().stream().map(abilityDto -> {
            Ability ability = new Ability();
            ability.setName(abilityDto.getAbility().getName());
            return ability;
        }).collect(Collectors.toSet());
        pokemon.setAbilities(abilities);

        // Mapear estadísticas
        Set<Stat> stats = dto.getStats().stream().map(statDto -> {
            Stat stat = new Stat();
            stat.setName(statDto.getStat().getName());
            stat.setBaseStat(statDto.getBaseStat());
            stat.setPokemon(pokemon);
            return stat;
        }).collect(Collectors.toSet());
        pokemon.setStats(stats);

        // Mapear sprite
        Sprite sprite = new Sprite();
        sprite.setFrontDefault(dto.getSprites().getFrontDefault());
        pokemon.setSprite(sprite);

        // Mapear tipos
        Set<Type> types = dto.getTypes().stream().map(typeDto -> {
            Type type = new Type();
            type.setName(typeDto.getType().getName());
            return type;
        }).collect(Collectors.toSet());
        pokemon.setTypes(types);

        // Consultar el endpoint de species para obtener la URL de la cadena evolutiva
        return webClient.get()
                .uri("/pokemon-species/" + dto.getId() + "/")
                .retrieve()
                .bodyToMono(PokemonSpeciesDto.class)
                .flatMap(speciesDto -> {
                    String evolutionChainUrl = speciesDto.getEvolution_chain().getUrl();
                    // Consultar la evolución usando la URL obtenida
                    return webClient.get()
                            .uri(evolutionChainUrl)
                            .retrieve()
                            .bodyToMono(EvolutionChainDto.class)
                            .map(evoChainDto -> {
                                Evolution evolution = new Evolution();
                                evolution.setEvolutionChain("Evolution chain id: " + evoChainDto.getId());
                                pokemon.setEvolution(evolution);
                                return pokemon;
                            });
                })
                .switchIfEmpty(Mono.just(pokemon));
    }

    // Métodos de consulta para los filtros

    public Mono<Pokemon> findPokemonById(Long id) {
        return Mono.fromCallable(() -> pokemonRepository.findById(id).orElse(null))
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Flux<Pokemon> findPokemonByName(String name) {
        return Flux.defer(() -> Flux.fromIterable(pokemonRepository.findByNameContainingIgnoreCase(name)))
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Flux<Type> findAllDistinctTypes() {
        return Flux.defer(() -> Flux.fromIterable(pokemonRepository.findDistinctTypes()))
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Flux<Ability> findAllDistinctAbilities() {
        return Flux.defer(() -> Flux.fromIterable(pokemonRepository.findDistinctAbilities()))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
