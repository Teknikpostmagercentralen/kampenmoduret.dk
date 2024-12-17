<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import {FirebaseConnection} from "../../lib/firebase/firebaseconnection";
    import type {User} from "../../lib/models/user";

/*
    Responsable for redirecting to /game if user is not admin
*/

    onMount(async () => {
        if (browser) {
            FirebaseConnection.getInstance().then(async (instance) => {
                await instance.onUserReady(async () => {
                    const admin = await instance.isAdmin();
                    if (!admin) {
                        await goto("/game");
                    }
                });
            });
        }
    });
</script>

<slot /> <!-- Render the rest of the page here -->