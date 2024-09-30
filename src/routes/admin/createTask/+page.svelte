<script lang="ts">
	import { browser } from "$app/environment";
	import { goto, invalidateAll } from "$app/navigation";
    import {FirebaseConnection} from "../../../lib/firebase/firebaseconnection";

    let letter: string;
    let number: number;
    let baseTime: number;

    function createTask() {
        if (browser) {
            FirebaseConnection.getInstance().then((instance)=>{
                instance.onUserReady(async ()=>{
                    await instance.createTask(letter, number, baseTime);
                    goto('/admin');
                });
            });
        }
    }
    
</script>

<svelte:head>
    <title>Create task</title>
</svelte:head>
<section class="section">
    <div class="container is-max-desktop">
        <h1 class="title">Create task</h1>

        <form class="box" on:submit|preventDefault={createTask}>
            <div class="field">
                <label class="label">Letter</label>
                <div class="control">
                    <input
                        type="text"
                        class="input"
                        placeholder="A"
                        maxlength="1"
                        required
                        bind:value={letter}
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">Number</label>
                <div class="control">
                    <input
                        type="number"
                        class="input"
                        placeholder="0"
                        required
                        bind:value={number}
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">Base Time</label>
                <div class="control">
                    <input
                        type="number"
                        class="input"
                        placeholder="0"
                        required
                        bind:value={baseTime}
                    />
                </div>
            </div>

            <button type="submit" class="button is-primary">Create Task</button>
        </form>
    </div>
</section>
