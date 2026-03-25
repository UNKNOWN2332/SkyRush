package uz.shukrullaev.com.skyrush.Config

import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.ReactiveAuditorAware
import org.springframework.data.r2dbc.config.EnableR2dbcAuditing
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import reactor.core.publisher.Mono


/**
 * @see uz.shukrullaev.com.skyrush.Config
 * @author Abdulloh
 * @since 25/03/2026 7:32 am
 */

@Configuration
@EnableR2dbcAuditing
class AuditConfig {

    @Configuration
    class ReactiveAuditorConfig : ReactiveAuditorAware<String> {
        override fun getCurrentAuditor(): Mono<String> {
            return ReactiveSecurityContextHolder.getContext()
                .map { it.authentication.name }
                .defaultIfEmpty("SYSTEM")
        }
    }
}