package uz.shukrullaev.com.skyrush.controllers

import kotlinx.coroutines.flow.Flow
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.shukrullaev.com.skyrush.DTOs.PromoBannerResponse
import uz.shukrullaev.com.skyrush.services.PromoBannerService

@RestController
@RequestMapping("/api/v1")
class PromoBannerController(
    private val promoBannerService: PromoBannerService,
) {

    @GetMapping("/banners")
    fun getBanners(@RequestParam(defaultValue = "UZ") region: String): Flow<PromoBannerResponse> {
        return promoBannerService.getActiveBanners(region)
    }
}
