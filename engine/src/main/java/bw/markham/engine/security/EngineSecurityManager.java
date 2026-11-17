package bw.markham.engine.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EngineSecurityManager {
    private final String apiKey;

    public EngineSecurityManager(@Value("${markham.security.api-key:}") String apiKey) {
        this.apiKey = apiKey;
    }

    public boolean isValidApiKey(String candidate) {
        if (apiKey.isBlank() || candidate == null) return false;
        return MessageDigest.isEqual(
                apiKey.getBytes(StandardCharsets.UTF_8), candidate.getBytes(StandardCharsets.UTF_8));
    }
}