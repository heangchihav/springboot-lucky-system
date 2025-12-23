package com.example.callservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AreaDTO {
    
    private Long id;
    
    @NotBlank(message = "Area name is required")
    @Size(max = 100, message = "Area name must not exceed 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    private String code;
    
    private Boolean active;
    
    private Long branchCount;
    
    // Constructors
    public AreaDTO() {}
    
    public AreaDTO(String name, String description, String code) {
        this.name = name;
        this.description = description;
        this.code = code;
        this.active = true;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
    
    public Long getBranchCount() {
        return branchCount;
    }
    
    public void setBranchCount(Long branchCount) {
        this.branchCount = branchCount;
    }
}
