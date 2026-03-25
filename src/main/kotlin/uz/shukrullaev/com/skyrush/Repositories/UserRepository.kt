package uz.shukrullaev.com.skyrush.Repositories

import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import uz.shukrullaev.com.skyrush.Entities.Users


/**
 * @see uz.shukrullaev.com.skyrush.Repositories
 * @author Abdulloh
 * @since 25/03/2026 7:45 am
 */

interface UserRepository : CoroutineCrudRepository<Users, Long> {
    suspend fun findByUsername(username: String): Users?
    suspend fun findByEmail(email: String): Users?
}