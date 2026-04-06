package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.PromoBanner

@Repository
interface PromoBannerRepository : CoroutineCrudRepository<PromoBanner, Long> {

    @Query(
        """
        SELECT * FROM promo_banners
        WHERE status = :status
          AND (region = :region OR region = 'ALL')
        ORDER BY sort_order ASC, id ASC
        """
    )
    fun findActiveForShopRegion(status: String, region: String): Flow<PromoBanner>
}
