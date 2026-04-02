package uz.shukrullaev.com.skyrush.repositories

import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import uz.shukrullaev.com.skyrush.entities.Users


/**
 * @see uz.shukrullaev.com.skyrush.repositories
 * @author Abdulloh
 * @since 25/03/2026 7:45 am
 */

interface UserRepository : CoroutineCrudRepository<Users, Long> {
    suspend fun findByUsername(username: String): Users?
    suspend fun findByEmail(email: String): Users?
}