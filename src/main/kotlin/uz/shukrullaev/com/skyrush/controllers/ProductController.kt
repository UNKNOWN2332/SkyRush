package uz.shukrullaev.com.skyrush.controllers

import kotlinx.coroutines.flow.Flow
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import uz.shukrullaev.com.skyrush.DTOs.ProductCreateRequest
import uz.shukrullaev.com.skyrush.DTOs.ProductResponse
import uz.shukrullaev.com.skyrush.DTOs.ProductUpdateRequest
import uz.shukrullaev.com.skyrush.services.ProductService

/**
 * @see uz.shukrullaev.com.skyrush.controllers
 * @author Abdulloh
 * @since 03/04/2026 2:31 am
 */

@RestController
@RequestMapping("/api/v1")
class ProductController(
    private val productService: ProductService
) {


    @GetMapping("/products/category/{categoryId}")
    fun getProductsByCategory(@PathVariable categoryId: Long): Flow<ProductResponse> {
        return productService.getActiveProductsByCategoryId(categoryId)
    }


    @GetMapping("/admin/products")
    fun getAllProductsForAdmin(): Flow<ProductResponse> {
        return productService.getAllProductsForAdmin()
    }

    @PostMapping("/admin/products")
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun createProduct(@RequestBody request: ProductCreateRequest): ProductResponse {
        return productService.createProduct(request)
    }

    @PutMapping("/admin/products/{id}")
    suspend fun updateProduct(
        @PathVariable id: Long,
        @RequestBody request: ProductUpdateRequest
    ): ProductResponse {
        return productService.updateProduct(id, request)
    }

    @DeleteMapping("/admin/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun deleteProduct(@PathVariable id: Long) {
        productService.deleteProduct(id)
    }
}