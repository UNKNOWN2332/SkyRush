package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.TournamentFormatRule

@Repository
interface TournamentFormatRuleRepository : CoroutineCrudRepository<TournamentFormatRule, Long> {
    fun findByTournamentIdOrderByMinTeamsAsc(tournamentId: Long): Flow<TournamentFormatRule>
}
