package uz.shukrullaev.com.skyrush.DTOs

import org.springframework.security.crypto.password.PasswordEncoder
import uz.shukrullaev.com.skyrush.Entities.Users
import uz.shukrullaev.com.skyrush.Entities.Wallet
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
