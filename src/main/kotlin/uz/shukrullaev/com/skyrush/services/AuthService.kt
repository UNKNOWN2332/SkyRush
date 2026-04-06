package uz.shukrullaev.com.skyrush.services

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.shukrullaev.com.skyrush.config.GoogleIdTokenValidator
import uz.shukrullaev.com.skyrush.config.JWT.JwtProvider
import uz.shukrullaev.com.skyrush.DTOs.GoogleSignInRequest
import uz.shukrullaev.com.skyrush.DTOs.LoginResponse
import uz.shukrullaev.com.skyrush.DTOs.toResponse
import uz.shukrullaev.com.skyrush.entities.Users
import uz.shukrullaev.com.skyrush.entities.Wallet
import uz.shukrullaev.com.skyrush.exceptions.GmailRequiredException
import uz.shukrullaev.com.skyrush.exceptions.GoogleSignInFailedException
import uz.shukrullaev.com.skyrush.exceptions.ObjectIdNotFoundException
import uz.shukrullaev.com.skyrush.repositories.UserRepository
import uz.shukrullaev.com.skyrush.repositories.WalletRepository
import java.util.UUID

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val walletRepository: WalletRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
    private val googleIdTokenValidator: GoogleIdTokenValidator,
) {

    @Transactional
    suspend fun signInWithGoogle(request: GoogleSignInRequest): LoginResponse {
        if (!googleIdTokenValidator.isConfigured()) {
            throw GoogleSignInFailedException()
        }
        val payload = googleIdTokenValidator.verifyAndParse(request.credential)
            ?: throw GoogleSignInFailedException()

        val emailRaw = payload.email ?: throw GoogleSignInFailedException()
        if (payload.emailVerified != true) {
            throw GoogleSignInFailedException()
        }
        val email = emailRaw.lowercase()
        if (!isGmailDomain(email)) {
            throw GmailRequiredException()
        }

        val sub = payload.subject ?: throw GoogleSignInFailedException()
        val username = "g$sub".take(50)

        var user = userRepository.findByEmail(email)
        if (user == null) {
            val encoded = passwordEncoder.encode("{google_oauth}${UUID.randomUUID()}")
            user = userRepository.save(
                Users(
                    username = username,
                    password = encoded,
                    email = email,
                    googleSub = sub,
                ),
            )
            walletRepository.save(Wallet(userId = user.id!!, goldCoins = 0))
        } else if (user.googleSub != sub) {
            user = userRepository.save(user.copy(googleSub = sub))
        }

        val wallet = walletRepository.findByUserId(user.id!!)
            ?: throw ObjectIdNotFoundException(user.id!!)

        val token = jwtProvider.generateToken(user)
        return LoginResponse(token = token, user = user.toResponse(wallet))
    }

    private fun isGmailDomain(email: String): Boolean {
        return email.endsWith("@gmail.com") || email.endsWith("@googlemail.com")
    }
}
