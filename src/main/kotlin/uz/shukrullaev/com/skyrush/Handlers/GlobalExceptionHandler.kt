package uz.shukrullaev.com.skyrush.Handlers

import org.springframework.context.support.ResourceBundleMessageSource
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import uz.shukrullaev.com.skyrush.Enums.BaseMessage
import uz.shukrullaev.com.skyrush.Exceptions.SkyRushException


/**
 * @see uz.shukrullaev.com.skyrush.Handlers
 * @author Abdulloh
 * @since 25/03/2026 8:06 am
 */

@ControllerAdvice
class GlobalExceptionHandler(
    private val errorMessageSource: ResourceBundleMessageSource
) {
    @ExceptionHandler(SkyRushException::class)
    fun handleHrmException(ex: SkyRushException): ResponseEntity<BaseMessage> {
        return ResponseEntity.badRequest().body(ex.getErrorMessage(errorMessageSource))
    }
}