package ec.edu.uce.demo.apiConfig;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer ->
                        configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024)) // 16 MB
                .build();

        return WebClient.builder()
                .baseUrl("https://pokeapi.co/api/v2")
                .exchangeStrategies(strategies)
                .build();
    }
}
