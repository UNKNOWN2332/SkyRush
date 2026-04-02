package uz.shukrullaev.com.skyrush.handlers

import org.springframework.context.support.ResourceBundleMessageSource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import uz.shukrullaev.com.skyrush.exceptions.SkyRushException


/**
 * @see uz.shukrullaev.com.skyrush.handlers
 * @author Abdulloh
 * @since 25/03/2026 8:06 am
 */

@ControllerAdvice
class GlobalExceptionHandler(
    private val errorMessageSource: ResourceBundleMessageSource
) {
    @ExceptionHandler(SkyRushException::class)
    fun handleHrmException(ex: SkyRushException): ResponseEntity<Any?> {
        return ResponseEntity.badRequest().body(ex.getErrorMessage(errorMessageSource))
    }
}