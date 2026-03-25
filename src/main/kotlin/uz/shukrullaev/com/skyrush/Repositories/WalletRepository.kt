package uz.shukrullaev.com.skyrush.Repositories

import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import uz.shukrullaev.com.skyrush.Entities.Wallet


/**
 * @see uz.shukrullaev.com.skyrush.Repositories
 * @author Abdulloh
 * @since 25/03/2026 7:46 am
 */

interface WalletRepository : CoroutineCrudRepository<Wallet, Long> {
    suspend fun findByUserId(userId: Long): Wallet?
}