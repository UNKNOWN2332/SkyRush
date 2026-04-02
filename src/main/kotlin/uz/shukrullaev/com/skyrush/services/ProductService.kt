package uz.shukrullaev.com.skyrush.services

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.springframework.stereotype.Service
import uz.shukrullaev.com.skyrush.dtos.*
import uz.shukrullaev.com.skyrush.repositories.ProductRepository


/**
 * @see uz.shukrullaev.com.skyrush.services
 * @author Abdulloh
 * @since 03/04/2026 2:29 am
 */

@Service
class ProductService(
    private val productRepository: ProductRepository
) {
    fun getActiveProductsByCategoryId(categoryId: Long): Flow<ProductResponse> {
        return productRepository.findAllByCategoryIdAndStatus(categoryId, "ACTIVE")
            .map { it.toResponse() }
    }

    fun getAllProductsForAdmin(): Flow<ProductResponse> {
        return productRepository.findAll()
            .map { it.toResponse() }
    }

    suspend fun createProduct(request: ProductCreateRequest): ProductResponse {
        return productRepository.save(request.toEntity()).toResponse()
    }

    suspend fun updateProduct(id: Long, request: ProductUpdateRequest): ProductResponse {
        val existing = productRepository.findById(id) ?: throw Exception("Product not found")

        val updated = existing.copy(
            name = request.name ?: existing.name,
            price = request.price ?: existing.price,
            originalPrice = request.originalPrice ?: existing.originalPrice,
            status = request.status ?: existing.status
        )

        return productRepository.save(updated).toResponse()
    }

    suspend fun deleteProduct(id: Long) {
        productRepository.deleteById(id)
    }
}