<script lang="ts">
	import { userState } from '../../stores/userstate';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { FirebaseConnection } from '../../lib/firebase/firebaseconnection';
	import type { User } from '$lib/models/user';
	import { onDestroy } from 'svelte';
	import type { Team } from '$lib/models/team';

	let user: User;
	let timeLeft = 10; // Set the starting time
	let team: Team;

	async function getUser() {
		const firebaseConnection = await FirebaseConnection.getInstance();
		firebaseConnection.registerUserListener({
			onDataChanged: (userUpdate) => {
				user = userUpdate;
				firebaseConnection.registerTeamListener(user, {
					onDataChanged: (teamUpdate) => {
						team = teamUpdate;
					}
				});
			}
		});
	}

	if (browser) {
		getUser();
	}

	onDestroy(async () => {
		await FirebaseConnection.getInstance().then((instance) => {
			instance.killAllListenersFromThisPage();
		});
	});

	// Timer countdown logic
	const countdown = () => {
		if (timeLeft > 0) {
			setTimeout(() => {
				timeLeft--;
				countdown();
			}, 1000);
		}
	};

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

	countdown();
</script>

<main>
	{#if user && team}
		<div
			class={`hero is-fullheight is-flex is-justify-content-center is-align-items-center ${timeLeft === 0 ? 'has-background-danger' : 'has-background-success'}`}
		>
			<div class="has-text-white has-text-centered" style="font-size: 10vw;">
				{formatTime(timeLeft)}
			</div>

			<!-- Lower right corner number -->
			<div
				class="has-text-white"
				style="position: absolute; bottom: 20px; right: 20px; font-size: 2vw;"
			>
				{team.participants}
			</div>
		</div>
	{/if}
</main>
