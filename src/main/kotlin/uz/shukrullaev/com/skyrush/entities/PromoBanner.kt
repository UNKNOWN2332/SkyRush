package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table

@Table("promo_banners")
data class PromoBanner(
    @Id var id: Long? = null,
    @Column("image_url") val imageUrl: String,
    @Column("link_url") val linkUrl: String,
    @Column("sort_order") val sortOrder: Int = 0,
    val status: String = "ACTIVE",
    /** UZ, RU, or ALL (visible in every shop region) */
    val region: String = "UZ",
)
