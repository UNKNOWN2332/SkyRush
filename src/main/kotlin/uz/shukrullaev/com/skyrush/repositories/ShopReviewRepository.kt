package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.ShopReview

@Repository
interface ShopReviewRepository : CoroutineCrudRepository<ShopReview, Long> {

    @Query(
        """
        SELECT * FROM shop_reviews
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT :limit OFFSET :offset
        """
    )
    fun findPage(limit: Int, offset: Int): Flow<ShopReview>
}
