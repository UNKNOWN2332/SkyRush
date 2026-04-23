package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.Tournament

@Repository
interface TournamentRepository : CoroutineCrudRepository<Tournament, Long> {

    @Query("SELECT * FROM tournaments ORDER BY created_at DESC NULLS LAST, id DESC")
    fun findAllOrdered(): Flow<Tournament>

    fun findByOrganizerIdOrderByCreatedAtDesc(organizerId: Long): Flow<Tournament>
}
