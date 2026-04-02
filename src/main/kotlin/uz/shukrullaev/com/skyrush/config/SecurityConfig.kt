package uz.shukrullaev.com.skyrush.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.context.support.ResourceBundleMessageSource
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain
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
            .csrf { it.disable() }
            .authorizeExchange { exchange ->
                exchange
                    .pathMatchers("/api/auth/**").permitAll()
                    .pathMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/categories/**").permitAll()
                    .pathMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/products/category/**").permitAll()

                    .pathMatchers("/api/v1/admin/**").hasRole("ADMIN")

                    .anyExchange().authenticated()
            }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .build()
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