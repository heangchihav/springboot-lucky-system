package com.example.callservice.service;

import com.example.callservice.entity.User;
import com.example.callservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<User> getActiveUsers() {
        return userRepository.findByActive(true);
    }
    
    public List<User> getActiveUsersOrderByFullName() {
        return userRepository.findActiveUsersOrderByFullName();
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public List<User> searchUsersByName(String name) {
        return userRepository.findActiveUsersByNameContaining(name);
    }
    
    public List<User> searchUsersByUsername(String username) {
        return userRepository.findActiveUsersByUsernameContaining(username);
    }
    
    public List<User> getUsersByBranch(Long branchId) {
        return userRepository.findActiveUsersByBranch(branchId);
    }
    
    public List<User> getUsersByArea(Long areaId) {
        return userRepository.findActiveUsersByArea(areaId);
    }
    
    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("User with username '" + user.getUsername() + "' already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("User with email '" + user.getEmail() + "' already exists");
        }
        return userRepository.save(user);
    }
    
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        if (!user.getUsername().equals(userDetails.getUsername()) && 
            userRepository.existsByUsername(userDetails.getUsername())) {
            throw new IllegalArgumentException("User with username '" + userDetails.getUsername() + "' already exists");
        }
        
        if (!user.getEmail().equals(userDetails.getEmail()) && 
            userRepository.existsByEmail(userDetails.getEmail())) {
            throw new IllegalArgumentException("User with email '" + userDetails.getEmail() + "' already exists");
        }
        
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setFirstName(userDetails.getFirstName());
        user.setLastName(userDetails.getLastName());
        user.setPhone(userDetails.getPhone());
        user.setActive(userDetails.getActive());
        
        return userRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        userRepository.delete(user);
    }
    
    public User deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        user.setActive(false);
        return userRepository.save(user);
    }
    
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        user.setActive(true);
        return userRepository.save(user);
    }
}
