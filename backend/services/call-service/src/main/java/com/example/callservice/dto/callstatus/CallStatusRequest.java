package com.example.callservice.dto.callstatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CallStatusRequest {

    @NotBlank
    @Size(max = 100)
    private String key;

    @NotBlank
    @Size(max = 100)
    private String label;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
