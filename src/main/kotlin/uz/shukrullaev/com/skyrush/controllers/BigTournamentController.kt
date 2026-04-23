package uz.shukrullaev.com.skyrush.controllers

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import uz.shukrullaev.com.skyrush.DTOs.AdvanceBigQualifierRoundRequest
import uz.shukrullaev.com.skyrush.DTOs.MarkGoldenTeamsRequest
import uz.shukrullaev.com.skyrush.DTOs.RecordBigMatchGameRequest
import uz.shukrullaev.com.skyrush.DTOs.StartBigQualifiersRequest
import uz.shukrullaev.com.skyrush.services.BigTournamentProgressService

@RestController
@RequestMapping("/api/v1/tournaments/{id}/big")
class BigTournamentController(
    private val bigTournamentProgressService: BigTournamentProgressService,
) {
    @PostMapping("/golden-teams")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun markGoldenTeams(
        @PathVariable id: Long,
        @Valid @RequestBody request: MarkGoldenTeamsRequest,
    ) {
        bigTournamentProgressService.markGoldenTeams(id, request.teamIds)
    }

    @PostMapping("/qualifiers/start")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun startQualifiers(
        @PathVariable id: Long,
        @Valid @RequestBody request: StartBigQualifiersRequest,
    ) {
        bigTournamentProgressService.startQualifiers(id, request.orderedNonGoldenSeeds, request.bestOf)
    }

    @PostMapping("/qualifiers/next-round")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun createNextQualifierRound(
        @PathVariable id: Long,
        @Valid @RequestBody request: AdvanceBigQualifierRoundRequest,
    ) {
        bigTournamentProgressService.createNextQualifierRound(id, request.bestOf)
    }

    @PostMapping("/matches/{matchId}/games")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun recordGameResult(
        @PathVariable id: Long,
        @PathVariable matchId: Long,
        @Valid @RequestBody request: RecordBigMatchGameRequest,
    ) {
        bigTournamentProgressService.recordGameResult(id, matchId, request.winnerTeamId)
    }
}
