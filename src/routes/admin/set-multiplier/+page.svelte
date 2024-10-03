<script lang="ts">
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import { onMount } from 'svelte';

    let inputFieldValue: number
    // Simulate getting the prefilled value from a script
    onMount(async () => {
        // This could be a call to an API or any other async data retrieval method
        inputFieldValue = await FirebaseConnection.getInstance().then((instance) => {
            return instance.getGameMultiplier()

        })
    });

    // Function to handle saving the new value
    async function saveNewValue() {
        await FirebaseConnection.getInstance().then(async (instance) => {
            await instance.setMultiplierValue(inputFieldValue)
        })
        // Call your API or function to save the new value here
    }
</script>

<div class="container">
    <div class="field">
        <label class="label">Edit the Value</label>
        <div class="control">
            <input
                    class="input"
                    type="text"
                    bind:value={inputFieldValue}
                    placeholder="Enter new value"
            />
        </div>
    </div>

    <div class="control">
        <button class="button is-primary" on:click={saveNewValue}>Save</button>
    </div>
</div>