package ec.edu.uce.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;


@Setter
@Getter
public class PokemonStatDto {
    @JsonProperty("base_stat")
    private Integer baseStat;
    private NamedResource stat;

}
