package uz.shukrullaev.com.skyrush.config

import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono
import uz.shukrullaev.com.skyrush.config.JWT.JwtProvider

/**
 * Bearer JWT ni tekshiradi va [ReactiveSecurityContextHolder] ga yozadi.
 * Noto‘g‘ri yoki yo‘q token — anonim (ochiq endpointlar ishlayveradi).
 */
@Component
@Order(-200)
class JwtReactiveWebFilter(
    private val jwtProvider: JwtProvider,
) : WebFilter {

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        val header = exchange.request.headers.getFirst(HttpHeaders.AUTHORIZATION)
        if (header.isNullOrBlank() || !header.startsWith("Bearer ")) {
            return chain.filter(exchange)
        }
        val token = header.removePrefix("Bearer").trim()
        if (token.isEmpty()) {
            return chain.filter(exchange)
        }
        val principal = jwtProvider.validateToken(token) ?: return chain.filter(exchange)
        val auth = UsernamePasswordAuthenticationToken(
            principal.username,
            null,
            listOf(SimpleGrantedAuthority(principal.role)),
        )
        return chain.filter(exchange)
            .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth))
    }
}
