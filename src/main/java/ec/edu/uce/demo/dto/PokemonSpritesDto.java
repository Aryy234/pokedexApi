package ec.edu.uce.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PokemonSpritesDto {
    @JsonProperty("front_default")
    private String frontDefault;

}

