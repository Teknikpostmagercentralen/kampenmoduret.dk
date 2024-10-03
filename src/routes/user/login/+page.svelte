<script lang="ts">
	import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
	import {NotValidCredentialsError} from '../../../lib/firebase/firebaseconnection';
	import {goto} from '$app/navigation';
	import type {UserState} from '../../../stores/userstate';
	import {userState} from '../../../stores/userstate';

	let email: string = '';
	let password: string = '';
	let error: string | null = null;

	async function handleLogin() {
		try {
			const firebaseConnection = await FirebaseConnection.getInstance();
			const user = await firebaseConnection.login(email, password);
			console.log(`Logged in ${user.firebaseUserID}`);

			await userState.update((state: UserState) => {
				return {
					...state,
					loggedIn: true,
					user: user
				};
			});

			const isAdmin = await firebaseConnection.isAdmin()
			if(isAdmin) {
				await goto("/admin")
			} else {
				await goto('/game');

			}

		} catch (e) {
			if (e instanceof NotValidCredentialsError) {
				console.log('Not valid credentials');
				error = 'Not Valid Credentials';
			}
		}
	}
</script>

<main>
	<div class="login-container">
		<h1 class="title">Login</h1>
		<div class="field">
			<label class="label" for="email">Email</label>
			<div class="control">
				<input
					class="input"
					type="email"
					id="email"
					bind:value={email}
					placeholder="e.g. alex@example.com"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label" for="password">Password</label>
			<div class="control">
				<input
					class="input"
					type="password"
					id="password"
					bind:value={password}
					placeholder="********"
				/>
			</div>
		</div>
		{#if error}
			<div class="notification is-danger">
				{error}
			</div>
		{/if}
		<div class="field">
			<div class="control">
				<button class="button is-primary" on:click={handleLogin}>Login</button>
			</div>
		</div>
	</div>
</main>

<style>
	.login-container {
		max-width: 400px;
		margin: 0 auto;
		padding: 20px;
	}
</style>
