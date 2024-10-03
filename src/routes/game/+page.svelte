<script lang="ts">
	import { browser } from '$app/environment';
	import { FirebaseConnection } from '../../lib/firebase/firebaseconnection';
	import { onDestroy } from 'svelte';
	import type { Team } from '$lib/models/team';
	import { getTimeLeft } from '$lib/game/gameLogic';
	import type { Game } from '$lib/models/game';
	import type { User } from '../../lib/models/user';

	let user: User;
	let timeLeft: number; // Set the starting time
	let team: Team;
	let game: Game;
	let timeout: NodeJS.Timeout;

	async function getUser() {
		const firebaseConnection = await FirebaseConnection.getInstance();
		firebaseConnection.registerUserListener({
			onDataChanged: (userUpdate) => {
				user = userUpdate;
				firebaseConnection.registerTeamListener(user, {
					onDataChanged: async (teamUpdate) => {
						team = teamUpdate;
						if (team && game) {
							timeLeft = await getTimeLeft(team, game);
							console.log(timeLeft);
						}
					}
				});
				firebaseConnection.registerGameListener({
					onDataChanged: async (gameUpdate) => {
						game = gameUpdate;
						if (team && game) {
							timeLeft = await getTimeLeft(team, game);
							console.log(timeLeft);
						}
					}
				});
			}
		});
	}

	onDestroy(async () => {
		clearTimeout(timeout);
		await FirebaseConnection.getInstance().then((instance) => {
			instance.killAllListenersFromThisPage();
		});
	});

	function updateTimeLeft() {
		timeout = setTimeout(async () => {
			if (team && game) {
				timeLeft = await getTimeLeft(team, game);
				console.log(timeLeft);
			}
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

	if (browser) {
		getUser();
		updateTimeLeft();
	}
</script>

<main>
	{#if timeLeft !== undefined && game && game.started}
		<div
			class={`hero is-fullheight is-flex is-justify-content-center is-align-items-center ${timeLeft === 0 ? 'has-background-danger' : 'has-background-success'}`}
		>
			<div class="has-text-white has-text-centered" style="font-size: 8rem;">
				{formatTime(timeLeft)}
			</div>

			<!-- Lower right corner number -->
			<div
				class="has-text-white"
				style="position: absolute; bottom: 20px; right: 20px; font-size: 2.5rem;"
			>
				{team.participants}
			</div>
		</div>
	{:else}
		<div
			class={`hero is-fullheight is-flex is-justify-content-center is-align-items-center has-background-warning`}
		>
			{#if game && !game.started}
				<p class="title is-4">Waiting for game to start</p>
			{:else}
				<p class="title is-4">Loading</p>
			{/if}
			<progress class="progress is-info is-two-thirds" max="100" style="width: 66%;"></progress>
		</div>
	{/if}
</main>
