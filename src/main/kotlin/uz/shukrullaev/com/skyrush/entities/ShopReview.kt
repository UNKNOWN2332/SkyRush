package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("shop_reviews")
data class ShopReview(
    @Id val id: Long? = null,
    @Column("user_id") val userId: Long,
    @Column("author_username") val authorUsername: String,
    @Column("category_id") val categoryId: Long? = null,
    @Column("product_id") val productId: Long? = null,
    val rating: Int,
    val body: String,
    @Column("created_at") val createdAt: Instant? = null,
)
