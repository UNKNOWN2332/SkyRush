package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.math.BigDecimal


/**
 * @see uz.shukrullaev.com.skyrush.entities
 * @author Abdulloh
 * @since 03/04/2026 1:56 am
 */

@Table("products")
data class Product(
    @Id var id: Long? = null,

    @Column("category_id")
    val categoryId: Long,

    val name: String,
    val price: BigDecimal,

    @Column("original_price")
    val originalPrice: BigDecimal,

    @Column("provider_product_id")
    val providerProductId: String,

    val status: String = "ACTIVE"
)