package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table


/**
 * @see uz.shukrullaev.com.skyrush.entities
 * @author Abdulloh
 * @since 03/04/2026 1:55 am
 */

@Table("categories")
data class Category(
    @Id var id: Long? = null,
    val name: String,

    @Column("logo_url")
    val logoUrl: String,

    @Column("has_zone_id")
    val hasZoneId: Boolean = false,

    val status: String = "ACTIVE"
)