<script lang="ts">
	import { FirebaseConnection } from '$lib/firebase/firebaseconnection';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	/** @type {import('./$types').PageData} */
	export let data;

	if (browser) {
		FirebaseConnection.getInstance().then((instance) => {
			instance.onUserReady(() => {
				instance.writeTaskCompleted(data.taskID).then(() => {
					goto('/game');
				});
			});
		});
	}
</script>

<h1>{data.taskID}</h1>
