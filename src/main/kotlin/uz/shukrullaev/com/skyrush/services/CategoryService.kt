package uz.shukrullaev.com.skyrush.services

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.springframework.stereotype.Service
import uz.shukrullaev.com.skyrush.dtos.*
import uz.shukrullaev.com.skyrush.repositories.CategoryRepository


/**
 * @see uz.shukrullaev.com.skyrush.services
 * @author Abdulloh
 * @since 03/04/2026 2:24 am
 */
@Service
class CategoryService(
    private val categoryRepository: CategoryRepository
) {
    fun getActiveCategories(): Flow<CategoryResponse> {
        return categoryRepository.findAllByStatus("ACTIVE")
            .map { it.toResponse() }
    }

    fun getAllCategoriesForAdmin(): Flow<CategoryResponse> {
        return categoryRepository.findAll()
            .map { it.toResponse() }
    }

    suspend fun createCategory(request: CategoryCreateRequest): CategoryResponse {
        return categoryRepository.save(request.toEntity()).toResponse()
    }

    suspend fun updateCategory(id: Long, request: CategoryUpdateRequest): CategoryResponse {
        val existing = categoryRepository.findById(id) ?: throw Exception("Category not found")

        val updated = existing.copy(
            name = request.name ?: existing.name,
            logoUrl = request.logoUrl ?: existing.logoUrl,
            hasZoneId = request.hasZoneId ?: existing.hasZoneId,
            status = request.status ?: existing.status
        )

        return categoryRepository.save(updated).toResponse()
    }

    suspend fun deleteCategory(id: Long) {
        categoryRepository.deleteById(id)
    }
}