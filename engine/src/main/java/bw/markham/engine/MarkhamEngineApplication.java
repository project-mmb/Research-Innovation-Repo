package bw.markham.engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MarkhamEngineApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarkhamEngineApplication.class, args);
    }
}