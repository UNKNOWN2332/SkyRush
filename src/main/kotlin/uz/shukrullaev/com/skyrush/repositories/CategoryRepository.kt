package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import uz.shukrullaev.com.skyrush.entities.Category


/**
 * @see uz.shukrullaev.com.skyrush.repositories
 * @author Abdulloh
 * @since 03/04/2026 2:07 am
 */

interface CategoryRepository : CoroutineCrudRepository<Category, Long> {
    fun findAllByStatus(status: String = "ACTIVE"): Flow<Category>
}