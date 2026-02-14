package com.example.callservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy
public class CallServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CallServiceApplication.class, args);
	}
}
