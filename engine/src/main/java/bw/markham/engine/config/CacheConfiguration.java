package bw.markham.engine.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CacheConfiguration {
    @Bean
    CacheManager cacheManager() {
        var cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(java.util.List.of(new CaffeineCache(
                "dailyPrice",
                Caffeine.newBuilder().maximumSize(20_000).expireAfterWrite(Duration.ofMinutes(5)).build())));
        return cacheManager;
    }
}