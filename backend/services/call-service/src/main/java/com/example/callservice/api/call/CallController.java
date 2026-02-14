package com.example.callservice.api.call;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calls")
public class CallController {

	@GetMapping("/health")
	public Map<String, Object> health() {
		return Map.of("service", "call-service", "status", "ok");
	}
}
