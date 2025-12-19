package com.example.demo.user;

import java.util.Collections;
import java.util.Optional;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<UserService> selfProvider;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       ObjectProvider<UserService> selfProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.selfProvider = selfProvider;
    }

    @CacheEvict(cacheNames = "usersByUsername", key = "#username")
    public com.example.demo.user.User register(String username, String rawPassword, String fullName) {
        com.example.demo.user.User u = new com.example.demo.user.User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setFullName(fullName);
        return save(u);
    }

    @Cacheable(cacheNames = "usersByUsername", key = "#username", unless = "#result == null")
    public com.example.demo.user.User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public Optional<com.example.demo.user.User> findUserByUsername(String username) {
        return Optional.ofNullable(selfProvider.getObject().getUserByUsername(username));
    }

    @CacheEvict(cacheNames = "usersByUsername", key = "#user.username")
    public com.example.demo.user.User save(com.example.demo.user.User user) {
        return userRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        com.example.demo.user.User u = selfProvider.getObject().getUserByUsername(username);
        if (u == null) {
            throw new UsernameNotFoundException("User not found");
        }

        UserBuilder builder = User.withUsername(u.getUsername())
                .password(u.getPassword())
                .authorities(Collections.emptyList()); // no roles for now

        return builder.build();
    }
}