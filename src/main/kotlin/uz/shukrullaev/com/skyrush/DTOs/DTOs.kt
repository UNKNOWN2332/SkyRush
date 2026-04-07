package uz.shukrullaev.com.skyrush.DTOs

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import uz.shukrullaev.com.skyrush.entities.Category
import uz.shukrullaev.com.skyrush.entities.Product
import uz.shukrullaev.com.skyrush.entities.PromoBanner
import uz.shukrullaev.com.skyrush.entities.ShopReview
import uz.shukrullaev.com.skyrush.entities.Users
import uz.shukrullaev.com.skyrush.entities.Wallet
import java.math.BigDecimal
import java.time.Instant


/**
 * @see uz.shukrullaev.com.skyrush.DTOs
 * @author Abdulloh
 * @since 25/03/2026 7:50 am
 */

data class UserResponse(
    val id: Long,
    val username: String,
    val email: String,
    val goldCoins: Long,
    val createdAt: Instant?
)

data class GoogleSignInRequest(
    @field:NotBlank(message = "credential must not be empty")
    val credential: String,
)

data class LoginResponse(
    val token: String,
    val user: UserResponse
)

fun Users.toResponse(wallet: Wallet): UserResponse {
    return UserResponse(
        id = this.id!!,
        username = this.username,
        email = this.email,
        goldCoins = wallet.goldCoins,
        createdAt = this.createdAt
    )
}

data class ProductCreateRequest(
    val categoryId: Long,
    val name: String,
    val price: BigDecimal,
    val originalPrice: BigDecimal,
    val providerProductId: String,
    val status: String = "ACTIVE",
    val productLogo: String
)

data class ProductUpdateRequest(
    val name: String?,
    val price: BigDecimal?,
    val originalPrice: BigDecimal?,
    val status: String?
)

data class ProductResponse(
    val id: Long,
    val categoryId: Long,
    val name: String,
    val price: BigDecimal,
    val status: String
)

data class CategoryResponse(
    val id: Long,
    val name: String,
    val logoUrl: String,
    val hasZoneId: Boolean,
    val status: String,
    val region: String
)

data class PromoBannerResponse(
    val id: Long,
    val imageUrl: String,
    val linkUrl: String,
    val sortOrder: Int,
    val region: String,
)

fun PromoBanner.toResponse() = PromoBannerResponse(
    id = this.id!!,
    imageUrl = this.imageUrl,
    linkUrl = this.linkUrl,
    sortOrder = this.sortOrder,
    region = this.region,
)

// Admin yangi o'yin qo'shishi uchun
data class CategoryCreateRequest(
    val name: String,
    val logoUrl: String,
    val hasZoneId: Boolean = false,
    val status: String = "ACTIVE"
)

// Admin o'yinni tahrirlashi uchun (Hamma maydon optional)
data class CategoryUpdateRequest(
    val name: String? = null,
    val logoUrl: String? = null,
    val hasZoneId: Boolean? = null,
    val status: String? = null
)

fun Category.toResponse() = CategoryResponse(
    id = this.id!!,
    name = this.name,
    logoUrl = this.logoUrl,
    hasZoneId = this.hasZoneId,
    status = this.status,
    region = region
)

fun CategoryCreateRequest.toEntity() = Category(
    name = this.name,
    logoUrl = this.logoUrl,
    hasZoneId = this.hasZoneId,
    status = this.status
)


// Entity -> Response DTO (User uchun)
fun Product.toResponse() = ProductResponse(
    id = this.id!!,
    categoryId = this.categoryId,
    name = this.name,
    price = this.price,
    status = this.status
)

// CreateRequest -> Entity (Admin uchun)
data class ReviewCreateRequest(
    @field:Min(1)
    @field:Max(5)
    val rating: Int,
    @field:NotBlank
    @field:Size(max = 2000)
    val body: String,
    val categoryId: Long? = null,
    val productId: Long? = null,
)

data class ReviewResponse(
    val id: Long,
    val authorUsername: String,
    val rating: Int,
    val body: String,
    val categoryId: Long?,
    val productId: Long?,
    val createdAt: Instant?,
)

fun ShopReview.toResponse() = ReviewResponse(
    id = this.id!!,
    authorUsername = this.authorUsername,
    rating = this.rating,
    body = this.body,
    categoryId = this.categoryId,
    productId = this.productId,
    createdAt = this.createdAt,
)

fun ProductCreateRequest.toEntity() = Product(
    categoryId = this.categoryId,
    name = this.name,
    price = this.price,
    originalPrice = this.originalPrice,
    providerProductId = this.providerProductId,
    status = this.status,
    productLogo = this.productLogo
)