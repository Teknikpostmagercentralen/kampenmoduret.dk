// src/lib/game/teamMonitor.ts
import {get} from 'svelte/store';
import {teamDataForAdmin} from '$lib/stores/teamDataForAdmin';
import {gameDataForAdmin} from '$lib/stores/gameDataForAdmin';
import {getTimeLeft, shouldTeamBeMarkedDead} from '$lib/game/gameLogic';
import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
import {GameState} from "../models/game-state";

export class TeamTicker {
    private static instance: TeamTicker;
    private running = false;

    private constructor() {
    }

    public static getInstance(): TeamTicker {
        if (!TeamTicker.instance) {
            TeamTicker.instance = new TeamTicker();
        }
        return TeamTicker.instance;
    }

    public start() {
        if (this.running) return;
        this.running = true;
        console.log('[TeamTicker] Started');
        this.tick();
    }

    public stop() {
        if (!this.running) return;
        this.running = false;
        console.log('[TeamTicker] Stopped');
    }

    /**
     *            const teams = get(rawTeamData); // Get raw team data
     *            if (Object.keys(teams).length === 0) return; //if no teams on list fail fast
     *
     *            for (const [teamId, team] of Object.entries(teams)) {
     * 				const game = get(rawGameData);
     *
     * 				try {
     * 					const secondsLeft = await getTimeLeft(team, game);
     *
     * 					await FirebaseConnection.getInstance().then(async (instance) => {
     * 						let dead = await instance.isTeamDead(teamId);
     * 						if (!dead) {
     * 							let shouldbeDead = shouldTeamBeMarkedDead(game, team, teamId, secondsLeft);
     * 							if (shouldbeDead) {
     * 								await instance.setTeamDead(teamId);
     * 								console.log('You dead jim: ' + team.username + ' - ' + teamId);
     * 								console.log('timeleft: ' + secondsLeft);
     * 							}
     * 						}
     * 					});
     * 				} catch (e) {
     * 					//empty catch
     * 				}
     * 			}
     * @private
     */

    private async tick() {
        if (!this.running) return;

        const teams = get(teamDataForAdmin);
        const game = get(gameDataForAdmin);

        if (!teams || !game || Object.keys(teams).length === 0) { //if no teams on list or no game fail fast
            this.scheduleNextTick();
            return;
        }

        if (game.gameState === GameState.STARTED || game.gameState === GameState.DEACTIVATED) { // dont calculate if does not make sense for game. But keep runnign the timer.

            try {
                const instance = await FirebaseConnection.getInstance();

                for (const [teamId, team] of Object.entries(teams)) {
                    try {
                        const secondsLeft = await getTimeLeft(team, game);
                        const isDead = await instance.isTeamDead(teamId);

                        if (!isDead && shouldTeamBeMarkedDead(game, team, teamId, secondsLeft)) {
                            await instance.setTeamDead(teamId);
                            console.log(`💀 ${team.username} marked dead`);
                        }
                    } catch (e) {
                        console.warn('Error checking team', teamId, e);
                    }
                }
            } catch (e) {
                console.error('Fatal error in TeamTicker tick():', e);
            }

        }


        this.scheduleNextTick(); // wait 1 sec AFTER tick is complete
    }

    private scheduleNextTick() {
        if (!this.running) return;

        setTimeout(() => this.tick(), 1000);
    }
}