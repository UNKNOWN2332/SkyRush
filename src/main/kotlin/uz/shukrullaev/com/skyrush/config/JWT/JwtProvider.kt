package uz.shukrullaev.com.skyrush.config.JWT;

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import uz.shukrullaev.com.skyrush.entities.Users
import java.util.*

/**
 * @author Abdulloh
 * @see uz.shukrullaev.com.skyrush.config.JWT
 * @since 31/03/2026 1:26 am
 */

@Component
class JwtProvider(
        @Value("\${jwt.secret}") private val secret: String,
        @Value("\${jwt.expiration}") private val expiration: Long
) {
    private val key = Keys.hmacShaKeyFor(secret.toByteArray())

    fun generateToken(user: Users): String {
        val now = Date()
        val expiryDate = Date(now.time + expiration)

        return Jwts.builder()
                .setSubject(user.username)
                .claim("role", user.role) // Agar Role bo'lsa
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key)
                .compact()
    }
}