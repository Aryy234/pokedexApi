package ec.edu.uce.demo.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString

public class PokemonListResponse {
    private int count;
    private String next;
    private String previous;
    private List<PokemonRef> results;

    // Getters y setters
}

