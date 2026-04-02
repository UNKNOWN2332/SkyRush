package uz.shukrullaev.com.skyrush.enums


/**
 * @see uz.shukrullaev.com.skyrush.enums
 * @author Abdulloh
 * @since 25/03/2026 8:02 am
 */

data class BaseMessage(val code: Int, val message: String?)

enum class ExceptionsCode(val code: Int) {
    USERNAME_ALREADY_EXISTS(100),
    EMAIL_ALREADY_EXISTS(101)

}
