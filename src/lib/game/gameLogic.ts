import { FirebaseConnection } from "$lib/firebase/firebaseconnection";
import type { Game } from "$lib/models/game";
import type { Team } from "$lib/models/team";

export async function getRunoutTimestamp(team: Team, game: Game): Promise<number> {
    if (game.started) {
        // Calculate the sum of teams collected time
        // Get teams bonus time
        // Sum bonus and collected time
        // Get time since game start (using current time)
        // return total time minus time since game start or zero if result is negative
    }
    return 42;
}

export function calculateTimeLeft(runoutTimestamp:number): number {
    return 42;
}