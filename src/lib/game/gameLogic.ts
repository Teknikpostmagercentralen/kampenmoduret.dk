import { FirebaseConnection } from "$lib/firebase/firebaseconnection";
import type { CompletedTaskInTeams } from "$lib/models/completed-task-in-teams";
import type { Game } from "$lib/models/game";
import type { TaskDictionary, Team } from "$lib/models/team";
import type { BenchTask } from "vitest";

function sumCollectedTime(completedTasks: TaskDictionary|undefined): number {
    let sum = 0;
    if (completedTasks) {
        Object.entries(completedTasks).forEach(([key, task]) => {
            sum += task.timeEarned;
          });
    }
    return sum;
}

export async function getRunoutTimestamp(team: Team, game: Game): Promise<number> {
    if (game.started) {
        // Calculate the sum of teams collected time
        const collectedTime = sumCollectedTime(team.completedTasks);
        // Get teams bonus time
        const bonusTime = team.bonusTime;
        // Sum bonus and collected time
        const totalTime = collectedTime+bonusTime;
        // Get time since game start (using current time)
        //const d = new Date();
        //const timeSinceGameStart = game.startTimestamp - (d.getTime()/1000)
        // return total time minus time since game start or zero if result is negative
    }
    return 42;
}

export function calculateTimeLeft(runoutTimestamp:number): number {
    return 42;
}