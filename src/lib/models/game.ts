import {GameState} from "./game-state";

export interface Game {
    gameLengthInSeconds: number,
    multiplier: number,
    startTimestamp?: number
    gameState: GameState;
}