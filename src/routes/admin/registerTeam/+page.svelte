<script lang="ts">
	import { browser } from "$app/environment";
    import {FirebaseConnection} from "../../../lib/firebase/firebaseconnection";

    let email: string;
    let teamName: string;
    let password: string;
    let success: boolean | undefined;
    let error: { code: string; message: string };
    let user = {uid: "geh"} //fixme Delete this line

    function register() {
        if (browser) {
            FirebaseConnection.register(teamName, email, password)
        }
    }


    
</script>

<svelte:head>
    <title>Register</title>
</svelte:head>
<section class="section">
    <div class="container is-max-desktop">
        <h1 class="title">Register</h1>

        <form class="box" on:submit|preventDefault={register}>
            <div class="field">
                <label class="label">Team name</label>
                <div class="control">
                    <input
                        type="text"
                        class="input"
                        placeholder="Team name"
                        required
                        bind:value={teamName}
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">Email</label>
                <div class="control">
                    <input
                        type="email"
                        class="input"
                        placeholder="Email"
                        required
                        bind:value={email}
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">Password</label>
                <div class="control">
                    <input
                        type="password"
                        class="input"
                        placeholder="Password"
                        required
                        bind:value={password}
                    />
                </div>
            </div>

            <button type="submit" class="button is-primary">Register</button>
        </form>
        {#if !success && success !== undefined}
            <div class="notification is-danger">
                {error?.message}
            </div>
        {/if}

        {#if success && success !== undefined}
            <div class="notification is-success">
                User {teamName} with user id {user.uid} was created!🎉
            </div>
        {/if}
    </div>
</section>
