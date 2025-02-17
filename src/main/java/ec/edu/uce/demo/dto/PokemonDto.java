package ec.edu.uce.demo.dto;


import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class PokemonDto {

    private Long id;
    private String name;
    
    @JsonProperty("base_experience")
    private Integer baseExperience;
    
    private List<PokemonAbilityDto> abilities;
    private List<PokemonStatDto> stats;
    private PokemonSpritesDto sprites;
    private List<PokemonTypeDto> types;

    // Getters y setters


}

