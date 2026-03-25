package uz.shukrullaev.com.skyrush.Services

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.shukrullaev.com.skyrush.DTOs.RegisterRequest
import uz.shukrullaev.com.skyrush.DTOs.UserResponse
import uz.shukrullaev.com.skyrush.DTOs.toEntity
import uz.shukrullaev.com.skyrush.DTOs.toResponse
import uz.shukrullaev.com.skyrush.Entities.Wallet
import uz.shukrullaev.com.skyrush.Exceptions.EmailAlreadyExistsException
import uz.shukrullaev.com.skyrush.Exceptions.UsernameAlreadyExistsException
import uz.shukrullaev.com.skyrush.Repositories.UserRepository
import uz.shukrullaev.com.skyrush.Repositories.WalletRepository


/**
 * @see uz.shukrullaev.com.skyrush.Services
 * @author Abdulloh
 * @since 25/03/2026 8:08 am
 */

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val walletRepository: WalletRepository,
    private val passwordEncoder: PasswordEncoder
) {

    @Transactional
    suspend fun register(request: RegisterRequest): UserResponse {
        validateUniqueness(request)

        val user = userRepository.save(request.toEntity(passwordEncoder))

        val wallet = walletRepository.save(Wallet(userId = user.id!!, goldCoins = 0))

        return user.toResponse(wallet)
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