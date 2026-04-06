package uz.shukrullaev.com.skyrush.services

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.springframework.stereotype.Service
import uz.shukrullaev.com.skyrush.DTOs.PromoBannerResponse
import uz.shukrullaev.com.skyrush.DTOs.toResponse
import uz.shukrullaev.com.skyrush.repositories.PromoBannerRepository

@Service
class PromoBannerService(
    private val promoBannerRepository: PromoBannerRepository,
) {
    fun getActiveBanners(shopRegion: String): Flow<PromoBannerResponse> {
        return promoBannerRepository
            .findActiveForShopRegion("ACTIVE", shopRegion.uppercase())
            .map { it.toResponse() }
    }
}
