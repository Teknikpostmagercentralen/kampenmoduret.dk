<script>
    import { onMount } from 'svelte';

    let prefilledValue = '';
    let newValue = '';

    // Simulate getting the prefilled value from a script
    onMount(() => {
        // This could be a call to an API or any other async data retrieval method
        prefilledValue = 'This is the prefilled value';
        newValue = prefilledValue;
    });

    // Function to handle saving the new value
    function saveNewValue() {
        console.log('Saving new value:', newValue);
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
                    bind:value={newValue}
                    placeholder="Enter new value"
            />
        </div>
    </div>

    <div class="control">
        <button class="button is-primary" on:click={saveNewValue}>Save</button>
    </div>
</div>