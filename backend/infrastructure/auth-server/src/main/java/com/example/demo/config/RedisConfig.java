package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Redis configuration for token blacklist.
 * Redis is optional - if not available, blacklist will be disabled gracefully.
 */
@Configuration
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(connectionFactory);
        
        // Test connection
        try {
            template.getConnectionFactory().getConnection().ping();
            log.info("Redis connection established successfully");
        } catch (Exception e) {
            log.warn("Redis connection failed - token blacklist will be disabled: {}", e.getMessage());
        }
        
        return template;
    }
}
