package com.example.callservice.api.simple;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calls/simple")
public class SimpleController {

    @GetMapping("/test")
    public String test() {
        return "Simple test works!";
    }
}
