package uz.shukrullaev.com.skyrush.Entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Table


/**
 * @see uz.shukrullaev.com.skyrush.Entities
 * @author Abdulloh
 * @since 25/03/2026 7:27 am
 */

@Table("wallets")
data class Wallet(
    @Id
    val id: Long? = null,
    val userId: Long,
    var goldCoins: Long = 0
) : BaseEntity()