package ec.edu.uce.demo.repository;

import ec.edu.uce.demo.models.Pokemon;
import ec.edu.uce.demo.models.Type;
import ec.edu.uce.demo.models.Ability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PokemonRepository extends JpaRepository<Pokemon, Long> {

    // Busca Pokémon cuyo nombre contenga la cadena (sin distinguir mayúsculas/minúsculas)
    List<Pokemon> findByNameContainingIgnoreCase(String name);

    // Consulta para obtener los tipos de Pokémon de forma única
    @Query("SELECT DISTINCT t FROM Pokemon p JOIN p.types t")
    List<Type> findDistinctTypes();

    // Consulta para obtener las habilidades de Pokémon de forma única
    @Query("SELECT DISTINCT a FROM Pokemon p JOIN p.abilities a")
    List<Ability> findDistinctAbilities();
}
