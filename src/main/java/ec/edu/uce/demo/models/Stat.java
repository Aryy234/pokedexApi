package ec.edu.uce.demo.models;

import jakarta.persistence.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Entity
public class Stat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private Integer baseStat;

    @ManyToOne
    @JoinColumn(name = "pokemon_id")
    private Pokemon pokemon;
    
}