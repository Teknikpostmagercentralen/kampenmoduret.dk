import {GameState} from "./game-state";

export interface Game {
    multiplier: number,
    startTimestamp?: number
    stopTimestamp?: number
    gameState: GameState;
}