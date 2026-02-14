package com.example.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Mono<Map<String, Object>> root() {
        return Mono.just(Map.of(
                "service", "gateway",
                "status", "ok",
                "message", "Gateway API is running"));
    }

    @GetMapping("/favicon.ico")
    public Mono<Void> favicon() {
        return Mono.empty();
    }
}
