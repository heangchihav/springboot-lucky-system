package com.example.callservice.entity.callreport;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CallType {
    NEW_CALL("new-call"),
    RECALL("recall");

    private final String value;

    CallType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static CallType fromValue(String value) {
        for (CallType type : CallType.values()) {
            if (type.getValue().equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown call type: " + value);
    }
}
