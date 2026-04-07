package uz.shukrullaev.com.skyrush.tournament

import org.springframework.stereotype.Component
import org.springframework.web.reactive.socket.WebSocketHandler
import org.springframework.web.reactive.socket.WebSocketSession
import reactor.core.publisher.Mono

@Component
class TournamentWebSocketHandler(
    private val hub: TournamentEventHub,
) : WebSocketHandler {
    override fun handle(session: WebSocketSession): Mono<Void> {
        hub.add(session)
        return session.receive()
            .doFinally { hub.remove(session) }
            .then()
    }
}
