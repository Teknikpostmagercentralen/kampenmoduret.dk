<script lang="ts">
	import { userState } from '../../stores/userstate';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { FirebaseConnection } from '../../lib/firebase/firebaseconnection';
	import type { User } from '$lib/models/user';
	import { onDestroy } from 'svelte';

	let user: User;

    async function getUser() {
        const firebaseConnection = await FirebaseConnection.getInstance();
        firebaseConnection.registerUserListener({onDataChanged:(userUpdate)=>{
            user = userUpdate;
        }});
    }

	if (browser) {
		getUser();
	}

    onDestroy(async ()=>{
        await FirebaseConnection.getInstance().then((instance)=>{
            instance.killAllListenersFromThisPage();
        });
    });
</script>

<main>
	<button
		on:click={() => {
			goto('/tasks/123');
		}}>Add task 123</button
	>
	<button
		on:click={() => {
			goto('/admin/registerTeam');
		}}>Add team</button
	>
	{#if user}
		<h1>This is the {user.firebaseUserID}</h1>
	{/if}
</main>
