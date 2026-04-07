package uz.shukrullaev.com.skyrush.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.context.support.ResourceBundleMessageSource
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource
import java.util.*


/**
 * @see uz.shukrullaev.com.skyrush.config
 * @author Abdulloh
 * @since 25/03/2026 7:47 am
 */

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

    @Bean
    fun passwordEncoder() = BCryptPasswordEncoder()

    @Bean
    fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http
            // 1. CORS-ni Spring Security darajasida yoqamiz
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .authorizeExchange { exchange ->
                exchange
                    .pathMatchers("/api/auth/**").permitAll()
                    .pathMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/categories/**").permitAll()
                    .pathMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/banners/**")
                    .permitAll()
                    .pathMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/products/category/**").permitAll()
                    .pathMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/reviews").permitAll()
                    .pathMatchers(HttpMethod.GET, "/api/v1/tournaments", "/api/v1/tournaments/**").permitAll()
                    .pathMatchers("/ws/**").permitAll()
                    .pathMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    .anyExchange().authenticated()
            }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .build()
    }

    // 2. CORS sozlamalarini shu yerning o'zida yozamiz
    private fun corsConfigurationSource(): UrlBasedCorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOrigins = listOf("http://localhost:5173")
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        config.allowedHeaders = listOf("*")
        config.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }

    @Bean
    @Primary
    fun messageSource(): ResourceBundleMessageSource {
        return ResourceBundleMessageSource().apply {
            setDefaultEncoding("UTF-8")
            setBasenames("Exceptions")
            setDefaultLocale(Locale("uz"))
        }
    }
}