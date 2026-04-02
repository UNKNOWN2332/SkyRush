package uz.shukrullaev.com.skyrush.controllers

import kotlinx.coroutines.flow.Flow
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import uz.shukrullaev.com.skyrush.DTOs.CategoryCreateRequest
import uz.shukrullaev.com.skyrush.DTOs.CategoryResponse
import uz.shukrullaev.com.skyrush.DTOs.CategoryUpdateRequest
import uz.shukrullaev.com.skyrush.services.CategoryService


/**
 * @see uz.shukrullaev.com.skyrush.controllers
 * @author Abdulloh
 * @since 03/04/2026 2:26 am
 */

@RestController
@RequestMapping("/api/v1")
class CategoryController(
    private val categoryService: CategoryService
) {

    /**
     * USER ENDPOINTS
     * Oddiy foydalanuvchilar uchun faqat aktiv o'yinlar ro'yxati
     */
    @GetMapping("/categories")
    fun getActiveCategories(): Flow<CategoryResponse> {
        return categoryService.getActiveCategories()
    }

    /**
     * ADMIN ENDPOINTS
     * Bu yerga faqat Admin huquqi borlar kira oladi
     */
    @GetMapping("/admin/categories")
    fun getAllCategoriesForAdmin(): Flow<CategoryResponse> {
        return categoryService.getAllCategoriesForAdmin()
    }

    @PostMapping("/admin/categories")
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun createCategory(@RequestBody request: CategoryCreateRequest): CategoryResponse {
        return categoryService.createCategory(request)
    }

    @PutMapping("/admin/categories/{id}")
    suspend fun updateCategory(
        @PathVariable id: Long,
        @RequestBody request: CategoryUpdateRequest
    ): CategoryResponse {
        return categoryService.updateCategory(id, request)
    }

    @DeleteMapping("/admin/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun deleteCategory(@PathVariable id: Long) {
        categoryService.deleteCategory(id)
    }
}