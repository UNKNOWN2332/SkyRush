package uz.shukrullaev.com.skyrush.Config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.context.support.ResourceBundleMessageSource
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain
import java.util.*


/**
 * @see uz.shukrullaev.com.skyrush.Config
 * @author Abdulloh
 * @since 25/03/2026 7:47 am
 */

@Configuration
class SecurityConfig {

    @Bean
    fun passwordEncoder() = BCryptPasswordEncoder()

    @Bean
    fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http
            .csrf { it.disable() }
            .authorizeExchange { it
                .pathMatchers("/api/auth/**").permitAll()
                .anyExchange().authenticated()
            }
            .build()
    }
    @Bean
    @Primary
    fun messageSource(): ResourceBundleMessageSource {
        return ResourceBundleMessageSource().apply {
            setDefaultEncoding("UTF-8")
            setDefaultLocale(Locale("uz"))
            setBasename("Exceptions")
        }
    }
}