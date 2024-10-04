import { FirebaseConnection } from "$lib/firebase/firebaseconnection";
import type { CompletedTaskInTeams } from "$lib/models/completed-task-in-teams";
import type { Game } from "$lib/models/game";
import type { TaskDictionary, Team } from "$lib/models/team";
import type { BenchTask } from "vitest";

export function sumCollectedTime(completedTasks: TaskDictionary | undefined): number {
    let sum = 0;
    if (completedTasks) {
        Object.entries(completedTasks).forEach(([key, task]) => {
            sum += task.timeEarned;
        });
    }
    return sum;
}

export async function getTimeLeft(team: Team, game: Game): Promise<number> {
    // Calculate the sum of teams collected time
    const collectedTime = sumCollectedTime(team.completedTasks);
    // Get teams bonus time
    const bonusTime = team.bonusTime || 0;
    // Sum bonus and collected time
    const totalTimeCollectedFromTeam = collectedTime + bonusTime;
    // Get time since game control-game (using current time)
    if (game.startTimestamp) {
        const d = new Date();
        const timeSinceGameStart = Math.round((d.getTime() - game.startTimestamp) / 1000.0);
        // return total time minus time since game control-game or zero if result is negative
        const timeLeft = totalTimeCollectedFromTeam - timeSinceGameStart;
        if (timeLeft > 0) {
            return timeLeft
        } else {
            return 0;
        }
    } else {
        throw new Error("Makrelsalat");
    }
}