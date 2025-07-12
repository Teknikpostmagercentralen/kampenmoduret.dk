import { FirebaseConstants } from "../firebase/firebaseConstants";

export const GameState = {
    WELCOME: FirebaseConstants.GAME_STATE_WELCOME,
    DEACTIVATED: FirebaseConstants.GAME_STATE_DEACTIVATED,
    STOPPED: FirebaseConstants.GAME_STATE_STOPPED,
    STARTED: FirebaseConstants.GAME_STATE_STARTED
} as const;

export type GameState = typeof GameState[keyof typeof GameState];