package com.example.marketingservice.dto.problem;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MarketingProblemRequest {

    @NotBlank(message = "Problem name is required")
    @Size(max = 255, message = "Problem name must not exceed 255 characters")
    private String name;

    public MarketingProblemRequest() {
    }

    public MarketingProblemRequest(String name) {
        this.name = name;
    }

    // Getters and setters

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
