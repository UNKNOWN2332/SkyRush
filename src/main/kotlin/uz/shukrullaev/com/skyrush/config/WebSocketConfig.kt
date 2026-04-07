package uz.shukrullaev.com.skyrush.config

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.web.reactive.HandlerMapping
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping
import org.springframework.web.reactive.socket.WebSocketHandler
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter
import uz.shukrullaev.com.skyrush.tournament.TournamentWebSocketHandler

@Configuration
class WebSocketConfig {

    @Bean
    fun webSocketHandlerMapping(tournamentWebSocketHandler: TournamentWebSocketHandler): HandlerMapping {
        val map: Map<String, WebSocketHandler> = mapOf("/ws/tournaments" to tournamentWebSocketHandler)
        return SimpleUrlHandlerMapping().apply {
            order = Ordered.HIGHEST_PRECEDENCE
            urlMap = map
        }
    }

    @Bean
    @ConditionalOnMissingBean(WebSocketHandlerAdapter::class)
    fun webSocketHandlerAdapter(): WebSocketHandlerAdapter = WebSocketHandlerAdapter()
}
