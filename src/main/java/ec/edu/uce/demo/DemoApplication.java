// DemoApplication.java
package ec.edu.uce.demo;

import ec.edu.uce.demo.service.PokeApiService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication

public class DemoApplication {
	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	CommandLineRunner run(PokeApiService pokeApiService) {
		return args -> {
			pokeApiService.fetchAndSaveAllPokemon()
					.doOnComplete(() -> System.out.println("Todos los Pokémon han sido procesados."))
					.subscribe();
		};
	}

}