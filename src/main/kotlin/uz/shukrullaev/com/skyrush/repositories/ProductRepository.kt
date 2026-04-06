package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.Product

/**
 * @see uz.shukrullaev.com.skyrush.repositories
 * @author Abdulloh
 * @since 03/04/2026 2:04 am
 */

@Repository
interface ProductRepository : CoroutineCrudRepository<Product, Long> {

    fun findAllByCategoryIdAndStatusOrderByIdDesc(
        categoryId: Long,
        status: String,
        pageable: Pageable
    ): Flow<Product>
}

