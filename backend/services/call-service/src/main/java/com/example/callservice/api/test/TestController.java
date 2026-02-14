package com.example.callservice.api.test;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("simpleTestController")
@RequestMapping("/api/calls/simple-test")
public class TestController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Call Service!";
    }

    @GetMapping("/user-assignments")
    public String testUserAssignments() {
        return "User assignments endpoint would work here!";
    }
}
