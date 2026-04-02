package uz.shukrullaev.com.skyrush.repositories

import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.Product
import kotlinx.coroutines.flow.Flow
import org.springframework.data.r2dbc.repository.Query

/**
 * @see uz.shukrullaev.com.skyrush.repositories
 * @author Abdulloh
 * @since 03/04/2026 2:04 am
 */

@Repository
interface ProductRepository : CoroutineCrudRepository<Product, Long> {

    @Query("SELECT * FROM products WHERE category_id = :categoryId AND status = :status")
    fun findAllByCategoryIdAndStatus(categoryId: Long, status: String): Flow<Product>

}

