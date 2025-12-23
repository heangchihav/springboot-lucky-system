package com.example.demo.user;

import com.example.demo.service.UserServiceEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_x_service")
public class UserXService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private UserServiceEntity service;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "assigned_by")
    private String assignedBy;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    public UserXService() {
        this.assignedAt = Instant.now();
    }

    public UserXService(User user, UserServiceEntity service, String assignedBy) {
        this();
        this.user = user;
        this.service = service;
        this.assignedBy = assignedBy;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public UserServiceEntity getService() { return service; }
    public void setService(UserServiceEntity service) { this.service = service; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
