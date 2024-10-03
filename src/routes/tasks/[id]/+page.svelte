<script lang="ts">
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import {goto} from '$app/navigation';
    import {browser} from '$app/environment';
    import {TwoOfTheSameTaskError} from "../../../lib/firebase/firebaseconnection";

    /** @type {import('./$types').PageData} */
    export let data;
    let errormessage: string;


    /** Fixme move to all the pages */
    if (browser) {
        FirebaseConnection.getInstance().then((instance) => {
            instance.onUserReady(() => {
                    instance.writeTaskCompleted(data.taskID).then(() => {
                        // No error, navigate immediately
                        goto('/game');

                    }).catch((reason: TwoOfTheSameTaskError)=>{
                        if(reason.name === "SAME_LETTER" ) errormessage = "You cannot check in tasks with the same letter twice in a row"
                        console.log("lol")
                        setTimeout(() => {
                            goto('/game');
                        }, 5000); // Delay in milliseconds
                    })
            });
        });
    }
</script>

<style>
    .task-id {
        color: black;
        font-size: 2rem;
        text-align: center;
        margin-top: 20px;
    }

    .error-message {
        font-size: 2rem;
        color: red;
        font-weight: bold;
        text-align: center;
        margin-top: 10px;
    }
</style>

<p class="task-id">{data.taskID}</p>

    {#if errormessage}
        <p class="error-message">{errormessage}</p>
    {/if}

