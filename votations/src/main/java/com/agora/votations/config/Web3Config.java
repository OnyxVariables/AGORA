package com.agora.votations.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Configuration
public class Web3Config {

    @Value("${web3j.client-url:http://localhost:8545}")
    private String web3jClientUrl;

    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(web3jClientUrl));
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}