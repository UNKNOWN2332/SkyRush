package uz.shukrullaev.com.skyrush.services

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.shukrullaev.com.skyrush.config.JWT.JwtProvider
import uz.shukrullaev.com.skyrush.DTOs.*
import uz.shukrullaev.com.skyrush.entities.Users
import uz.shukrullaev.com.skyrush.entities.Wallet
import uz.shukrullaev.com.skyrush.exceptions.EmailAlreadyExistsException
import uz.shukrullaev.com.skyrush.exceptions.ObjectIdNotFoundException
import uz.shukrullaev.com.skyrush.exceptions.UsernameAlreadyExistsException
import uz.shukrullaev.com.skyrush.exceptions.UsernameOrPasswordIncorrect
import uz.shukrullaev.com.skyrush.repositories.UserRepository
import uz.shukrullaev.com.skyrush.repositories.WalletRepository


/**
 * @see uz.shukrullaev.com.skyrush.services
 * @author Abdulloh
 * @since 25/03/2026 8:08 am
 */

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val walletRepository: WalletRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider
) {

    @Transactional
    suspend fun register(request: RegisterRequest): UserResponse {
        validateUniqueness(request)

        val user = userRepository.save(request.toEntity(passwordEncoder))

        val wallet = walletRepository.save(Wallet(userId = user.id!!, goldCoins = 0))

        return user.toResponse(wallet)
    }

    suspend fun login(request: LoginRequest): LoginResponse {
        val user = validateRequest(request)

        val wallet = walletRepository.findByUserId(user.id!!)
            ?: throw ObjectIdNotFoundException(user.id)

        val token = jwtProvider.generateToken(user)

        return LoginResponse(
            token = token,
            user = user.toResponse(wallet)
        )
    }

    private suspend fun validateRequest(request: LoginRequest): Users {
        val user = userRepository.findByUsername(request.username)
            ?: throw UsernameOrPasswordIncorrect(request.username)

        if (!passwordEncoder.matches(request.password, user.password)) {
            throw UsernameOrPasswordIncorrect(request.username)
        }
        return user
    }

    private suspend fun validateUniqueness(request: RegisterRequest) {
        userRepository.findByUsername(request.username)?.let {
            throw UsernameAlreadyExistsException(it.username)
        }
        userRepository.findByEmail(request.email)?.let {
            throw EmailAlreadyExistsException(it.email)
        }
    }
}