<script lang="ts">
	import {goto} from '$app/navigation';
	import {browser} from '$app/environment';
	import {FirebaseConnection} from '../../lib/firebase/firebaseconnection';
	import type {User} from '$lib/models/user';
	import {onDestroy} from 'svelte';

	let user: User;

    async function getUser() {
        const firebaseConnection = await FirebaseConnection.getInstance();
        firebaseConnection.registerUserListener({onDataChanged:(userUpdate)=>{
            user = userUpdate;
        }});
    }

	if (browser) {
		FirebaseConnection.getInstance().then(async (instance) => {
			await instance.onUserReady(async () => {
				await getUser();
			});
		});
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
			goto('/admin/scoreboard');
		}}>See Scoreboard</button
	>


	<button
		on:click={() => {
			goto('/admin/create-task');
		}}>Create new task</button
	>
	<button
		on:click={() => {
			goto('/tasks/A1');
		}}>Add task A1</button
	>
	<button
		on:click={() => {
			goto('/admin/register-team');
		}}>Add team</button
	>
	<button
		on:click={() => {
			goto('/user/login');
		}}>Login</button
	>
	<button
		on:click={() => {
			goto('/user/logout');
		}}>Logout</button
	>
	<button
		on:click={() => {
			goto('/admin/control-game');
		}}>Control game</button
	>
	<button
			on:click={() => {
			goto('/admin/set-multiplier');
		}}>Set multiplier</button
	>
	{#if user}
		<h1>Current UID is {user.firebaseUserID}</h1>
	{/if}
</main>
