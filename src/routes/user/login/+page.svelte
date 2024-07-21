<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import {FirebaseConnection} from '$lib/firebase/firebaseconnection';
    import {NotValidCredentialsError} from "../../../lib/firebase/firebaseconnection";
    import {goto} from "$app/navigation";
    import {userState} from '../../../stores/userstate';
    import type {UserState} from '../../../stores/userstate';

    let email: string = '';
    let password: string = '';
    let error: string | null = null;

    async function handleLogin() {
        // Placeholder login logic - replace with actual login logic

        try {
            const user = await FirebaseConnection.login(email, password)
            console.log(`Logged in ${user.userID}`)

            await userState.update((state: UserState) => {
                return {
                    ...state,
                    loggedIn: true, user: user
                };
            })

            await goto("/game")

        } catch (e) {
            if (e instanceof NotValidCredentialsError) {
                console.log("Not valid credentials")
                error = "HEJ"
            }

        }
    }

</script>

<style>
    .login-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
    }
</style>

<main>
    <div class="login-container">
        <h1 class="title">Login</h1>
        <div class="field">
            <label class="label" for="email">Email</label>
            <div class="control">
                <input class="input" type="email" id="email" bind:value={email} placeholder="e.g. alex@example.com"/>
            </div>
        </div>
        <div class="field">
            <label class="label" for="password">Password</label>
            <div class="control">
                <input class="input" type="password" id="password" bind:value={password} placeholder="********"/>
            </div>
        </div>
        {#if error}
            <div class="notification is-danger">
                {error}
            </div>
        {/if}
        <div class="field">
            <div class="control">
                <button class="button is-primary" on:click={handleLogin}>Login</button>
            </div>
        </div>
    </div>
</main>