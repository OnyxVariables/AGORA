package com.agora.votations;

import com.agora.votations.service.BlockchainListenerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@Slf4j
public class VotationsApplication {

	public static void main(String[] args) {
		SpringApplication.run(VotationsApplication.class, args);
	}

	@Bean
	CommandLineRunner verifyBeans(BlockchainListenerService listener) {
		return args -> {
			log.info("VERIFICACION: BlockchainListenerService bean exists: {}", listener != null);
		};
	}

}
