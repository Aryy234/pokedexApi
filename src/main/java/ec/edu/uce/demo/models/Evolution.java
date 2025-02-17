package ec.edu.uce.demo.models;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Entity
public class Evolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Por simplicidad, se guarda una cadena que identifique la evolución.
    // En un caso real podrías modelar cada eslabón evolutivo de forma más detallada.
    private String evolutionChain;

    @OneToMany(mappedBy = "evolution", cascade = CascadeType.ALL)
    private Set<Pokemon> pokemons = new HashSet<>();

}