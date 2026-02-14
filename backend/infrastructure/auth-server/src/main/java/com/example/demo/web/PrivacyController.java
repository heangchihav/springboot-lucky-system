package com.example.demo.web;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@ConditionalOnProperty(name = "app.web.ui", havingValue = "thymeleaf")
public class PrivacyController {

    @GetMapping("/privacy")
    public String privacy() {
        return "privacy";
    }
}
