<script lang="ts">
	import { browser } from '$app/environment';
	import type { Task } from '$lib/models/task';
	import { FirebaseConnection } from '../../../lib/firebase/firebaseconnection';
	import { ConfigConstants } from '$lib/config/config-constants';

	let tasks: Task[];

	function getTasks() {
		FirebaseConnection.getInstance().then((instance) => {
			instance.onUserReady(async () => {
				tasks = await instance.getTasks();
			});
		});
	}

	function generateQrUrl(key: string, task: Task): string {
		const baseURL = ConfigConstants.getURL()
		const taskUrl = `${baseURL}/tasks/${key}`;
		const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(taskUrl)}`;
		return qrUrl;
	}

	if (browser) {
		getTasks();
	}
</script>

<svelte:head>
	<title>Task Printout</title>
</svelte:head>
<section class="section">
	{#if tasks}
		<div class="columns is-multiline">
			<div class="column is-half">
				<div class="box" style="margin-bottom:8rem">
					<p class="title is-4 has-text-centered">Task QR codes</p>
				</div>
			</div>
			{#each Object.entries(tasks) as [key, task]}
				<div class="column is-half">
					<div class="box" style="margin-bottom:8rem">
						<p class="title is-4 has-text-centered">
							{task.taskMarker.letter + task.taskMarker.number}
						</p>
						<figure class="image is-square">
							<img src={generateQrUrl(key, task)} />
						</figure>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
