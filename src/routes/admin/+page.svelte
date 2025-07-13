<script lang="ts">
    import {goto} from '$app/navigation';
    import {browser} from '$app/environment';
    import type {User} from '$lib/models/user';
    import {onDestroy, onMount} from 'svelte';
    import type {Team, TeamWithTime} from '$lib/models/team';
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import type {Game} from '$lib/models/game';
    import {sumCollectedTime, GameInWrongStateError, getTimeLeft, shouldTeamBeMarkedDead} from "$lib/game/gameLogic";
    import {derived, get, writable} from "svelte/store";
    import {GameState} from '$lib/models/game-state';
    import {readable} from 'svelte/store';
    import {TimeFormatter} from "$lib/game/time-formatter.js";

    let updateTeamsLoopTimer: ReturnType<typeof setTimeout>;
    let tickerTimer: ReturnType<typeof setTimeout>;

    /* Value is never used but because the table is derived from the value its updated when the value is updated ewhich is every second*/
    export const timeTicker = readable(0, (set) => {
        const interval = setInterval(() => {
            set(Date.now());
        }, 1000);

        return () => clearInterval(interval); // oprydning
    });


    function startUpdateTeamsLoop() {
        setTimeout(async () => {
            const teams = get(rawTeamData); // Get raw team data
            if (Object.keys(teams).length === 0) return; //if no teams on list fail fast

            for (const [teamId, team] of Object.entries(teams)) {
                const game = get(rawGameData)

                try {
                    const secondsLeft = await getTimeLeft(team, game);

                    await FirebaseConnection.getInstance().then(async (instance) =>{
                        let dead = await instance.isTeamDead(teamId)
                        if(!dead){
                            let shouldbeDead = shouldTeamBeMarkedDead(game, team, teamId, secondsLeft)
                            if(shouldbeDead) {
                                await instance.setTeamDead(teamId)
                                console.log("You dead jim: " + team.username + " - " + teamId)
                                console.log("timeleft: " + secondsLeft)
                            }
                        }

                    })
                } catch (e) {
                    //empty catch
                }


            }

            startUpdateTeamsLoop(); // Continue loop
        }, 1000);
    }

    const teamsShownInTable = writable<TeamWithTime[]>([]);// the public data in the table, so we can control when its updated. And its not just updated while calculating new values
    let rawTeamData = writable<Record<string, Team>>({});

    const rawGameData = writable<Game>({
        multiplier: 1,                                      // Default multiplier
        gameState: GameState.WELCOME                        // Assume the game is in welcome state
    });

    let user: User;
    let displayName: string;

    let gameMultiplierInputFieldValue: number
    // Get current multiplier value and update input field on page load
    onMount(async () => {
        gameMultiplierInputFieldValue = await FirebaseConnection.getInstance().then((instance) => {
            return instance.getGameMultiplier()
        })
    });

    // Function to handle saving new multiplier value
    async function saveNewValue() {
        await FirebaseConnection.getInstance().then(async (instance) => {
            await instance.setMultiplierValue(gameMultiplierInputFieldValue)
        })
    }

    async function getUser() {
        const firebaseConnection = await FirebaseConnection.getInstance();
        firebaseConnection.registerUserListener({
            onDataChanged: (userUpdate) => {
                user = userUpdate;
            }
        });
    }


    onDestroy(async () => {
        await FirebaseConnection.getInstance().then((instance) => {
            instance.killAllListenersFromThisPage();
        });

        clearTimeout(updateTeamsLoopTimer);
        clearTimeout(tickerTimer);
        await FirebaseConnection.getInstance().then((instance) => {
            instance.killAllListenersFromThisPage();
        });
    });
    export const teamsShownInTableV2 = derived(
        [rawTeamData, rawGameData, timeTicker],
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
                            allSecondsEarned: sumCollectedTime(team.completedTasks) + team.bonusTime,
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
                displayName = await instance.getAdminDisplayName()
                await getUser();
            });
        });

        FirebaseConnection.getInstance().then(async (instance) => {
            instance.registerTeamsListener({
                onDataChanged: async (teamsUpdate) => {
                    rawTeamData.set(teamsUpdate)
                    // Process and update the table data
                }
            });

            instance.registerGameListener({
                onDataChanged: async (gameUpdate) => {
                    rawGameData.set(gameUpdate)
                }
            });
            startUpdateTeamsLoop(); // start the timer to update teams
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
            <a class="is-size-6 has-text-grey" href="#" on:click={() => { goto('/user/logout'); }}>Logout</a>
        </div>

        {#if displayName}
            <h1 class="title has-text-grey">Hello {displayName}</h1>
        {/if}

        <div class="box">
            <h2 class="subtitle has-text-grey">General controls</h2>
            <div class="buttons">
                <button class="button is-link"
                        on:click={() => {
				            goto('/admin/create-task');
			            }}>Create new task
                </button>

                <button class="button is-link"
                        on:click={() => {
				            goto('/admin/register-team');
			            }}>Add team
                </button>
                <button class="button is-link"
                        on:click={() => {
				            goto('/admin/print-tasks');
			            }}>Print tasks
                </button>
            </div>
        </div>

        <div class="box">
            <h2 class="subtitle has-text-grey">Game controls</h2>
            <div class="buttons">
                <button class="button is-dark"
                        on:click={async () => {
                            await confirmAction("start the game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.startGame();
                                });
                            });
			            }}
                        disabled='{$rawGameData.gameState !== GameState.WELCOME}'
                >START game
                </button>

                <button class="button is-dark"
                        on:click={async () => {
                            await confirmAction("deactivate the game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.deactivateGame();
                                });
                            });
			            }}
                        disabled='{$rawGameData.gameState === GameState.DEACTIVATED || $rawGameData.gameState === GameState.STOPPED || $rawGameData.gameState === GameState.WELCOME}'
                >Deactivate Game
                </button>

                <button class="button is-dark"
                        on:click={async () => {
                            await confirmAction("activate the game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.setGameStarted();
                                });
                            });
			            }}
                        disabled='{$rawGameData.gameState === GameState.STARTED || $rawGameData.gameState === GameState.STOPPED || $rawGameData.gameState === GameState.WELCOME}'
                >Activate Game
                </button>

                <button class="button is-dark"
                        on:click={async () => {
                            await confirmAction("stop the game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.stopGame();
                                });
                            });
			            }}
                        disabled='{$rawGameData.gameState === GameState.STOPPED || $rawGameData.gameState === GameState.WELCOME}'
                >Stop Game
                </button>

                <button class="button is-danger"
                        on:click={async () => {
                            await confirmAction("DELETE all data and RESET game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.resetAllTeams();
                                    await instance.resetGameToWelcomeState();
                                });
                            });
			            }}>DELETE all data and RESET game
                </button>
            </div>
        </div>

        <div class="box">
            <h2 class="subtitle has-text-grey">Team score overall</h2>


            <div class="table-container">
                <table class="table is-striped is-hoverable is-fullwidth">
                    <thead>
                    <tr class="has-background-grey-lighter">
                        <th class="has-text-grey-dark">Name</th>
                        <th class="has-text-grey-dark">Time Left</th>
                        <th class="has-text-grey-dark">Seconds Earned</th>
                        <th class="has-text-grey-dark">Nr Participants</th>
                        <th class="has-text-grey-dark">Last Task</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each $teamsShownInTableV2 as team}
                        <tr class:has-text-danger={team.deathTimestamp}>
                            <td>{team.username}</td>
                            <td>
                                {#if $rawGameData.gameState === GameState.STARTED || $rawGameData.gameState === GameState.DEACTIVATED}
                                    {TimeFormatter.formatTime(team.secondsLeft)}
                                {:else if $rawGameData.gameState === GameState.STOPPED}
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
                    </tbody>
                </table>
            </div>
            <div class="box">
                <h2 class="subtitle has-text-grey">Edit the Value</h2>
                <div class="field">
                    <label class="label has-text-grey-dark">Edit the Value</label>
                    <div class="control">
                        <input
                                class="input"
                                type="number"
                                bind:value={gameMultiplierInputFieldValue}
                                placeholder="Enter new value"
                        />
                    </div>
                </div>

                <p class="has-text-grey-dark mt-5 mb-5">Whole and decimal numbers supported. For example, 1 or 5 or 1.6</p>

                <div class="control">
                    <button class="button has-background-primary has-text-white" on:click={saveNewValue}>Save</button>
                </div>
            </div>
        </div>
</main>