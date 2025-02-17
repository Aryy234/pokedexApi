package ec.edu.uce.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PokemonSpeciesDto {
    private EvolutionChainReference evolution_chain;


    @Getter
    @Setter
    public static class EvolutionChainReference {
        private String url;
    }
}
