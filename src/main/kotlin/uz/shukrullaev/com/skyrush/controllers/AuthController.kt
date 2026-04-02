package uz.shukrullaev.com.skyrush.controllers

import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.shukrullaev.com.skyrush.DTOs.LoginRequest
import uz.shukrullaev.com.skyrush.DTOs.LoginResponse
import uz.shukrullaev.com.skyrush.DTOs.RegisterRequest
import uz.shukrullaev.com.skyrush.DTOs.UserResponse
import uz.shukrullaev.com.skyrush.services.AuthService


/**
 * @see uz.shukrullaev.com.skyrush.controllers
 * @author Abdulloh
 * @since 31/03/2026 1:29 am
 */

@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/login")
    suspend fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<LoginResponse> {
        return ResponseEntity.ok(authService.login(request))
    }

    @PostMapping("/register")
    suspend fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<UserResponse> {
        return ResponseEntity.ok(authService.register(request))
    }
}