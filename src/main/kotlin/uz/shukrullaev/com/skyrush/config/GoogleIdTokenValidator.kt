package uz.shukrullaev.com.skyrush.config

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class GoogleIdTokenValidator(
    @Value("\${google.oauth.client-id:}") private val clientId: String,
) {
    private val transport = NetHttpTransport()
    private val jsonFactory = GsonFactory.getDefaultInstance()

    fun verifyAndParse(idTokenString: String): GoogleIdToken.Payload? {
        if (clientId.isBlank()) return null
        return try {
            val verifier = GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                .setAudience(listOf(clientId))
                .build()
            val idToken: GoogleIdToken? = verifier.verify(idTokenString)
            idToken?.payload
        } catch (_: Exception) {
            null
        }
    }

    fun isConfigured(): Boolean = clientId.isNotBlank()
}
