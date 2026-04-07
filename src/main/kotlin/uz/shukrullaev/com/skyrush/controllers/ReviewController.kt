package uz.shukrullaev.com.skyrush.controllers

import jakarta.validation.Valid
import kotlinx.coroutines.flow.Flow
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import uz.shukrullaev.com.skyrush.DTOs.ReviewCreateRequest
import uz.shukrullaev.com.skyrush.DTOs.ReviewResponse
import uz.shukrullaev.com.skyrush.services.ReviewService

@RestController
@RequestMapping("/api/v1")
class ReviewController(
    private val reviewService: ReviewService,
) {

    @GetMapping("/reviews")
    fun listReviews(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
    ): Flow<ReviewResponse> = reviewService.list(page, size)

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun createReview(@Valid @RequestBody request: ReviewCreateRequest): ReviewResponse {
        return reviewService.create(request)
    }
}
