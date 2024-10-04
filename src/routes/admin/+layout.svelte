<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import {FirebaseConnection} from "../../lib/firebase/firebaseconnection";
    import type {User} from "../../lib/models/user";

    let user: User;

    async function getUser() {
        const firebaseConnection = await FirebaseConnection.getInstance();
        firebaseConnection.registerUserListener({onDataChanged:(userUpdate)=>{
                user = userUpdate;
            }});
    }

    onMount(async () => {
        if (browser) {
            FirebaseConnection.getInstance().then(async (instance) => {
                await instance.onUserReady(async () => {
                    await getUser();
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