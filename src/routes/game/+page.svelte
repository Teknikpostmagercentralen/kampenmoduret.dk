<script lang="ts">
	import { userState } from '../../stores/userstate';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { FirebaseConnection } from '../../lib/firebase/firebaseconnection';
	import type { User } from '$lib/models/user';

	let user: User;

	if (browser) {
		FirebaseConnection.registerAuthCallback({
			onUserLoggedIn: (currentUser) => {
				user = currentUser;
			},
			onUnauthenticated: () => {
				//goto("/user/login");
				user = { firebaseUserID: '' };
				console.log('Unauthenticated');
			}
		});
	}
</script>

<main>
	{#if user}
		<h1>This is the {user.firebaseUserID}</h1>
	{/if}
</main>
