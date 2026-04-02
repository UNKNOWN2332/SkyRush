package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table


/**
 * @see uz.shukrullaev.com.skyrush.entities
 * @author Abdulloh
 * @since 25/03/2026 7:25 am
 */

@Table("users")
data class Users(
    @Id
    val id: Long? = null,
    val username: String,
    val password: String,
    val email: String,
    val role: String = "ROLE_USER"
) : BaseEntity()