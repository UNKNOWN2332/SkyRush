package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.TournamentTeamMember

@Repository
interface TournamentTeamMemberRepository : CoroutineCrudRepository<TournamentTeamMember, Long> {
    fun findByTeamId(teamId: Long): Flow<TournamentTeamMember>
}
