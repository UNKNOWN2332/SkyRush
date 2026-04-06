package uz.shukrullaev.com.skyrush.controllers

import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.shukrullaev.com.skyrush.DTOs.GoogleSignInRequest
import uz.shukrullaev.com.skyrush.DTOs.LoginResponse
import uz.shukrullaev.com.skyrush.services.AuthService

@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/google")
    suspend fun googleSignIn(@Valid @RequestBody request: GoogleSignInRequest): ResponseEntity<LoginResponse> {
        return ResponseEntity.ok(authService.signInWithGoogle(request))
    }
}
