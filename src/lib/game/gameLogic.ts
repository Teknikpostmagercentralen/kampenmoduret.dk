import {FirebaseConnection} from "$lib/firebase/firebaseconnection";
import type {CompletedTaskInTeams} from "$lib/models/completed-task-in-teams";
import type {Game} from "$lib/models/game";
import type {TaskDictionary, Team} from "$lib/models/team";
import type {BenchTask} from "vitest";

export function sumCollectedTime(completedTasks: TaskDictionary | undefined): number {
    let sum = 0;
    if (completedTasks) {
        Object.entries(completedTasks).forEach(([key, task]) => {
            sum += task.timeEarned;
        });
    }
    return sum;
}

export class GameInWrongStateError implements Error {
    constructor(message: string) {
        this.message = message
    }

    message: string;
    name: string = "GAME_IN_WRONG_STATE_TO_DO_THIS";
}

function calculateTimeFromStartTimeToOtherTime(startEpochInMillisTimestamp: number, endEpochInMillisTimestamp: number) {
    const timeSinceGameStart = Math.round((endEpochInMillisTimestamp - startEpochInMillisTimestamp) / 1000.0);
    return timeSinceGameStart;
}

/***
 *  return total time minus time since game control-game or zero if result is negative
 */
function calculateTeamTimeRoundUpToZeroIfNegative(totalTimeCollectedFromTeam: number, timeSinceGameStart: number) {
    const timeLeft = totalTimeCollectedFromTeam - timeSinceGameStart;
    if (timeLeft > 0) {
        return timeLeft
    } else {
        return 0;
    }
}

export async function getTimeLeft(team: Team, game: Game): Promise<number> {
    // Calculate the sum of teams collected time
    const collectedTime = sumCollectedTime(team.completedTasks);
    // Get teams bonus time
    const bonusTime = team.bonusTime || 0;
    // Sum bonus and collected time
    const totalTimeCollectedFromTeam = collectedTime + bonusTime;
    // Get time since game control-game (using current time)
    if (game.startTimestamp && !game.stopTimestamp) {
        const d = new Date();
        const timeSinceGameStart = calculateTimeFromStartTimeToOtherTime(game.startTimestamp, d.getTime());
        return calculateTeamTimeRoundUpToZeroIfNegative(totalTimeCollectedFromTeam, timeSinceGameStart);
    } else if (game.stopTimestamp && game.startTimestamp) {
        const timeSinceGameStart = calculateTimeFromStartTimeToOtherTime(game.startTimestamp, game.stopTimestamp);
        return calculateTeamTimeRoundUpToZeroIfNegative(totalTimeCollectedFromTeam, timeSinceGameStart);
    } else {
        throw new GameInWrongStateError("Game timestamps set in a way where it does not make sense to calculate time")
    }
}