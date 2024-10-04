<script lang="ts">
    import type {Team, TeamWithTime} from '../../../lib/models/team';
    import {FirebaseConnection} from '../../../lib/firebase/firebaseconnection';
    import {browser} from '$app/environment';
    import type {Game} from '$lib/models/game';
    import {getTimeLeft} from '$lib/game/gameLogic';
    import {onDestroy} from 'svelte';
    import {sumCollectedTime} from "../../../lib/game/gameLogic";

    let teamsShownInTable: TeamWithTime[] // the public data in the table, so we can control when its updated. ANd its not jsut updated while calculating new valuesd
    let gameDataFromFirebase: Game; //global data that ias the last raw data received from firebase, in global field becasse ease and lazyness
    let teamDataFromFirebase: Team[] //global data that ias the last raw data received from firebase, in global field becasse ease and lazyness
    let timeout: NodeJS.Timeout;

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
        if (!teamDataFromFirebase && !gameDataFromFirebase) return
        let teamsWithTime: TeamWithTime[] = []
        for (const [key, team] of Object.entries(teamDataFromFirebase)) {
            const timeleft = await getTimeLeft(team, gameDataFromFirebase)
            if (timeleft === 0) {
                FirebaseConnection.getInstance().then(async (instance) => {
                    await instance.setTeamDead(key)
                })
            }
            const teamWithTime: TeamWithTime = {...team, secondsLeft: timeleft, allSecondsEarned: sumCollectedTime(team.completedTasks) + team.bonusTime}
            teamsWithTime.push(teamWithTime)
        }

        //Sort the thing to mak the game sorted
        //fixme; this is VERY innefficient and c an be done in many more more clever ways. But are lazy and IT will have to due for now
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

</script>

{#if teamsShownInTable}
    <table class="table is-striped is-hoverable is-fullwidth">
        <thead>
        <tr>
            <th>Name</th>
            <th>Time Left</th>
            <th>Seconds Earned</th>
            <th>Nr Participants</th>
            <th>Last Task</th>
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
{/if}
