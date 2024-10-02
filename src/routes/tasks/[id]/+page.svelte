<script lang="ts">
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import {goto} from '$app/navigation';
    import {browser} from '$app/environment';

    /** @type {import('./$types').PageData} */
    export let data;
    let errormessage: string;


    if (browser) {
        FirebaseConnection.getInstance().then((instance) => {
            instance.onUserReady(() => {
                try {
                    instance.writeTaskCompleted(data.taskID).then(() => {
                        goto('/game');
                    });
                } catch (e: any) {
                    errormessage = "hjehjehejehe"

                }
            });
        });
    }
</script>

<h1>{data.taskID}

    {#if errormessage}
        {errormessage}
    {/if}
</h1>
