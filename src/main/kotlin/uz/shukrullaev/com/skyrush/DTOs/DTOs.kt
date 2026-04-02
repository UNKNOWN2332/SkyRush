package uz.shukrullaev.com.skyrush.DTOs

import jakarta.validation.constraints.NotBlank
import org.springframework.security.crypto.password.PasswordEncoder
import uz.shukrullaev.com.skyrush.entities.Category
import uz.shukrullaev.com.skyrush.entities.Product
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

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    @field:NotBlank(message = "Username must not be empty")
    val username: String,

    @field:NotBlank(message = "Password must not be empty")
    val password: String
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

fun RegisterRequest.toEntity(passwordEncoder: PasswordEncoder): Users {
    return Users(
        username = this.username,
        email = this.email,
        password = passwordEncoder.encode(this.password)
    )
}

data class ProductCreateRequest(
    val categoryId: Long,
    val name: String,
    val price: BigDecimal,
    val originalPrice: BigDecimal,
    val providerProductId: String,
    val status: String = "ACTIVE"
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
    val status: String
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
    status = this.status
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
fun ProductCreateRequest.toEntity() = Product(
    categoryId = this.categoryId,
    name = this.name,
    price = this.price,
    originalPrice = this.originalPrice,
    providerProductId = this.providerProductId,
    status = this.status
)