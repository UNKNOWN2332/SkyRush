package uz.shukrullaev.com.skyrush.exceptions

import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.context.support.ResourceBundleMessageSource
import uz.shukrullaev.com.skyrush.enums.BaseMessage
import uz.shukrullaev.com.skyrush.enums.ExceptionsCode
import java.util.*

sealed class SkyRushException(message: String? = null) : RuntimeException(message) {
    abstract fun errorType(): ExceptionsCode
    protected open fun getErrorMessageArguments(): Array<Any?>? = null

    fun getErrorMessage(errorMessageSource: ResourceBundleMessageSource): BaseMessage {
        return BaseMessage(
            errorType().code,
            errorMessageSource.getMessage(
                errorType().toString(),
                getErrorMessageArguments(),
                Locale(LocaleContextHolder.getLocale().language)
            )
        )
    }
}

class UsernameAlreadyExistsException(private val username: String) : SkyRushException() {
    override fun errorType() = ExceptionsCode.USERNAME_ALREADY_EXISTS
    override fun getErrorMessageArguments(): Array<Any?> = arrayOf(username)
}

class EmailAlreadyExistsException(private val email: String) : SkyRushException() {
    override fun errorType() = ExceptionsCode.EMAIL_ALREADY_EXISTS
    override fun getErrorMessageArguments(): Array<Any?> = arrayOf(email)
}

class UsernameOrPasswordIncorrect(private val email: String) : SkyRushException() {
    override fun errorType() = ExceptionsCode.EMAIL_ALREADY_EXISTS
    override fun getErrorMessageArguments(): Array<Any?> = arrayOf(email)
}

class ObjectIdNotFoundException(private val userId: Long) : SkyRushException() {
    override fun errorType() = ExceptionsCode.EMAIL_ALREADY_EXISTS
    override fun getErrorMessageArguments(): Array<Any?> = arrayOf(userId)
}