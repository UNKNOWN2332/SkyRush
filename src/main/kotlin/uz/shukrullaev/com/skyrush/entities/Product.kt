package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table


/**
 * @see uz.shukrullaev.com.skyrush.entities
 * @author Abdulloh
 * @since 03/04/2026 1:56 am
 */

@Table("products")
data class Product(
    @Id var id: Long? = null,
    @Column("category_id") val categoryId: Long,
    val name: String,
    val price: java.math.BigDecimal,
    @Column("original_price") val originalPrice: java.math.BigDecimal,
    @Column("provider_product_id") val providerProductId: String? = null, // null bo'lishi mumkin bo'lsa ? qo'yish shart
    val status: String = "ACTIVE",

    // Mana bu ikki qatorni qo'shib qo'y:
    @Column("created_at") val createdAt: java.time.LocalDateTime? = null,
    @Column("updated_at") val updatedAt: java.time.LocalDateTime? = null
)