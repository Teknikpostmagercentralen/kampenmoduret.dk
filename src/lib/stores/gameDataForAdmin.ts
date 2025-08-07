// src/lib/stores/gameDataForAdmin.ts
import { writable } from 'svelte/store';
import type { Game } from '$lib/models/game';
import { GameState } from '$lib/models/game-state';

export const gameDataForAdmin = writable<Game>({
    gameState: GameState.WELCOME,
    multiplier: 1
});