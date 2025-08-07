<script lang="ts">
    import {goto} from '$app/navigation';
    import {browser} from '$app/environment';
    import type {User} from '$lib/models/user';
    import {onDestroy, onMount} from 'svelte';
    import type {Team, TeamWithTime} from '$lib/models/team';
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import type {Game} from '$lib/models/game';
    import {
        sumCollectedTime,
        GameInWrongStateError,
        getTimeLeft,
        shouldTeamBeMarkedDead
    } from '$lib/game/gameLogic';
    import {derived, get, writable} from 'svelte/store';
    import {GameState} from '$lib/models/game-state';
    import {readable} from 'svelte/store';
    import {TimeFormatter} from '$lib/game/time-formatter.js';
    import {TeamTicker} from '$lib/game/teamTicker';
    import {gameDataForAdmin} from "$lib/stores/gameDataForAdmin";
    import {teamDataForAdmin} from "$lib/stores/teamDataForAdmin";
    import {catalog} from "$lib/language/index.js";

    let tickerTimer: ReturnType<typeof setTimeout>;

    /* Value is never used but because the table is derived from the value its updated when the value is updated ewhich is every second*/
    export const timeTicker = readable(0, (set) => {
        const interval = setInterval(() => {
            set(Date.now());
        }, 1000);

        return () => clearInterval(interval); // oprydning
    });

    const teamsShownInTable = writable<TeamWithTime[]>([]); // the public data in the table, so we can control when its updated. And its not just updated while calculating new values

    let user: User;
    let displayName: string;
    let gameId: string;

    let gameMultiplierInputFieldValue: number;

    // Function to handle saving new multiplier value
    async function saveNewValue() {
        await FirebaseConnection.getInstance().then(async (instance) => {
            await instance.setMultiplierValue(gameMultiplierInputFieldValue, gameId);
        });
    }

    async function registerAllListeners() {
        const instance = await FirebaseConnection.getInstance();
        instance.registerUserListener({
            onDataChanged: async (userUpdate) => {
                user = userUpdate;

                const admin = await instance.getAdmin();
                gameId = Object.keys(admin.games)[0];

                // Get current multiplier value and update input field on page load
                gameMultiplierInputFieldValue = await instance.getGameMultiplier(gameId);

                instance.registerGameListener(gameId, {
                    onDataChanged: async (gameUpdate) => {
                        gameDataForAdmin.set(gameUpdate);
                    }
                });

                instance.registerTeamsListener(gameId, {
                    // TODO: This really needs to be tested
                    onTeamChangedOrAdded: async (teamUpdate) => {
                        teamDataForAdmin.update((current) => {
                            return {
                                ...current,
                                [teamUpdate.id]: teamUpdate
                            };
                        });
                        // Process and update the table data
                    },
                    onTeamRemovedFromGame: (removedTeamId) => {
                        teamDataForAdmin.update((current) => {
                            const copy = {...current};
                            delete copy[removedTeamId];
                            return copy;
                        });
                    }
                });
            }
        });
    }

    onDestroy(async () => {
        await FirebaseConnection.getInstance().then((instance) => {
            instance.killAllListenersFromThisPage();
        });

        TeamTicker.getInstance().stop();
        clearTimeout(tickerTimer);
    });
    export const teamsShownInTableV2 = derived(
        [teamDataForAdmin, gameDataForAdmin, timeTicker],
        ([teams, gameData], set) => {
            (async () => {
                if (!teams || !gameData || Object.keys(teams).length === 0) {
                    set([]);
                    return;
                }

                if (Object.keys(teams).length === 0) return; //if no teams on list fail fast
                if (Object.keys(gameData).length === 0) return; //if no teams on list fail fast

                const teamArray = Object.values(teams);

                const processedTeams: TeamWithTime[] = await Promise.all(
                    teamArray.map(async (team) => {
                        let timeLeft;
                        try {
                            timeLeft = await getTimeLeft(team, gameData);
                        } catch (e) {
                            if (e instanceof GameInWrongStateError) {
                            }
                        }

                        return {
                            ...team,
                            secondsLeft: timeLeft,
                            allSecondsEarned: sumCollectedTime(team.completedTasks) + team.bonusTime
                        };
                    })
                );

                processedTeams.sort((a, b) => b.allSecondsEarned - a.allSecondsEarned);

                set(processedTeams);
            })();
        }
    );

    if (browser) {
        FirebaseConnection.getInstance().then(async (instance) => {
            await instance.onUserReady(async () => {
                displayName = await instance.getAdminDisplayName();
                await registerAllListeners();
                TeamTicker.getInstance().start(); // start the timer to update teams when game runs (timer will handle not being started twice and not running in wrong game state
            });
        });
    }

    // Function to confirm actions
    async function confirmAction(actionName: string, action: () => Promise<void>) {
        if (confirm(`Are you sure you want to ${actionName}? This action cannot be undone.`)) {
            await action();
        }
    }
</script>

<main class="section">
    <div class="container">
        <!-- Logout Link, positioned in the top right of the page, outside the box -->
        <div style="position: absolute; top: 20px; right: 20px;">
            <a
                    class="is-size-6 has-text-grey"
                    href="#"
                    on:click={() => {
					goto('/user/logout');
				}}>{catalog.admin.links.log_out}</a
            >
        </div>

        {#if displayName}
            <h1 class="title has-text-grey">{catalog.admin.headings.greeting} {displayName}</h1>
        {/if}

            <div class="box">
                <h2 class="subtitle has-text-grey mb-4">{catalog.admin.headings.setting_up}</h2>

                <!-- Task management -->
                <p class="is-size-6 has-text-weight-semibold has-text-grey-dark mb-2">Task management</p>
                <div class="buttons">
                    <button class="button is-link" on:click={() => goto('/admin/create-task')}>
                        <span class="icon"><i class="fas fa-plus"></i></span>
                        <span>{catalog.admin.buttons.add_tasks}</span>
                    </button>

                    <button class="button is-link is-light" on:click={() => goto('/admin/edit-tasks')}>
                        <span class="icon"><i class="fas fa-edit"></i></span>
                        <span>{catalog.admin.buttons.edit_tasks}</span>
                    </button>
                </div>

                <!-- Team management -->
                <p class="is-size-6 has-text-weight-semibold has-text-grey-dark mt-5 mb-2">Team management</p>
                <div class="buttons">
                    <button class="button is-link is-light" on:click={() => goto('/admin/register-team')}>
                        <span class="icon"><i class="fas fa-users"></i></span>
                        <span>{catalog.admin.buttons.add_team}</span>
                    </button>

                    <button class="button is-link is-light" on:click={() => goto('/admin/edit-teams')}>
                        <span class="icon"><i class="fas fa-edit"></i></span>
                        <span>{catalog.admin.buttons.edit_teams}</span>
                    </button>
                </div>

                <!-- Print / Export -->
                <p class="is-size-6 has-text-weight-semibold has-text-grey-dark mt-5 mb-2">Print / export</p>
                <div class="buttons">
                    <button class="button is-light" on:click={() => goto('/admin/print/tasks')}>
                        <span class="icon"><i class="fas fa-print"></i></span>
                        <span>{catalog.admin.buttons.print_tasks}</span>
                    </button>

                    <button class="button is-light" on:click={() => goto('/admin/print/teams')}>
                        <span class="icon"><i class="fas fa-qrcode"></i></span>
                        <span>{catalog.admin.buttons.print_qr_button_text}</span>
                    </button>
                </div>
            </div>

            <!-- game controls -->
            <div class="box">
                <h2 class="subtitle has-text-grey mb-4">{catalog.admin.headings.game_control}</h2>

                <!-- Group 1: Starting phase -->
                <p class="is-size-6 has-text-weight-semibold has-text-grey-dark mb-2">{catalog.admin.headings.phase_control}</p>
                <div class="buttons mb-4">
                    <button
                            class="button is-dark"
                            on:click={async () => {
				await confirmAction('start the game', async () => {
					await FirebaseConnection.getInstance().then(async (instance) => {
						if (gameId) {
                          await instance.startGame(gameId);
                          TeamTicker.getInstance().start(); // start the timer to update teams
						}

					});
				});
			}}
                            disabled={$gameDataForAdmin.gameState !== GameState.WELCOME}
                    >
                        <span class="icon"><i class="fas fa-play"></i></span>
                        <span>{catalog.admin.buttons.start}</span>
                    </button>
                </div>

                <!-- Group 2: In-game state -->
                <p class="is-size-6 has-text-weight-semibold has-text-grey-dark mb-2">{catalog.admin.headings.game_state}</p>
                <div class="buttons mb-4">
                    <button
                            class="button is-dark"
                            on:click={async () => {
				await confirmAction('activate the game', async () => {
					await FirebaseConnection.getInstance().then(async (instance) => {
						if (gameId) await instance.setGameStarted(gameId);
					});
				});
			}}
                            disabled={$gameDataForAdmin.gameState === GameState.STARTED || $gameDataForAdmin.gameState === GameState.STOPPED || $gameDataForAdmin.gameState === GameState.WELCOME}
                    >
                        <span class="icon"><i class="fas fa-flag-checkered"></i></span>
                        <span>{catalog.admin.buttons.activate}</span>
                    </button>


                    <button
                            class="button is-dark"
                            on:click={async () => {
				await confirmAction('deactivate the game', async () => {
					await FirebaseConnection.getInstance().then(async (instance) => {
						if (gameId) await instance.deactivateGame(gameId);
					});
				});
			}}
                            disabled={$gameDataForAdmin.gameState === GameState.DEACTIVATED || $gameDataForAdmin.gameState === GameState.STOPPED || $gameDataForAdmin.gameState === GameState.WELCOME}
                    >
                        <span class="icon"><i class="fas fa-power-off"></i></span>
                        <span>{catalog.admin.buttons.deactivate}</span>
                    </button>
                </div>

                <!-- Group 3: Danger zone -->
                <p class="is-size-6 has-text-weight-semibold has-text-danger mb-2">{catalog.admin.headings.danger}</p>
                <div class="buttons">

                    <button
                            class="button is-dark"
                            on:click={async () => {
				await confirmAction('stop the game', async () => {
					await FirebaseConnection.getInstance().then(async (instance) => {
						if (gameId) await instance.stopGame(gameId);
						TeamTicker.getInstance().stop();
					});
				});
			}}
                            disabled={$gameDataForAdmin.gameState === GameState.STOPPED || $gameDataForAdmin.gameState === GameState.WELCOME}
                    >
                        <span class="icon"><i class="fas fa-stop"></i></span>
                        <span>{catalog.admin.buttons.stop}</span>
                    </button>

                    <button
                            class="button is-danger"
                            on:click={async () => {
				await confirmAction('DELETE all data and RESET game', async () => {
					await FirebaseConnection.getInstance().then(async (instance) => {
						if (gameId) {
							await instance.resetAllTeams(gameId);
							await instance.resetGameToWelcomeState(gameId);
						}
					});
				});
			}}
                            disabled={$gameDataForAdmin.gameState !== GameState.STOPPED}

                    >
                        <span class="icon"><i class="fas fa-trash-alt"></i></span>
                        <span>{catalog.admin.buttons.reset}</span>
                    </button>
                </div>
            </div>

            <div class="box">
                <h2 class="subtitle has-text-grey">{catalog.admin.headings.team_score}</h2>

                <div class="table-container">
                    <table class="table is-striped is-hoverable is-fullwidth">
                        <thead>
                        <tr class="has-background-grey-lighter">
                            <th class="has-text-grey-dark">{catalog.admin.table.name}</th>
                            <th class="has-text-grey-dark">{catalog.admin.table.time_left}</th>
                            <th class="has-text-grey-dark">{catalog.admin.table.seconds_earned}</th>
                            <th class="has-text-grey-dark">{catalog.admin.table.nr_of_participants}</th>
                            <th class="has-text-grey-dark">{catalog.admin.table.last_task}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {#if $teamsShownInTableV2}
                            {#each $teamsShownInTableV2 as team}
                                <tr class:has-text-danger={team.deathTimestamp}>
                                    <td>{team.username}</td>
                                    <td>
                                        {#if $gameDataForAdmin.gameState === GameState.STARTED || $gameDataForAdmin.gameState === GameState.DEACTIVATED}
                                            {TimeFormatter.formatTime(team.secondsLeft)}
                                        {:else if $gameDataForAdmin.gameState === GameState.STOPPED}
                                            {TimeFormatter.formatTime(team.secondsLeft)}
                                        {:else}
                                            --:--
                                        {/if}
                                    </td>
                                    <td>{team.allSecondsEarned}</td>
                                    <td>{team.participants}</td>
                                    {#if team.lastCompletedTask}
                                        <td>{team.lastCompletedTask.letter} {team.lastCompletedTask.number}</td>
                                    {:else}
                                        <td>No completed task</td>
                                    {/if}
                                </tr>
                            {/each}
                        {/if}
                        </tbody>
                    </table>
                </div>
                <div class="box">
                    <h2 class="subtitle has-text-grey">{catalog.admin.buttons.edit_multiplier_button}</h2>
                    <div class="field">
                        <label class="label has-text-grey-dark">{catalog.admin.headings.edit_the_value}</label>
                        <div class="control">
                            <input
                                    class="input"
                                    type="number"
                                    bind:value={gameMultiplierInputFieldValue}
                                    placeholder={catalog.admin.strings.multiplier_new_value_placeholder}
                            />
                        </div>
                    </div>

                    <p class="has-text-grey-dark mt-5 mb-5">
                        {catalog.admin.strings.multiplier_help_text}
                    </p>

                    <div class="control">
                        <button class="button has-background-primary has-text-white" on:click={saveNewValue}
                        >{catalog.admin.buttons.multiplier_save}
                        </button
                        >
                    </div>
                </div>
            </div>
        </div>
</main>
