<script lang="ts">
    import {browser} from '$app/environment';
    import type {Task} from '$lib/models/task';
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import {ConfigConstants} from '$lib/config/config-constants';
    import {NoTasksInDatabase} from "../../../../lib/firebase/firebaseconnection";
    import {catalog} from "$lib/language/index.js";

    let tasks: Task[] = [];
    let loading = true;
    let error: string | null = null;

    async function getTasks() {
        try {
            const instance = await FirebaseConnection.getInstance();
            await instance.onUserReady(async () => {
                const admin = await instance.getAdmin();
                const gameId = Object.keys(admin.games)[0];
                const taskMap = await instance.getAllTasksInGame(gameId);
                tasks = Object.values(taskMap);
            });
        } catch (err) {
            if (err instanceof NoTasksInDatabase) {
                tasks = []; // Ingen data – vis tom tilstand
            } else {
                error = 'Der opstod en fejl under hentning af opgaver.';
                console.error(err);
            }
        } finally {
            loading = false;
        }
    }

    function generateQrUrl(key: string, task: Task): string {
        const baseURL = ConfigConstants.getURL();
        const taskUrl = `${baseURL}/tasks/${key}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(taskUrl)}`;
        return qrUrl;
    }

    if (browser) {
        getTasks();
    }
</script>

<style>
    @media print {
        .no-print {
            display: none !important;
        }
    }
</style>

<svelte:head>
    <title>{catalog.screens.printTasks.title}</title>
</svelte:head>

<section class="section">
    <div class="no-print mb-4">
        <a href="/admin" class="button is-light">← {catalog.button_texts.go_back_to_dashboard}</a>
    </div>

    {#if loading}
        <p class="has-text-grey">{catalog.screens.printTasks.loading_tasks}</p>
    {:else if error}
        <p class="has-text-danger">{error}</p>
    {:else if tasks.length === 0}
        <div class="box has-text-centered" style="padding: 4rem; border: 2px dashed #ccc;">
	<span class="icon is-large has-text-grey-light">
		<i class="fas fa-tasks fa-3x"></i>
	</span>
            <p class="title is-5 has-text-grey-dark mt-3">{catalog.screens.printTasks.no_tasks}</p>
            <p class="has-text-grey">{catalog.screens.printTasks.no_task_add_it}</p>
        </div>
    {:else}
        <div class="columns is-multiline">
            <div class="column is-full">
                <div class="box no-print" style="margin-bottom:8rem">
                    <p class="title is-4 has-text-centered">{catalog.screens.printTasks.QRHeading}</p>
                </div>
            </div>

            {#each tasks as task, i}
                <div class="column is-half">
                    <div class="box" style="margin-bottom:8rem">
                        <p class="title is-4 has-text-centered">
                            {task.taskMarker.letter}{task.taskMarker.number}
                        </p>
                        <figure class="image is-square">
                            <img src={generateQrUrl(i.toString(), task)} alt="QR code"/>
                        </figure>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</section>