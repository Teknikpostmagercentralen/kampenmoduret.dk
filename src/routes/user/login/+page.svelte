<script lang="ts">
	import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
	import {NotValidCredentialsError} from '../../../lib/firebase/firebaseconnection';
	import {goto} from '$app/navigation';
	import type {UserState} from '../../../stores/userstate';
	import {userState} from '../../../stores/userstate';

	let email: string = '';
	let password: string = '';
	let error: string | null = null;

	let test = import.meta.env.VITE_FIREBASE_API_KEY
	console.log(test)

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
				error = 'Invalid email or password. Please check your credentials and try again.';
			} else if (e.code === 'auth/user-not-found') {
				console.log('User not found');
				error = 'No user found with this email address.';
			} else if (e.code === 'auth/wrong-password') {
				console.log('Wrong password');
				error = 'The password you entered is incorrect.';
			} else if (e.code === 'auth/invalid-email') {
				console.log('Invalid email');
				error = 'The email address is not properly formatted.';
			} else if (e.code === 'auth/user-disabled') {
				console.log('User account disabled');
				error = 'This account has been disabled by an administrator.';
			} else if (e.code === 'auth/too-many-requests') {
				console.log('Too many requests');
				error = 'We have blocked all requests from this device due to unusual activity. Please try again later.';
			} else if (e.code === 'auth/network-request-failed') {
				console.log('Network error');
				error = 'A network error has occurred. Please check your connection and try again.';
			} else {
				console.error('An unknown error occurred:', e);
				error = 'An unknown error occurred. Please try again later.';
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
