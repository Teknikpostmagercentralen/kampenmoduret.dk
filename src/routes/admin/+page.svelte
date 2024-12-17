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

    let teamsShownInTable: TeamWithTime[] // the public data in the table, so we can control when its updated. And its not just updated while calculating new values
    let gameDataFromFirebase: Game; // global data that is the last raw data received from firebase, in global field becasse ease and lazyness
    let teamDataFromFirebase: Team[] //global data that is the last raw data received from firebase, in global field becasse ease and lazyness
    let timeout: NodeJS.Timeout;

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

    // TODO: Resume refactor here
    async function getUser() {
        const firebaseConnection = await FirebaseConnection.getInstance();
        firebaseConnection.registerUserListener({
            onDataChanged: (userUpdate) => {
                user = userUpdate;
            }
        });
    }

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
     * handle update if new data is avaiæable. also is alled in an interval when we aant to update data in the table
     */
    async function updateTableData() {
        if (!teamDataFromFirebase || !gameDataFromFirebase) return
        let teamsWithTime: TeamWithTime[] = []
        for (const [key, team] of Object.entries(teamDataFromFirebase)) {
            const timeleft = await getTimeLeft(team, gameDataFromFirebase)
            if (timeleft === 0) {
                await FirebaseConnection.getInstance().then(async (instance) => {
                    // if (!await instance.isTeamDead(key)) await instance.setTeamDead(key) //only do this once
                })
            }
            const teamWithTime: TeamWithTime = {
                ...team,
                secondsLeft: timeleft,
                allSecondsEarned: sumCollectedTime(team.completedTasks) + team.bonusTime
            }
            teamsWithTime.push(teamWithTime)
        }

        //Sort the thing to mak the game sorted
        //fixme; this is VERY inneficient and c an be done in many more more clever ways. But are lazy and IT will have to due for now
        teamsWithTime.sort((a, b) => b.allSecondsEarned - a.allSecondsEarned);

        teamsShownInTable = teamsWithTime
    }

    if (browser) {
        FirebaseConnection.getInstance().then(async (instance) => {
            instance.registerTeamsListener({
                onDataChanged: async (teamsUpdate) => {
                    teamDataFromFirebase = teamsUpdate
                    await updateTableData(); //trigger update on new team data if there is both game and teams already

                }
            });
            instance.registerGameListener({
                onDataChanged: async (gameUpdate) => {
                    gameDataFromFirebase = gameUpdate;
                    await updateTableData(); //trigger update on new game data if there is both game and teams already
                }
            });
        });
        updateTimeLeft()
    }

    function updateTimeLeft() {
        timeout = setTimeout(async () => {
            await updateTableData()
            updateTimeLeft();
        }, 1000);
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

            {#if teamsShownInTable}
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
                        {#each teamsShownInTable as team}
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