package uz.shukrullaev.com.skyrush.controllers

import jakarta.validation.Valid
import kotlinx.coroutines.flow.Flow
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import uz.shukrullaev.com.skyrush.DTOs.CreateTournamentRequest
import uz.shukrullaev.com.skyrush.DTOs.RegisterTeamRequest
import uz.shukrullaev.com.skyrush.DTOs.TournamentDetailResponse
import uz.shukrullaev.com.skyrush.DTOs.TournamentSummaryResponse
import uz.shukrullaev.com.skyrush.DTOs.TournamentTeamResponse
import uz.shukrullaev.com.skyrush.services.TournamentService

@RestController
@RequestMapping("/api/v1")
class TournamentController(
    private val tournamentService: TournamentService,
) {

    @GetMapping("/tournaments")
    fun listTournaments(): Flow<TournamentSummaryResponse> = tournamentService.listSummaries()

    @GetMapping("/tournaments/{id}")
    suspend fun getTournament(@PathVariable id: Long): TournamentDetailResponse =
        tournamentService.getDetail(id)

    @PostMapping("/tournaments")
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun createTournament(@Valid @RequestBody request: CreateTournamentRequest): TournamentSummaryResponse =
        tournamentService.create(request)

    @PostMapping("/tournaments/{id}/teams")
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun registerTeam(
        @PathVariable id: Long,
        @Valid @RequestBody request: RegisterTeamRequest,
    ): TournamentTeamResponse = tournamentService.registerTeam(id, request)
}
