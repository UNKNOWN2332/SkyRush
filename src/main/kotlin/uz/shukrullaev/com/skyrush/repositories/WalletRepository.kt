package uz.shukrullaev.com.skyrush.repositories

import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import uz.shukrullaev.com.skyrush.entities.Wallet


/**
 * @see uz.shukrullaev.com.skyrush.repositories
 * @author Abdulloh
 * @since 25/03/2026 7:46 am
 */

interface WalletRepository : CoroutineCrudRepository<Wallet, Long> {
    suspend fun findByUserId(userId: Long): Wallet?
}