package bw.markham.engine.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiKeyFilter extends OncePerRequestFilter {
    private final EngineSecurityManager securityManager;

    public ApiKeyFilter(EngineSecurityManager securityManager) {
        this.securityManager = securityManager;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        if ("OPTIONS".equals(request.getMethod())) return true;
        if ("GET".equals(request.getMethod())
                && (path.equals("/api/v1/properties")
                        || path.equals("/api/v1/districts")
                        || path.equals("/api/v1/analytics/areas")
                        || path.equals("/api/v1/health")
                        || path.equals("/api/v1/pricing/quote")
                        || path.equals("/api/v1/pricing/decisions"))) {
            return true;
        }
        return !path.startsWith("/api/v1/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        String candidate = authorization != null && authorization.startsWith("Bearer ")
                ? authorization.substring(7)
                : null;
        if (!securityManager.isValidApiKey(candidate)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "A valid bearer API key is required");
            return;
        }
        filterChain.doFilter(request, response);
    }
}