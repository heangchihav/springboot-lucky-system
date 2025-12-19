package com.example.demo.security.device;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Device information for token binding.
 * Creates a fingerprint from request characteristics to bind tokens to devices.
 */
public class DeviceInfo {

    private final String fingerprint;
    private final String deviceName;
    private final String ipAddress;
    private final String ipPrefix;
    private final String userAgent;
    private final String userAgentHash;
    private final String deviceId; // Client-provided device ID (optional)

    private DeviceInfo(String fingerprint, String deviceName, String ipAddress, 
                       String ipPrefix, String userAgent, String userAgentHash, String deviceId) {
        this.fingerprint = fingerprint;
        this.deviceName = deviceName;
        this.ipAddress = ipAddress;
        this.ipPrefix = ipPrefix;
        this.userAgent = userAgent;
        this.userAgentHash = userAgentHash;
        this.deviceId = deviceId;
    }

    /**
     * Extract device info from HTTP request.
     * Creates a fingerprint based on User-Agent, IP prefix, and optional device ID.
     */
    public static DeviceInfo fromRequest(HttpServletRequest request) {
        return fromRequest(request, null);
    }

    /**
     * Extract device info from HTTP request with optional client-provided device ID.
     */
    public static DeviceInfo fromRequest(HttpServletRequest request, String clientDeviceId) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            userAgent = "Unknown";
        }

        String ipAddress = extractClientIp(request);
        String ipPrefix = extractIpPrefix(ipAddress);
        String userAgentHash = hashSha256(userAgent);
        
        // Device ID: prefer client-provided, fallback to header
        String deviceId = clientDeviceId;
        if (deviceId == null || deviceId.isBlank()) {
            deviceId = request.getHeader("X-Device-ID");
        }
        
        // Create fingerprint from stable characteristics
        // Include device ID if provided for stronger binding
        String fingerprintSource = userAgentHash + "|" + ipPrefix;
        if (deviceId != null && !deviceId.isBlank()) {
            fingerprintSource += "|" + deviceId;
        }
        String fingerprint = hashSha256(fingerprintSource);
        
        // Parse user agent for device name
        String deviceName = parseDeviceName(userAgent);

        return new DeviceInfo(fingerprint, deviceName, ipAddress, ipPrefix, userAgent, userAgentHash, deviceId);
    }

    /**
     * Create device info with custom fingerprint (for testing or API clients).
     */
    public static DeviceInfo withCustomFingerprint(String fingerprint, String deviceName, 
                                                    String ipAddress, String deviceId) {
        String ipPrefix = extractIpPrefix(ipAddress);
        return new DeviceInfo(fingerprint, deviceName, ipAddress, ipPrefix, "Custom", 
                              hashSha256("Custom"), deviceId);
    }

    /**
     * Extract client IP, handling proxies.
     */
    private static String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take first IP in chain (original client)
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    /**
     * Extract IP prefix for fingerprinting.
     * For IPv4: first 3 octets (e.g., 192.168.1.x)
     * For IPv6: first 4 groups
     * This allows for some IP variation while maintaining security.
     */
    private static String extractIpPrefix(String ip) {
        if (ip == null) {
            return "unknown";
        }
        
        if (ip.contains(":")) {
            // IPv6 - take first 4 groups
            String[] parts = ip.split(":");
            if (parts.length >= 4) {
                return parts[0] + ":" + parts[1] + ":" + parts[2] + ":" + parts[3];
            }
            return ip;
        } else {
            // IPv4 - take first 3 octets
            String[] parts = ip.split("\\.");
            if (parts.length >= 3) {
                return parts[0] + "." + parts[1] + "." + parts[2];
            }
            return ip;
        }
    }

    /**
     * Parse user agent to get a human-readable device name.
     */
    private static String parseDeviceName(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return "Unknown Device";
        }

        // Simple parsing - in production, use a proper UA parser library
        String ua = userAgent.toLowerCase();
        
        String os;
        if (ua.contains("windows")) {
            os = "Windows";
        } else if (ua.contains("mac os")) {
            os = "macOS";
        } else if (ua.contains("linux")) {
            os = "Linux";
        } else if (ua.contains("android")) {
            os = "Android";
        } else if (ua.contains("iphone") || ua.contains("ipad")) {
            os = "iOS";
        } else {
            os = "Unknown OS";
        }

        String browser;
        if (ua.contains("chrome") && !ua.contains("edg")) {
            browser = "Chrome";
        } else if (ua.contains("firefox")) {
            browser = "Firefox";
        } else if (ua.contains("safari") && !ua.contains("chrome")) {
            browser = "Safari";
        } else if (ua.contains("edg")) {
            browser = "Edge";
        } else {
            browser = "Browser";
        }

        return browser + " on " + os;
    }

    /**
     * Hash using SHA-256.
     */
    public static String hashSha256(String source) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(source.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    // Getters

    public String getFingerprint() {
        return fingerprint;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public String getIpPrefix() {
        return ipPrefix;
    }

    public String getUserAgentHash() {
        return userAgentHash;
    }

    public String getDeviceId() {
        return deviceId;
    }

    /**
     * Check if this device info matches another (for validation).
     * Validates: UA hash + IP prefix + device ID (if present)
     */
    public boolean matches(String storedUaHash, String storedIpPrefix, String storedDeviceId) {
        // UA hash must match
        if (!this.userAgentHash.equals(storedUaHash)) {
            return false;
        }
        // IP prefix must match
        if (!this.ipPrefix.equals(storedIpPrefix)) {
            return false;
        }
        // Device ID must match if it was stored
        if (storedDeviceId != null && !storedDeviceId.isBlank()) {
            if (this.deviceId == null || !this.deviceId.equals(storedDeviceId)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public String toString() {
        return "DeviceInfo{" +
                "deviceName='" + deviceName + '\'' +
                ", ipAddress='" + ipAddress + '\'' +
                '}';
    }
}
