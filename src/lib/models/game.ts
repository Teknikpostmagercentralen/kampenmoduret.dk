import {GameState} from "./game-state";

export interface Game {
    multiplier: number,
    startTimestamp?: number
    gameState: GameState;
}