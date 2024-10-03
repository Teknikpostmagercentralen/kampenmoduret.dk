<script lang="ts">
	import type { Team, TeamWithTime } from '$lib/models/team';
	import { FirebaseConnection } from '../../../lib/firebase/firebaseconnection';
	import { browser } from '$app/environment';
	import type { Game } from '$lib/models/game';
	import { getTimeLeft } from '$lib/game/gameLogic';
	import { onDestroy } from 'svelte';

	let teams: Team[];
	let teamsWithTime: TeamWithTime[];
	let game: Game;
    let timeout: NodeJS.Timeout;

    onDestroy(async () => {
		clearTimeout(timeout);
		await FirebaseConnection.getInstance().then((instance) => {
			instance.killAllListenersFromThisPage();
		});
	});

	if (browser) {
		FirebaseConnection.getInstance().then(async (instance) => {
			instance.registerTeamsListener({
				onDataChanged: async (teamsUpdate) => {
					teams = teamsUpdate;
                    console.log(teams);
                    await calculateTimesLeft();
				}
			});
			instance.registerGameListener({
				onDataChanged: async (gameUpdate) => {
					game = gameUpdate;
                    console.log(game);
                    await calculateTimesLeft();
				}
			});
		});
        updateTimeLeft()
	}

    function updateTimeLeft() {
		timeout = setTimeout(async () => {
				await calculateTimesLeft();
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

	async function calculateTimesLeft() {
		if (game && teams) {
			let newTeamsWithTime: TeamWithTime[] = await Promise.all(
				teams.map(async (team) => {
					const teamWithTime: TeamWithTime = {
						username: team.username,
						email: team.email,
						bonusTime: team.bonusTime,
						participants: team.participants,
						lastCompletedTask: team.lastCompletedTask,
						completedTasks: team.completedTasks,
						secondsleft: await getTimeLeft(team, game)
					};
					return teamWithTime;
				})
			);
			teamsWithTime = newTeamsWithTime;
            console.log(teamsWithTime);
		}
	}
</script>

{#if teamsWithTime}
	<table class="table is-striped is-hoverable is-fullwidth">
		<thead>
			<tr>
				<th>Name</th>
				<th>Time Left</th>
				<th>Nr Participants</th>
				<th>Last Task</th>
			</tr>
		</thead>
		<tbody>
			{#each teamsWithTime as team}
				<tr>
					<td>{team.username}</td>
					<td>{formatTime(team.secondsleft)}</td>
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
