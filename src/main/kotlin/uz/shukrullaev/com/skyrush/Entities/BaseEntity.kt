package uz.shukrullaev.com.skyrush.Entities

import org.springframework.data.annotation.CreatedBy
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedBy
import org.springframework.data.annotation.LastModifiedDate
import java.time.Instant


/**
 * @see uz.shukrullaev.com.skyrush.Entities
 * @author Abdulloh
 * @since 25/03/2026 7:31 am
 */

abstract class BaseEntity(
    @CreatedDate
    var createdAt: Instant? = null,

    @LastModifiedDate
    var updatedAt: Instant? = null,

    @CreatedBy
    var createdBy: String? = null,

    @LastModifiedBy
    var updatedBy: String? = null
)