<script lang="ts">
    import {goto} from '$app/navigation';
    import {browser} from '$app/environment';
    import type {User} from '$lib/models/user';
    import {onDestroy, onMount} from 'svelte';
    import type {Team, TeamWithTime} from '$lib/models/team';
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import type {Game} from '$lib/models/game';
    import {getTimeLeft} from '$lib/game/gameLogic';
    import {sumCollectedTime} from "$lib/game/gameLogic";
    import {get, writable} from "svelte/store";
    import { afterNavigate } from '$app/navigation';
    import {PUBLIC_CURRENT_URL} from '$env/static/public';

    const teamsShownInTable = writable<TeamWithTime[]>([]);// the public data in the table, so we can control when its updated. And its not just updated while calculating new values
    let timeout: NodeJS.Timeout;
    let rawTeamData = writable<Record<string, Team>>({});

    const rawGameData = writable<Game>({
        gameLengthInSeconds: 0,   // Default to 0 or another placeholder value
        multiplier: 1,            // Default multiplier
        started: false           // Assume the game hasn't started
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

    onMount(() => {
        console.log(`Onmount: ${PUBLIC_CURRENT_URL}`);
        console.log("HEJHEHEHJE")
    });


    afterNavigate(() => {
        console.log('Navigated to new page hej');
    });




    if (browser) {
        FirebaseConnection.getInstance().then(async (instance) => {
            await instance.onUserReady(async () => {
                await getUser();
            });
        });
    }

    onDestroy(async () => {
        await FirebaseConnection.getInstance().then((instance) => {
            instance.killAllListenersFromThisPage();
        });
    });

    FirebaseConnection.getInstance().then(async (instance) => {
        instance.onUserReady(async () => (
            displayName = await instance.getAdminDisplayName()
        ))
    })


    onDestroy(async () => {
        clearTimeout(timeout);
        await FirebaseConnection.getInstance().then((instance) => {
            instance.killAllListenersFromThisPage();
        });
    });

    /**
     * At an interval we recalculate and update the time (NB this is called at an interval to make countdown work)
     */
    async function recalculateTableTime() {
        const teams = get(rawTeamData); // Get the raw team data as a Record<string, Team>
        const gameData = get(rawGameData); // Get the game data

        if (!teams || Object.keys(teams).length === 0 || !gameData || gameData.gameLengthInSeconds === 0) {
            console.log("Teams or game data is missing or invalid.");
            return;
        }

        let temporaryTeamsWithTime: TeamWithTime[] = []
        for (const [key, team] of Object.entries(teams)) {
            const timeleft = await getTimeLeft(team, gameData)
            if (timeleft === 0) {
                await FirebaseConnection.getInstance().then(async (instance) => {
                    //TODO WAS THE BUG HERE?
                    // if (!await instance.isTeamDead(key)) await instance.setTeamDead(key) //only do this once
                })
            }
            const teamWithTime: TeamWithTime = {
                ...team,
                secondsLeft: timeleft,
                allSecondsEarned: sumCollectedTime(team.completedTasks) + team.bonusTime
            }
            temporaryTeamsWithTime.push(teamWithTime)
        }

        teamsShownInTable.set(temporaryTeamsWithTime)
    }

    // function sortTable() {
    //     teamsShownInTable.update((teams) => {
    //         if (!teams || teams.length === 0) {
    //             console.log("teamsShownInTable is empty.");
    //             return teams; // No changes if empty
    //         }
    //
    //         // Sort the teams by `allSecondsEarned` in descending order
    //         const sortedTeams = [...teams].sort((a, b) => b.allSecondsEarned - a.allSecondsEarned);
    //         console.log("Sorted teams:", sortedTeams);
    //         return sortedTeams;
    //     });
    // }

    if (browser) {
        FirebaseConnection.getInstance().then(async (instance) => {
            instance.registerTeamsListener({
                onDataChanged: async (teamsUpdate) => {
                    rawTeamData.set(teamsUpdate)
                    // Process and update the table data
                    updateAndSortTableData()
                }
            });

            instance.registerGameListener({
                onDataChanged: async (gameUpdate) => {
                    rawGameData.set(gameUpdate)
                    updateAndSortTableData()
                }
            });
        });
        updateTimeLeft() // start the timer
    }

    function sortTeams(teams: Team[], gameData: Game): TeamWithTime[] {
        return teams
            .map((team) => ({
                ...team,
                secondsLeft: getTimeLeft(team, gameData), // Calculate time left
                allSecondsEarned: sumCollectedTime(team.completedTasks) + team.bonusTime, // Calculate total earned time
            }))
            .sort((a, b) => b.allSecondsEarned - a.allSecondsEarned); // Sort by allSecondsEarned
    }

    async function updateAndSortTableData() {
        rawTeamData.subscribe(async (teams) => {
            if (typeof teams !== 'object' || !teams || Object.keys(teams).length === 0) {
                console.log("Teams data is missing or empty.");
                return;
            }

            rawGameData.subscribe(async (gameData: Game) => {
                if (gameData.gameLengthInSeconds === 0) {
                    console.log("Game data is missing or invalid.");
                    return;
                }

                const teamArray = Object.values(teams);

                // Use Promise.all to wait for all async operations
                const processedTeams = await Promise.all(
                    teamArray.map(async (team) => {
                        const timeleft = await getTimeLeft(team, gameData);
                        return {
                            ...team,
                            secondsLeft: timeleft,
                            allSecondsEarned: sumCollectedTime(team.completedTasks) + team.bonusTime,
                        };
                    })
                );

                // Sort the processed teams
                processedTeams.sort((a, b) => b.allSecondsEarned - a.allSecondsEarned);

                // Update the writable store
                teamsShownInTable.set(processedTeams);
            });
        });
    }

    function updateTimeLeft() {
        timeout = setTimeout(async () => {
            await recalculateTableTime()
            updateTimeLeft();
        }, 1000)
    }

    function addZero(input: number): string {
        if (input < 10) {
            return `0${input}`;
        } else {
            return `${input}`;
        }
    }

    function formatTime(time: number): string {
        const m = Math.floor(time / 60);
        const s = time % 60;
        return `${addZero(m)}:${addZero(s)}`;
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
                <button class="button has-background-grey-dark has-text-white"
                        on:click={() => {
				            goto('/admin/create-task');
			            }}>Create new task
                </button>

                <button class="button has-background-grey-dark has-text-white"
                        on:click={() => {
				            goto('/admin/register-team');
			            }}>Add team
                </button>
            </div>
        </div>

        <div class="box">
            <h2 class="subtitle has-text-grey">Game controls</h2>
            <div class="buttons">
                <button class="button has-background-grey-dark has-text-white"
                        on:click={async () => {
                            await confirmAction("set new start timestamp", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.startGame();
                                });
                            });
			            }}>Set new start timestamp (no reset)
                </button>

                <button class="button has-background-danger has-text-white"
                        on:click={async () => {
                            await confirmAction("start the game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.resetAllTeams();
                                    await instance.startGame();
                                });
                            });
			            }}>START game
                </button>

                <button class="button has-background-danger has-text-white"
                        on:click={async () => {
                            await confirmAction("deactivate the game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.stopGame();
                                });
                            });
			            }}>Deactivate Game
                </button>

                <button class="button has-background-danger has-text-white"
                        on:click={async () => {
                            await confirmAction("activate the game", async () => {
                                await FirebaseConnection.getInstance().then(async (instance) => {
                                    await instance.setGameStarted();
                                });
                            });
			            }}>Activate Game
                </button>
            </div>
        </div>

        <div class="box">
            <h2 class="subtitle has-text-grey">Team score overall</h2>

            {#if $teamsShownInTable}
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
                        {#each $teamsShownInTable as team}
                            <tr class:has-text-danger={team.deathTimestamp}>
                                <td>{team.username}</td>
                                <td>{formatTime(team.secondsLeft)}</td>
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
            {/if}
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