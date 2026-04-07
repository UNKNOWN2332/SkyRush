package uz.shukrullaev.com.skyrush.tournament

import org.springframework.stereotype.Component
import org.springframework.web.reactive.socket.WebSocketSession
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.util.concurrent.ConcurrentHashMap

/**
 * Turnirlar ro‘yxati o‘zgarganda barcha ulangan klientlarga yengil xabar.
 * Keyinroq ko‘p sessiya bo‘lsa Sinks yoki Redis pub/sub ga o‘tkazish mumkin.
 */
@Component
class TournamentEventHub {
    private val sessions = ConcurrentHashMap.newKeySet<WebSocketSession>()

    fun add(session: WebSocketSession) {
        sessions.add(session)
    }

    fun remove(session: WebSocketSession) {
        sessions.remove(session)
    }

    fun notifyTournamentsChanged() {
        val snapshot = sessions.toList()
        if (snapshot.isEmpty()) return
        val payload = """{"type":"TOURNAMENTS_UPDATED"}"""
        Flux.fromIterable(snapshot)
            .flatMap { s ->
                s.send(Mono.just(s.textMessage(payload))).onErrorResume { Mono.empty() }
            }
            .subscribe()
    }
}
