package uz.shukrullaev.com.skyrush.Entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table


/**
 * @see uz.shukrullaev.com.skyrush.Entities
 * @author Abdulloh
 * @since 25/03/2026 7:28 am
 */

@Table("transactions")
data class Transaction(
    @Id
    val id: Long? = null,
    val walletId: Long,
    val amount: Long,
    @Column("trx_type")
    val type: TransactionType
) : BaseEntity()

enum class TransactionType {
    DEPOSIT, PURCHASE, REFUND, BONUS
}