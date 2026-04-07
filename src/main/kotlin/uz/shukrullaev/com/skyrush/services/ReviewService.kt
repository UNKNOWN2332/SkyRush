package uz.shukrullaev.com.skyrush.services

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.reactor.awaitSingleOrNull
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import uz.shukrullaev.com.skyrush.DTOs.ReviewCreateRequest
import uz.shukrullaev.com.skyrush.DTOs.ReviewResponse
import uz.shukrullaev.com.skyrush.DTOs.toResponse
import uz.shukrullaev.com.skyrush.entities.ShopReview
import uz.shukrullaev.com.skyrush.repositories.ShopReviewRepository
import uz.shukrullaev.com.skyrush.repositories.UserRepository

@Service
class ReviewService(
    private val shopReviewRepository: ShopReviewRepository,
    private val userRepository: UserRepository,
) {

    fun list(page: Int, size: Int): Flow<ReviewResponse> {
        val p = page.coerceAtLeast(0)
        val s = size.coerceIn(1, 100)
        return shopReviewRepository.findPage(s, p * s).map { it.toResponse() }
    }

    suspend fun create(request: ReviewCreateRequest): ReviewResponse {
        val username = currentUsername()
        val user = userRepository.findByUsername(username)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        val body = request.body.trim()
        if (body.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "body empty")
        }
        val saved = shopReviewRepository.save(
            ShopReview(
                userId = user.id!!,
                authorUsername = user.username,
                categoryId = request.categoryId,
                productId = request.productId,
                rating = request.rating,
                body = body,
            ),
        )
        return saved.toResponse()
    }

    private suspend fun currentUsername(): String {
        val ctx = ReactiveSecurityContextHolder.getContext().awaitSingleOrNull()
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        val auth = ctx.authentication
        if (auth !is UsernamePasswordAuthenticationToken || !auth.isAuthenticated) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        return auth.name?.takeIf { it.isNotBlank() }
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
    }
}
