package ec.edu.uce.demo.models;

import java.util.HashSet;
import java.util.Set;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Entity
public class Pokemon {

    @Id
    private Long id;

    private String name;
    
    private Integer baseExperience;

    // Relación ManyToMany con Ability
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(name = "pokemon_ability",
        joinColumns = @JoinColumn(name = "pokemon_id"),
        inverseJoinColumns = @JoinColumn(name = "ability_id"))
    private Set<Ability> abilities = new HashSet<>();

    // Relación OneToMany con Stat
    @OneToMany(mappedBy = "pokemon", cascade = CascadeType.ALL)
    private Set<Stat> stats = new HashSet<>();

    // Relación OneToOne con Sprite
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "sprite_id")
    private Sprite sprite;

    // Relación ManyToMany con Type
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(name = "pokemon_type",
        joinColumns = @JoinColumn(name = "pokemon_id"),
        inverseJoinColumns = @JoinColumn(name = "type_id"))
    private Set<Type> types = new HashSet<>();

    // Relación ManyToOne con Evolution (muchos Pokémon pueden pertenecer a una misma cadena evolutiva)
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "evolution_id")
    private Evolution evolution;

}
